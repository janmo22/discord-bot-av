import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { CONFIG_SERVIDORES } from './config.js';

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
});

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
  const canalFijo = Object.entries(config.canalesFijos).find(([nombre, id]) => id === canalId);
  if (canalFijo) {
    tipo_canal = canalFijo[0];
  }

  // 2. Verificar si está dentro de una categoría de embajador
  if (!tipo_canal) {
    for (const [nombreEmbajador, categorias] of Object.entries(config.categoriasPorEmbajador)) {
      if (Object.values(categorias).includes(categoriaId)) {
        embajador = nombreEmbajador;
        tipo_canal = canal.name; // usa el nombre real del canal
        break;
      }
    }
  }

  const payload = {
    user: message.author.username,
    user_id: message.author.id,
    content: message.content,
    message_id: message.id, // Añadido el ID del mensaje
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

  // Lógica de validación para activar el webhook de análisis
  let shouldTriggerAnalisisWebhook = false;

  // Reglas para 'Lector Akae G10'   //LOGOCA PAAR ANLSISI Y REPORTES G10/ AHOR AHEMO SCMABIADO A G3
  if (guildId === '1349434394812616784') {   //G10 : 1343220392424247316
    // 1. Verificar si es uno de los canales fijos
    if (Object.values(config.canalesFijos).includes(canalId)) {
      shouldTriggerAnalisisWebhook = true;
    }

    // 2. Verificar canales y categorías de embajadores si no es un canal fijo
    if (!shouldTriggerAnalisisWebhook) {
      for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
        // Verificar si está en la categoría de urgencias
        if (embajadorData.urgencias && categoriaId === embajadorData.urgencias) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
        // Verificar si es uno de los canales específicos del embajador
        const canalesEmbajador = [
          embajadorData.canalizacion,
          embajadorData.el_mar_de_dudas,
          embajadorData.feedbackDupla
        ].filter(Boolean); // Filtra valores no definidos

        if (canalesEmbajador.includes(canalId)) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
      }
    }
  }

  // Reglas para 'Servidor de pruebas hazloconflow'
  if (guildId === '1377586518310522900') {
    const canalesPermitidos = [
      config.canalesFijos.canalizaciones,
      config.canalesFijos.faqs
    ].filter(Boolean);

    if (canalesPermitidos.includes(canalId)) {
      shouldTriggerAnalisisWebhook = true;
    }
  }


  // ✅ Enviar al webhook de análisis SOLO si cumple las condiciones
  if (shouldTriggerAnalisisWebhook) {
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

  // ✅ Lógica para canalizaciones (nuevo webhook)
  console.log(`[DEBUG_CANALIZACIONES] canalId: ${canalId}, config.canalesFijos.canalizaciones: ${config.canalesFijos.canalizaciones}`);
  if (config.canalesFijos.canalizaciones && canalId === config.canalesFijos.canalizaciones) {
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



  // 🔁 Lógica opcional para el FAQ
  if ((config.canalesFijos.faqs && canalId === config.canalesFijos.faqs) || (guildId === '1349434394812616784' && config.canalesFijos.soporte && canalId === config.canalesFijos.soporte)) {
    try {
      console.log(`[DEBUG] Enviando a webhookFAQ: ${config.webhookFAQ}`);
      const res = await axios.post(config.webhookFAQ, {
        question: message.content,
        user: message.author.username,
        channel_id: canalId,
        message_id: message.id,
        user_id: message.author.id,
      });
      console.log(`[🤖] Enviado a FAQ webhook`);
      console.log(`[✅ Webhook status: ${res.status}] Respuesta:`, res.data);
    } catch (err) {
      console.error('❌ Error al enviar al webhook FAQ:', err.message);
      console.error(err.response?.data || 'Sin respuesta del servidor');
    }
  }




  

  // Lógica para el webhook de Instagram
  if (config.canalesFijos.instagram && canalId === config.canalesFijos.instagram) {
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
