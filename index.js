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
  if (!config) return;

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
        tipo_canal = canal.name; // usa el nombre interno del canal
        break;
      }
    }
  }

  const payload = {
    user: message.author.username,
    user_id: message.author.id,
    content: message.content,
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

  // 3. Enviar SIEMPRE al webhook global
  try {
    await axios.post(config.webhookAnalisis, payload);
    console.log(`[📊] Enviado a análisis (${embajador || 'global'} - ${tipo_canal || 'sin tipo'})`);
  } catch (err) {
    console.error('❌ Error al enviar al webhook de análisis:', err.message);
  }

  // 4. (Opcional) lógica FAQ si se activa
  if (canalId === config.canalFAQ) {
    try {
      const response = await axios.post(config.webhookFAQ, {
        question: message.content,
        user: message.author.username,
        channel_id: canalId,
        message_id: message.id
      });

      const reply = response.data?.reply;
      if (reply) {
        await message.reply(reply);
        console.log(`[🤖] Respuesta FAQ enviada`);
      } else {
        console.warn('⚠️ Webhook FAQ no devolvió respuesta');
      }
    } catch (err) {
      console.error('❌ Error al enviar al webhook FAQ:', err.message);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);



