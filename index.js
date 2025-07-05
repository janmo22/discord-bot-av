import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const CONFIG_SERVIDORES = {
  '1343220392424247316': {
    nombre: 'Lector Akae G10',
    canalesAnalisis: [
      'celebracion',
      'subir-mi-vibra',
      'experiencias',
      'tameana',
      'canalizacion',
      'el-mar-de-dudas',
      'feedback-dupla',
      'total-de-alumnos'
    ],
    canalFAQ: 'soporte',
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  },
  '1329913618338287720': {
    nombre: 'Servidor Cielo',
    canalesAnalisis: [
      'mis-logros',
      'subir-mi-vibra',
      'experiencias',
      'el-mar-de-dudas',
      'feedback-dupla',
      'total-de-alumnos'
    ],
    canalFAQ: 'soporte',
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  },
  '1277953002438656052': {
    nombre: 'Servidor La Tribu',
    canalesAnalisis: [
      'celebracion',
      'subir-mi-vibra',
      'experiencias',
      'tameana',
      'canalizacion',
      'el-mar-de-dudas',
      'feedback-dupla',
      'total-de-alumnos'
    ],
    canalFAQ: 'soporte',
    webhookAnalisis: process.env.N8N_WEBHOOK_URL,
    webhookFAQ: process.env.N8N_WEBHOOK_FAQ
  }
};

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  client.guilds.cache.forEach(g => {
    console.log(`🛰️ Conectado a: ${g.name} (ID: ${g.id})`);
  });
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const canal = message.channel.name;

  const config = CONFIG_SERVIDORES[guildId];
  if (!config) return;

  const payload = {
    user: message.author.username,
    user_id: message.author.id,
    content: message.content,
    channel: canal,
    guild: message.guild.name,
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
      console.log(`[↩] ${message.author.username} respondió a ${repliedMessage.author.username}`);
    } catch (error) {
      console.warn('⚠️ No se pudo obtener el mensaje original:', error.message);
    }
  }

  // 📊 Bot de análisis
  if (config.canalesAnalisis.includes(canal)) {
    try {
      await axios.post(config.webhookAnalisis, payload);
      console.log(`[📊][${config.nombre}] Enviado a webhook de análisis`);
    } catch (err) {
      console.error(`❌ Error al enviar a webhook análisis (${config.nombre}):`, err.message);
    }
    return;
  }

  // 💬 Bot FAQ
  if (canal === config.canalFAQ) {
    try {
      const response = await axios.post(config.webhookFAQ, {
        question: message.content,
        user: message.author.username,
        channel_id: message.channel.id,
        message_id: message.id
      });

      const reply = response.data?.reply;
      if (reply) {
        await message.reply(reply);
        console.log(`[🤖][${config.nombre}] Respuesta de IA enviada`);
      } else {
        console.warn(`[⚠️][${config.nombre}] Webhook FAQ no devolvió respuesta`);
      }
    } catch (err) {
      console.error(`❌ Error al enviar a webhook FAQ (${config.nombre}):`, err.message);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);


