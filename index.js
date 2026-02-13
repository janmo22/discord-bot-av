// index.js
import { Client, GatewayIntentBits, ChannelType, Partials } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';
import { CONFIG_SERVIDORES } from './config.js';
import { startScheduler } from './scheduler.js';

dotenv.config();

// -------------------------------
// CONFIGURACIÓN DEL CLIENTE DISCORD
// -------------------------------
// Intents necesarios:
// - Guilds: conocer estados/conexión de los servidores
// - GuildMessages: escuchar mensajes de texto estándar
// - MessageContent: acceder al texto para mandarlo al webhook
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// ID fijo del servidor Bhimbira® G6 (usa foros/hilos, requiere trato especial)
const BHIMBIRA_GUILD_ID = '1411656675408220211';
// ID fijo del servidor Lector Akae® G11 (mezcla texto normal + foros en DUPLAS)
const LECTOR_AKAE_GUILD_ID = '1442604968954691777';

// -------------------------------
// UTILIDADES PARA HILOS (THREADS)
// -------------------------------
/**
 * Une al bot a un hilo si todavía no se ha unido.
 * Discord solo envía messageCreate de un hilo cuando el bot forma parte del hilo.
 */
async function joinThreadIfNeeded(thread) {
  if (!thread || thread.joined || thread.archived || !thread.joinable) return;

  try {
    await thread.join();
    console.log(`[THREAD_JOIN] Unido a hilo ${thread.name} (${thread.id}) en ${thread.guild?.name || 'guild desconocida'}`);
  } catch (err) {
    console.warn(`[THREAD_JOIN] No se pudo unir al hilo ${thread?.id}: ${err.message}`);
  }
}

/**
 * Garantiza que el bot está unido a todos los hilos activos de un servidor.
 * Se usa al iniciar para Bhimbira® G6.
 */
async function ensureThreadsJoinedForGuild(guildId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    console.warn(`[THREAD_JOIN] Guild ${guildId} no encontrada en cache`);
    return;
  }

  try {
    const activeThreads = await guild.channels.fetchActiveThreads();
    activeThreads.threads.forEach(joinThreadIfNeeded);
  } catch (err) {
    console.warn(`[THREAD_JOIN] Error obteniendo hilos activos en ${guild.name}: ${err.message}`);
  }
}

// -------------------------------
// EVENTO READY: se ejecuta una vez tras iniciar sesión
// -------------------------------
client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  client.guilds.cache.forEach(guild => {
    console.log(`🛰️ Conectado a: ${guild.name} (ID: ${guild.id})`);
  });

  // Bhimbira® G6 usa canales tipo foro: nos unimos a todos los hilos activos
  ensureThreadsJoinedForGuild(BHIMBIRA_GUILD_ID);

  // Lector Akae® G11: unirse a hilos activos (DUPLAS usa foros)
  ensureThreadsJoinedForGuild(LECTOR_AKAE_GUILD_ID);

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

// -------------------------------
// AUXILIAR: detectar canal de soporte (incluye hilos bajo ese canal)
// Estos canales se excluyen del análisis y se envían como FAQ.
// -------------------------------
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

// -------------------------------
// AUXILIAR: detectar si pertenece a la categoría de Prácticas (solo Psika G10)
// Sirve para excluir esos mensajes de los envíos de análisis.
// -------------------------------
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

async function buildMessagePayload(message) {
  const payload = {
    user: message.author?.username || 'unknown',
    user_id: message.author?.id || null,
    content: message.content,
    message_id: message.id,
    channel: message.channel?.name || 'unknown',
    channel_id: message.channelId,
    guild: message.guild?.name || 'unknown',
    guild_id: message.guild?.id || null,
    category_id: message.channel?.parentId || null,
    embajador: null,
    tipo_canal: null,
    timestamp: new Date().toISOString(),
    is_reply: false,
    reply_to: null,
    message_url: message.guild ? `https://discord.com/channels/${message.guild.id}/${message.channelId}/${message.id}` : null
  };

  if (message.reference?.messageId) {
    try {
      const repliedMessage = await message.fetchReference();
      payload.is_reply = true;
      payload.reply_to = {
        author: repliedMessage.author?.username || 'unknown',
        content: repliedMessage.content,
        id: repliedMessage.id
      };
    } catch (error) {
      console.warn('⚠️ No se pudo obtener el mensaje original:', error.message);
    }
  }

  return payload;
}

async function triggerAnalisisWebhook(config, payload, extraFields = {}, logLabel = 'análisis') {
  if (!config.webhookAnalisis) {
    console.error(`❌ No está definido el webhookAnalisis para ${config.nombre}`);
    return;
  }

  const finalPayload = { ...payload, ...extraFields };
  try {
    console.log(`[DEBUG] Enviando a webhookAnalisis: ${config.webhookAnalisis}`);
    const res = await axios.post(config.webhookAnalisis, finalPayload);
    console.log(`[📊] Enviado a ${logLabel} (${finalPayload.embajador || 'global'} - ${finalPayload.tipo_canal || 'sin tipo'})`);
    console.log(`[✅ Webhook status: ${res.status}] Respuesta:`, res.data);
  } catch (err) {
    console.error(`❌ Error al enviar al webhook de ${logLabel}:`, err.message);
    console.error(err.response?.data || 'Sin respuesta del servidor');
  }
}

// -------------------------------
// EVENTO PRINCIPAL: messageCreate
// Aquí se construye el payload y se decide si va a análisis, FAQ, etc.
// -------------------------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const canal = message.channel;
  const canalId = canal.id;
  const categoriaId = canal.parentId;
  // Si es un hilo guardamos referencias a su canal padre y a la categoría del padre.
  const isThreadChannel = (
    canal.type === ChannelType.PublicThread ||
    canal.type === ChannelType.PrivateThread ||
    canal.type === ChannelType.AnnouncementThread
  );
  const threadParentChannel = isThreadChannel ? message.guild.channels.cache.get(canal.parentId) : null;
  const threadParentCategoryId = threadParentChannel?.parentId || null;

  // Listas de IDs candidatas: incluyen tanto el hilo como su canal/categoría padre.
  const candidateChannelIds = [canalId];
  if (threadParentChannel?.id) candidateChannelIds.push(threadParentChannel.id);
  const candidateCategoryIds = [categoriaId];
  if (threadParentCategoryId) candidateCategoryIds.push(threadParentCategoryId);

  const config = CONFIG_SERVIDORES[guildId];
  if (!config) {
    console.warn(`⚠️ No hay configuración para el servidor ${message.guild.name} (${guildId})`);
    return;
  }

  if (guildId === '1411656675408220211') {
    console.log('[DEBUG_BHIMBIRA] Mensaje recibido', {
      canal: `${canal.name} (${canalId})`,
      canalType: canal.type,
      categoriaId,
      threadParentChannel: threadParentChannel ? `${threadParentChannel.name} (${threadParentChannel.id})` : 'none',
      threadParentCategoryId
    });
  }

  let tipo_canal = null;
  let embajador = null;

  // 1. Verificar si es un canal fijo
  const canalFijo = Object.entries(config.canalesFijos || {}).find(([_, id]) => candidateChannelIds.includes(id));
  if (canalFijo) {
    tipo_canal = canalFijo[0];
  }

  // 2. Verificar si está dentro de una categoría de embajador
  if (!tipo_canal && config.categoriasPorEmbajador) {
    for (const [nombreEmbajador, categorias] of Object.entries(config.categoriasPorEmbajador)) {
      // Verificar si es la categoría de la embajadora
      if (categorias.cat_embajadora && candidateCategoryIds.includes(categorias.cat_embajadora)) {
        embajador = nombreEmbajador;
        tipo_canal = 'categoria_embajadora';
        break;
      }
      
      // Verificar si es uno de los canales específicos
      if (Object.values(categorias).some(id => id && candidateChannelIds.includes(id))) {
        embajador = nombreEmbajador;
        tipo_canal = canal.name;
        break;
      }
    }
  }

  // Payload base que se manda a los distintos webhooks (análisis, FAQ, etc.)
  const payload = await buildMessagePayload(message);
  payload.category_id = threadParentCategoryId || categoriaId || null;
  payload.embajador = embajador;
  payload.tipo_canal = tipo_canal;

  // ----------------- Lógica de ANÁLISIS -----------------
  let shouldTriggerAnalisisWebhook = false;
  const isSupport = isSupportChannel(canal, config);
  const isPracticas = (guildId === '1351968535580114984' || guildId === LECTOR_AKAE_GUILD_ID) && isPracticasCategory(canal, config, message.guild);

  // ========================================
  // REGLAS PARA TERAPEUTA AKAE® G3
  // ========================================
  if (guildId === '1349434394812616784') {
    // 1. Verificar si es uno de los canales fijos (COMUNES)
    if (Object.values(config.canalesFijos || {}).some(id => candidateChannelIds.includes(id))) {
      shouldTriggerAnalisisWebhook = true;
    }

    // 2. Verificar si está en alguna categoría de embajadora (PROPIOS)
    if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
      for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
        // Verificar si es la categoría de la embajadora
        if (embajadorData.cat_embajadora && candidateCategoryIds.includes(embajadorData.cat_embajadora)) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
        
        // Verificar si es uno de los canales específicos
        const canalesEmbajador = [
          embajadorData.soytuembajadora,
          embajadorData.elmardedudas,
          embajadorData.feedbackdupla
        ].filter(Boolean);

        if (canalesEmbajador.some(id => candidateChannelIds.includes(id))) {
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
    if (Object.values(config.canalesFijos || {}).some(id => candidateChannelIds.includes(id))) {
      shouldTriggerAnalisisWebhook = true;
    }

    // 2. Exclusión: la categoría de Prácticas NO activa análisis (se gestiona en el envío final)

    // 3. Verificar si está en alguna categoría de embajadora (PROPIOS)
    if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
      for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
        // Verificar si es la categoría de la embajadora
        if (embajadorData.cat_embajadora && candidateCategoryIds.includes(embajadorData.cat_embajadora)) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
        
        // Verificar si es uno de los canales específicos/en proincipio no ese esta udando ahora mismo pero en un futuro puede ser util.
        const canalesEmbajador = [
          embajadorData.soytuembajador,
          embajadorData.soytuembajadora,
          embajadorData.elmardedudas,
          embajadorData.feedbackdupla
        ].filter(Boolean);

        if (canalesEmbajador.some(id => candidateChannelIds.includes(id))) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
      }
    }
  }

  // ========================================
  // REGLAS PARA BHIMBIRA® G6
  // ========================================
  if (guildId === '1411656675408220211') {
    // 1. Verificar si es uno de los canales fijos (COMUNES)
    if (Object.values(config.canalesFijos || {}).some(id => candidateChannelIds.includes(id))) {
      shouldTriggerAnalisisWebhook = true;
    }

    // 2. Verificar si está en alguna categoría de embajadora (PROPIOS)
    if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
      for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
        const categoriasPermitidas = [
          embajadorData.cat_embajadora,
          embajadorData.cat_urgencias
        ].filter(Boolean);

        if (categoriasPermitidas.some(id => id && candidateCategoryIds.includes(id))) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }

        const canalesEmbajador = [
          embajadorData.soytuembajador,
          embajadorData.soytuembajadora,
          embajadorData.elmardedudas,
          embajadorData.feedbackdupla
        ].filter(Boolean);

        if (canalesEmbajador.some(id => candidateChannelIds.includes(id))) {
          shouldTriggerAnalisisWebhook = true;
          break;
        }
      }
    }

    if (!shouldTriggerAnalisisWebhook) {
      console.log('[DEBUG_BHIMBIRA] Condiciones no cumplidas', {
        canalId,
        categoriaId,
        threadParentChannelId: threadParentChannel?.id || null,
        threadParentCategoryId,
        candidateChannelIds,
        candidateCategoryIds,
        tipo_canal,
        embajador
      });
    }
  }

  // ========================================
  // REGLAS PARA LECTOR AKAE® G11
  // ========================================
  if (guildId === LECTOR_AKAE_GUILD_ID) {
    console.log('[DEBUG_LECTOR] Mensaje recibido', {
      canal: `${canal.name} (${canalId})`,
      canalType: canal.type,
      categoriaId,
      threadParentChannel: threadParentChannel ? `${threadParentChannel.name} (${threadParentChannel.id})` : 'none',
      threadParentCategoryId,
      candidateChannelIds,
      candidateCategoryIds,
      isSupport,
      isPracticas
    });

    // 1. Verificar si es uno de los canales fijos (COMUNES)
    if (Object.values(config.canalesFijos || {}).some(id => candidateChannelIds.includes(id))) {
      shouldTriggerAnalisisWebhook = true;
      console.log('[DEBUG_LECTOR] ✅ Match en canalesFijos');
    }

    // 2. Exclusión: la categoría de Prácticas (DUPLAS) NO activa análisis (se gestiona en el envío final)

    // 3. Verificar si está en alguna categoría de embajador/a o urgencias (PROPIOS)
    if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
      for (const [nombreEmb, embajadorData] of Object.entries(config.categoriasPorEmbajador)) {
        // Verificar si es la categoría del embajador/a o de urgencias
        const categoriasPermitidas = [
          embajadorData.cat_embajadora,
          embajadorData.cat_urgencias
        ].filter(Boolean);

        if (categoriasPermitidas.some(id => candidateCategoryIds.includes(id))) {
          shouldTriggerAnalisisWebhook = true;
          console.log(`[DEBUG_LECTOR] ✅ Match en categoría embajador/urgencias: ${nombreEmb}`);
          break;
        }
        
        // Verificar si es uno de los canales específicos
        const canalesEmbajador = [
          embajadorData.soytuembajador,
          embajadorData.soytuembajadora,
          embajadorData.canalizacion,
          embajadorData.elmardedudas,
          embajadorData.feedbackdupla
        ].filter(Boolean);

        if (canalesEmbajador.some(id => candidateChannelIds.includes(id))) {
          shouldTriggerAnalisisWebhook = true;
          console.log(`[DEBUG_LECTOR] ✅ Match en canal específico embajador: ${nombreEmb}`);
          break;
        }
      }
    }

    if (!shouldTriggerAnalisisWebhook) {
      console.log('[DEBUG_LECTOR] ❌ NO se cumplió ninguna condición para análisis', {
        canalId,
        categoriaId,
        threadParentCategoryId,
        candidateChannelIds,
        candidateCategoryIds,
        tipo_canal,
        embajador,
        categoriasEmbajador: Object.entries(config.categoriasPorEmbajador || {}).map(([k, v]) => `${k}: emb=${v.cat_embajadora} urg=${v.cat_urgencias}`)
      });
    }
  }



  
  // // ========================================
  // // REGLAS PARA Bhimbira 
  // // ========================================
  // if (guildId === '1351968535580114984') {
  //   // 1. Verificar si es uno de los canales fijos (COMUNES)
  //   if (Object.values(config.canalesFijos || {}).includes(canalId)) {
  //     shouldTriggerAnalisisWebhook = true;
  //   }

  //   // 2. Exclusión: la categoría de Prácticas NO activa análisis (se gestiona en el envío final)

  //   // 3. Verificar si está en alguna categoría de embajadora (PROPIOS)
  //   if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
  //     for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
  //       // Verificar si es la categoría de la embajadora
  //       if (categoriaId === embajadorData.cat_embajadora) {
  //         shouldTriggerAnalisisWebhook = true;
  //         break;
  //       }
        
  //       // Verificar si es uno de los canales específicos/en proincipio no ese esta udando ahora mismo pero en un futuro puede ser util.
  //       const canalesEmbajador = [
  //         embajadorData.soytuembajador,
  //         embajadorData.soytuembajadora,
  //         embajadorData.elmardedudas,
  //         embajadorData.feedbackdupla
  //       ].filter(Boolean);

  //       if (canalesEmbajador.includes(canalId)) {
  //         shouldTriggerAnalisisWebhook = true;
  //         break;
  //       }
  //     }
  //   }
  // }

  //   // ========================================
  // // REGLAS PARA Lector Akae 
  // // ========================================
  // if (guildId === '1351968535580114984') {
  //   // 1. Verificar si es uno de los canales fijos (COMUNES)
  //   if (Object.values(config.canalesFijos || {}).includes(canalId)) {
  //     shouldTriggerAnalisisWebhook = true;
  //   }

  //   // 2. Exclusión: la categoría de Prácticas NO activa análisis (se gestiona en el envío final)

  //   // 3. Verificar si está en alguna categoría de embajadora (PROPIOS)
  //   if (!shouldTriggerAnalisisWebhook && config.categoriasPorEmbajador) {
  //     for (const embajadorData of Object.values(config.categoriasPorEmbajador)) {
  //       // Verificar si es la categoría de la embajadora
  //       if (categoriaId === embajadorData.cat_embajadora) {
  //         shouldTriggerAnalisisWebhook = true;
  //         break;
  //       }
        
  //       // Verificar si es uno de los canales específicos/en proincipio no ese esta udando ahora mismo pero en un futuro puede ser util.
  //       const canalesEmbajador = [
  //         embajadorData.soytuembajador,
  //         embajadorData.soytuembajadora,
  //         embajadorData.elmardedudas,
  //         embajadorData.feedbackdupla
  //       ].filter(Boolean);

  //       if (canalesEmbajador.includes(canalId)) {
  //         shouldTriggerAnalisisWebhook = true;
  //         break;
  //       }
  //     }
  //   }
  // }







  // ========================================
  // REGLAS PARA SERVIDOR DE PRUEBAS HAZLOCONFLOW
  // ========================================
  if (guildId === '1377586518310522900') {
    const canalesPermitidos = [
      config.canalesFijos?.canalizaciones,
      config.canalesFijos?.faqs
    ].filter(Boolean);

    if (canalesPermitidos.some(id => candidateChannelIds.includes(id))) {
      shouldTriggerAnalisisWebhook = true;
    }
  }

  // ✅ Enviar al webhook de análisis SOLO si cumple las condiciones y NO es canal de soporte ni categoría de prácticas (G10)
  if (shouldTriggerAnalisisWebhook && !isSupport && !isPracticas) {
    await triggerAnalisisWebhook(config, payload);
  }

  if (isPracticas) {
    const attachments = Array.from(message.attachments.values()).map(att => ({
      id: att.id,
      url: att.url,
      name: att.name,
      contentType: att.contentType
    }));

    const practicasExtra = {
      sheet_tab: 'Practicas',
      record_type: isThreadChannel ? 'thread_message' : 'message',
      attachments
    };

    await triggerAnalisisWebhook(config, payload, practicasExtra, 'Prácticas');
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
    (guildId === LECTOR_AKAE_GUILD_ID && config.canalesFijos?.soporte && canalId === config.canalesFijos.soporte) ||
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

// -------------------------------
// EVENTOS DE HILOS: unirnos automáticamente a los nuevos/actualizados en Bhimbira
// -------------------------------
function threadBelongsToPracticas(thread) {
  const guildId = thread.guild?.id;
  if (!guildId) return false;
  const config = CONFIG_SERVIDORES[guildId];
  if (!config?.categoriaPracticas) return false;
  const parentChannel = thread.parent;
  if (!parentChannel) return false;
  return parentChannel.parentId === config.categoriaPracticas;
}

client.on('threadCreate', (thread) => {
  const guildId = thread.guild?.id;
  if (!guildId) return;
  if (guildId === BHIMBIRA_GUILD_ID || guildId === LECTOR_AKAE_GUILD_ID || threadBelongsToPracticas(thread)) {
    joinThreadIfNeeded(thread);
  }
});

client.on('threadUpdate', (_oldThread, newThread) => {
  const guildId = newThread.guild?.id;
  if (!guildId) return;
  if (guildId === BHIMBIRA_GUILD_ID || guildId === LECTOR_AKAE_GUILD_ID || threadBelongsToPracticas(newThread)) {
    joinThreadIfNeeded(newThread);
  }
});

async function handlePracticasReaction(reaction, user, action) {
  if (user.bot) return;
  try {
    if (reaction.partial) {
      await reaction.fetch();
    }
    const message = reaction.message;
    if (message.partial) {
      await message.fetch();
    }
    if (!message.guild) return;

    const config = CONFIG_SERVIDORES[message.guild.id];
    if (!config) return;
    if (!isPracticasCategory(message.channel, config, message.guild)) return;

    const payload = await buildMessagePayload(message);
    payload.category_id = message.channel?.parentId || null;

    const practicasExtra = {
      sheet_tab: 'Practicas',
      record_type: 'reaction',
      reaction: {
        action,
        emoji: reaction.emoji.name || reaction.emoji.id,
        emoji_id: reaction.emoji.id,
        emoji_name: reaction.emoji.name,
        reactor_id: user.id,
        reactor: user.username,
        count: reaction.count
      }
    };

    await triggerAnalisisWebhook(config, payload, practicasExtra, `Prácticas (${action})`);
  } catch (err) {
    console.error('❌ Error registrando reacción de prácticas:', err.message);
  }
}

client.on('messageReactionAdd', (reaction, user) => handlePracticasReaction(reaction, user, 'added'));
client.on('messageReactionRemove', (reaction, user) => handlePracticasReaction(reaction, user, 'removed'));

client.login(process.env.DISCORD_BOT_TOKEN);
