// index.js
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { CONFIG_SERVIDORES } from './config.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  client.guilds.cache.forEach(guild => {
    console.log(`🛰️ Conectado a: ${guild.name} (ID: ${guild.id})`);
  });

  // Iniciar scheduler
  try {
    startScheduler(client);
  } catch (err) {
    console.error('Error iniciando scheduler:', err.message);
  }

  // Diagnóstico de variables críticas
  console.log('ENV N8N_WEBHOOK_FAQ:', process.env.N8N_WEBHOOK_FAQ ? 'OK' : 'UNDEFINED');
  console.log('ENV DISCORD_BOT_TOKEN:', process.env.DISCORD_BOT_TOKEN ? 'OK' : 'UNDEFINED');
});

// ---------- AUXILIAR: detectar canal de soporte (incluye hilos bajo ese canal) ----------
function isSupportChannel(canal, config) {
  const soporteId = config?.canalesFijos?.soporte;
  if (!soporteId) return false;

  // Coincidencia directa
  if (canal.id === soporteId) return true;

  // Si es un hilo y su padre es el canal de soporte
  if (
    canal.type === ChannelType.PublicThread ||
    canal.type === ChannelType.PrivateThread ||
    canal.type === ChannelType.AnnouncementThread
  ) {
    return canal.parentId === soporteId;
  }
  return false;
}

// ---------- AUXILIAR: detectar si el canal está bajo la categoría de Prácticas (G10) ----------
function isPracticasCategory(canal, config, guild) {
  const practicasCategoryId = config?.categoriaPracticas;
  if (!practicasCategoryId) return false;

  // Canal normal bajo la categoría de prácticas
  if (canal.parentId === practicasCategoryId) return true;

  // Si es un hilo, comprobar la categoría del canal padre
  if (
    canal.type === ChannelType.PublicThread ||
    canal.type === ChannelType.PrivateThread ||
    canal.type === ChannelType.AnnouncementThread
  ) {
    const parentChannel = guild.channels.cache.get(canal.parentId);
    return parentChannel?.parentId === practicasCategoryId;
  }
  return false;
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const canal = message.channel;
  const canalId = canal.id;
  const categoriaId = canal.parentId;

  const config = CONFIG_SERVIDORES[guildId];
  if (!config) {
    console.warn(`⚠️ No hay configuración para el servidor ${message.guild.name} (${guildId})`);
    return;
  }

  let tipo_canal = null;
  let embajador = null;

  // 1. Verificar si es un canal fijo
  const canalFijo = Object.entries(config.canalesFijos || {}).find(([_, id]) => id === canalId);
  if (canalFijo) {
    tipo_canal = canalFijo[0];
  }

  // 2. Verificar si está dentro de una categoría de embajador
  if (!tipo_canal && config.categoriasPorEmbajador) {
    for (const [nombreEmbajador, categorias] of Object.entries(config.categoriasPorEmbajador)) {
      // Verificar si es la categoría de la embajadora
      if (categoriaId === categorias.cat_embajadora) {
        embajador = nombreEmbajador;
        tipo_canal = 'categoria_embajadora';
        break;
      }
      
      // Verificar si es uno de los canales específicos
      if (Object.values(categorias).includes(canalId)) {
        embajador = nombreEmbajador;
        tipo_canal = canal.name;
        break;
      }
    }
  }

  const payload = {
    user: message.author.username,
    user_id: message.author.id,
    content: message.content,
    message_id: message.id,
    channel: canal.name,
    channel_id: canalId,
    guild: message.guild.name,
    guild_id: guildId,
    category_id: categoriaId,
    embajador,
    tipo_canal,
    timestamp: new Date().toISOString(),
    is_reply: false,
    reply_to: null
  };

  if (message.reference?.messageId) {
    try {
      const repliedMessage = await message.fetchReference();
      payload.is_reply = true;
      payload.reply_to = {
        author: repliedMessage.author.username,
        content: repliedMessage.content,
        id: repliedMessage.id
      };
    } catch (error) {
      console.warn('⚠️ No se pudo obtener el mensaje original:', error.message);
    }
  }

  // ----------------- Lógica de ANÁLISIS -----------------
  let shouldTriggerAnalisisWebhook = false;
  const isSupport = isSupportChannel(canal, config);
  const isPracticas = guildId === '1351968535580114984' && isPracticasCategory(canal, config, message.guild);

  // ========================================
  // REGLAS PARA TERAPEUTA AKAE® G3
  // ========================================
  if (guildId === '1349434394812616784') {
    // 1. Verificar si es uno de los canales fijos (COMUNES)
    if (Object.values(config.canalesFijos || {}).includes(canalId)) {
      shouldTriggerAnalisisWebhook = true;
    }

    // 2. Verificar si está en alguna categoría de embajadora (PROPIOS)
    if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
      for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
        // Verificar si es la categoría de la embajadora
        if (categoriaId === embajadorData.cat_embajadora) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
        
        // Verificar si es uno de los canales específicos
        const canalesEmbajador = [
          embajadorData.soytuembajadora,
          embajadorData.elmardedudas,
          embajadorData.feedbackdupla
        ].filter(Boolean);

        if (canalesEmbajador.includes(canalId)) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
      }
    }
  }

  // ========================================
  // REGLAS PARA PSIKA® G10
  // ========================================
  if (guildId === '1351968535580114984') {
    // 1. Verificar si es uno de los canales fijos (COMUNES)
    if (Object.values(config.canalesFijos || {}).includes(canalId)) {
      shouldTriggerAnalisisWebhook = true;
    }

    // 2. Exclusión: la categoría de Prácticas NO activa análisis (se gestiona en el envío final)

    // 3. Verificar si está en alguna categoría de embajadora (PROPIOS)
    if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
      for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
        // Verificar si es la categoría de la embajadora
        if (categoriaId === embajadorData.cat_embajadora) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
        
        // Verificar si es uno de los canales específicos
        const canalesEmbajador = [
          embajadorData.soytuembajador,
          embajadorData.soytuembajadora,
          embajadorData.elmardedudas,
          embajadorData.feedbackdupla
        ].filter(Boolean);

        if (canalesEmbajador.includes(canalId)) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
      }
    }
  }

  // ========================================
  // REGLAS PARA SERVIDOR DE PRUEBAS HAZLOCONFLOW
  // ========================================
  if (guildId === '1377586518310522900') {
    const canalesPermitidos = [
      config.canalesFijos?.canalizaciones,
      config.canalesFijos?.faqs
    ].filter(Boolean);

    if (canalesPermitidos.includes(canalId)) {
      shouldTriggerAnalisisWebhook = true;
    }
  }

  // ✅ Enviar al webhook de análisis SOLO si cumple las condiciones y NO es canal de soporte ni categoría de prácticas (G10)
  if (shouldTriggerAnalisisWebhook && !isSupport && !isPracticas) {
    if (!config.webhookAnalisis) {
      console.error(`❌ No está definido el webhookAnalisis para ${guildId} (${config.nombre})`);
    } else {
      try {
        console.log(`[DEBUG] Enviando a webhookAnalisis: ${config.webhookAnalisis}`);
        const res = await axios.post(config.webhookAnalisis, payload);
        console.log(`[📊] Enviado a análisis (${embajador || 'global'} - ${tipo_canal || 'sin tipo'})`);
        console.log(`[✅ Webhook status: ${res.status}] Respuesta:`, res.data);
      } catch (err) {
        console.error('❌ Error al enviar al webhook de análisis:', err.message);
        console.error(err.response?.data || 'Sin respuesta del servidor');
      }
    }
  }

  // ----------------- Lógica de CANALIZACIONES (se mantiene) -----------------
  console.log(`[DEBUG_CANALIZACIONES] canalId: ${canalId}, config.canalesFijos.canalizaciones: ${config.canalesFijos?.canalizaciones}`);
  if (config.canalesFijos?.canalizaciones && canalId === config.canalesFijos.canalizaciones) {
    if (!config.webhookCanalizaciones) {
      console.error(`❌ No está definido el webhookCanalizaciones para ${guildId} (${config.nombre})`);
    } else {
      try {
        console.log(`[DEBUG] Enviando a webhookCanalizaciones: ${config.webhookCanalizaciones}`);
        const res = await axios.post(config.webhookCanalizaciones, payload);
        console.log(`[🔗] Enviado a canalizaciones webhook`);
        console.log(`[✅ Webhook status: ${res.status}] Respuesta:`, res.data);
      } catch (err) {
        console.error('❌ Error al enviar al webhook de canalizaciones:', err.message);
        console.error(err.response?.data || 'Sin respuesta del servidor');
      }
    }
  }

  // ----------------- Lógica de FAQ (ahora incluye guild y guild_id) -----------------
  if (
    (config.canalesFijos?.faqs && canalId === config.canalesFijos.faqs) ||
    (guildId === '1349434394812616784' && config.canalesFijos?.soporte && canalId === config.canalesFijos.soporte) ||
    (guildId === '1351968535580114984' && config.canalesFijos?.soporte && canalId === config.canalesFijos.soporte) ||
    isSupportChannel(canal, config)
  ) {
    try {
      console.log(`[DEBUG] Enviando a webhookFAQ: ${config.webhookFAQ}`);

      // Reutilizamos el payload completo para uniformidad y añadimos el campo específico 'question'
      const faqPayload = {
        ...payload,
        question: message.content
      };

      const res = await axios.post(config.webhookFAQ, faqPayload);
      console.log(`[🤖] Enviado a FAQ webhook`);
      console.log(`[✅ Webhook status: ${res.status}] Respuesta:`, res.data);
    } catch (err) {
      console.error('❌ Error al enviar al webhook FAQ:', err.message);
      console.error(err.response?.data || 'Sin respuesta del servidor');
    }
  }

  // ----------------- Lógica de INSTAGRAM (se mantiene) -----------------
  if (config.canalesFijos?.instagram && canalId === config.canalesFijos.instagram) {
    if (!config.webhookInstagram) {
      console.error(`❌ No está definido el webhookInstagram para ${guildId} (${config.nombre})`);
    } else {
      try {
        console.log(`[DEBUG] Enviando a webhookInstagram: ${config.webhookInstagram}`);
        const res = await axios.post(config.webhookInstagram, payload);
        console.log(`[📸] Enviado a Instagram webhook`);
        console.log(`[✅ Webhook status: ${res.status}] Respuesta:`, res.data);
      } catch (err) {
        console.error('❌ Error al enviar al webhook de Instagram:', err.message);
        console.error(err.response?.data || 'Sin respuesta del servidor');
      }
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

