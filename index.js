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

  const payload = {
    user: message.author.username,
    user_id: message.author.id,
    content: message.content,
    channel: message.channel.name,
    guild: message.guild?.name || "Sin nombre",
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

  // ✅ Enviar siempre al webhook de actividad general
  try {
    await axios.post("https://primary-production-9b33.up.railway.app/webhook-test/79bea938-314b-42d4-b658-c61ac2a53f2a", payload);
    console.log(`[→] Reporte enviado`);
  } catch (err) {
    console.error('❌ Error al enviar al webhook de actividad:', err.message);
  }

  // 🤖 Si es canal #faq → enviar a IA y responder
  if (message.channel.name === "faq") {
    try {
      const response = await axios.post("https://primary-production-9b33.up.railway.app/webhook-test/90dcb364-e8a6-42e7-a9b1-e48e5bed9e06", {
        question: message.content,
        user: message.author.username,
        channel_id: message.channel.id,
        message_id: message.id
      });

      const reply = response.data?.reply;

      if (reply) {
        await message.reply(reply);
        console.log(`[🤖] Respuesta de IA enviada`);
      } else {
        console.warn('⚠️ Webhook de FAQ no devolvió respuesta');
      }
    } catch (err) {
      console.error('❌ Error al enviar a webhook de FAQ:', err.message);
    }
  }

  // 📸 Si es canal #instagram-bot → enviar al webhook de Instagram
  if (message.channel.name === "instagram-bot") {
    try {
      await axios.post("https://primary-production-9b33.up.railway.app/webhook-test/b1f4d666-dc26-41e4-9aa7-fb95ef13940e", {
        ...payload,
        type: "instagram"
      });
      console.log(`[📸] Enviado al webhook de Instagram`);
    } catch (err) {
      console.error('❌ Error al enviar a webhook de Instagram:', err.message);
    }
  }

  // 📺 Si es canal #youtube-comentarios → enviar al webhook de YouTube
  if (message.channel.name === "youtube-comentarios") {
    try {
      await axios.post("https://primary-production-9b33.up.railway.app/webhook-test/f635e02a-a4b1-4263-b0c0-1c645277e77e", {
        ...payload,
        type: "youtube"
      });
      console.log(`[📺] Enviado al webhook de YouTube`);
    } catch (err) {
      console.error('❌ Error al enviar a webhook de YouTube:', err.message);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

