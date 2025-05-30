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

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Inicializa datos básicos
  const payload = {
    user: message.author.username,
    user_id: message.author.id,
    content: message.content,
    channel: message.channel.name,
    timestamp: new Date().toISOString(),
    is_reply: false,
    reply_to: null
  };

  // Si es respuesta a otro mensaje
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

  // Enviar al webhook de n8n
  try {
    await axios.post(process.env.N8N_WEBHOOK_URL, payload);
    console.log(`[→] Enviado a n8n: ${payload.content}`);
  } catch (err) {
    console.error('❌ Error al enviar a n8n:', err.message);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

