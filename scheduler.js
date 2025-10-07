import cron from 'node-cron';
import { CONFIG_SERVIDORES } from './config.js';

export function startScheduler(client) {
  const serverId = '1387738817208914043'; // Servidor de prueba
  const serverConfig = CONFIG_SERVIDORES[serverId];
  if (!serverConfig) {
    console.warn(`[scheduler] No hay configuración para el servidor ${serverId}`);
    return;
  }

  const channelId = serverConfig.canalesFijos?.canalizaciones;
  if (!channelId) {
    console.warn(`[scheduler] No hay canalizaciones configurado para ${serverId}`);
    return;
  }

  async function closeChannel() {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return console.warn('[scheduler] Guild no encontrada');
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return console.warn('[scheduler] Canal no encontrado', channelId);

    try {
      // Aviso previo
      await channel.send('Buenas tardes, disculpad, a partir del viernes a las 18:00 no se podrán enviar mensajes en canalizaciones. El lunes a las 08:00 volverá a abrirse.');
    } catch (err) {
      console.error('[scheduler] Error enviando aviso de cierre:', err.message);
    }

    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false });
      console.log(`[scheduler] Canal ${channelId} cerrado (SEND_MESSAGES=false)`);
    } catch (err) {
      console.error('[scheduler] Error cerrando canal:', err.message);
    }
  }

  async function openChannel() {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) return console.warn('[scheduler] Guild no encontrada');
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return console.warn('[scheduler] Canal no encontrado', channelId);

    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: true });
      console.log(`[scheduler] Canal ${channelId} abierto (SEND_MESSAGES=true)`);
    } catch (err) {
      console.error('[scheduler] Error abriendo canal:', err.message);
    }

    try {
      await channel.send('Buenos días, el canal de canalizaciones vuelve a estar abierto.');
    } catch (err) {
      console.error('[scheduler] Error enviando aviso de apertura:', err.message);
    }
  }

  // Programación: cerrar viernes 18:00, abrir lunes 08:00 (zona Europe/Madrid)
  cron.schedule('0 18 * * FRI', () => {
    console.log('[scheduler] Ejecutando tarea de cierre (viernes 18:00)');
    closeChannel();
  }, { timezone: 'Europe/Madrid' });

  cron.schedule('0 8 * * MON', () => {
    console.log('[scheduler] Ejecutando tarea de apertura (lunes 08:00)');
    openChannel();
  }, { timezone: 'Europe/Madrid' });

  console.log('[scheduler] Programador iniciado para canalizaciones:', channelId);
}
