process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

import { Client, GatewayIntentBits } from 'discord.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Crear una instancia del cliente de Discord con permisos adecuados
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Confirmar conexión del bot
client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
});

// Escuchar mensajes nuevos y enviarlos a n8n
client.on('messageCreate', async (message) => {
  // Ignorar mensajes de otros bots
  if (message.author.bot) return;

  try {
    await axios.post(process.env.N8N_WEBHOOK_URL, {
      user: message.author.username,
      user_id: message.author.id,
      content: message.content,
      channel: message.channel.name,
      timestamp: new Date().toISOString(),
    });

    console.log(`[→] Enviado a n8n: ${message.content}`);
  } catch (err) {
    console.error('❌ Error al enviar a n8n:', err.message);
  }
});

// Iniciar sesión con el token del bot
client.login(process.env.DISCORD_BOT_TOKEN);
