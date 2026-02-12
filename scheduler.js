import cron from 'node-cron';
import { CONFIG_SERVIDORES } from './config.js';

export function startScheduler(client) {

  // ========================================
  // SERVIDOR DE PRUEBA - Canalizaciones
  // ========================================
  const serverId = '1387738817208914043'; // Servidor de prueba
  const serverConfig = CONFIG_SERVIDORES[serverId];
  if (!serverConfig) {
    console.warn(`[scheduler] No hay configuración para el servidor ${serverId}`);
  } else {
    const channelId = serverConfig.canalesFijos?.canalizaciones;
    if (!channelId) {
      console.warn(`[scheduler] No hay canalizaciones configurado para ${serverId}`);
    } else {
      async function closeChannelPrueba() {
        const guild = client.guilds.cache.get(serverId);
        if (!guild) return console.warn('[scheduler] Guild prueba no encontrada');
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return console.warn('[scheduler] Canal prueba no encontrado', channelId);

        try {
          await channel.send('Buenas tardes, disculpad, a partir del viernes a las 18:00 no se podrán enviar mensajes en canalizaciones. El lunes a las 08:00 volverá a abrirse.');
        } catch (err) {
          console.error('[scheduler] Error enviando aviso de cierre (prueba):', err.message);
        }

        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false });
          console.log(`[scheduler] Canal prueba ${channelId} cerrado`);
        } catch (err) {
          console.error('[scheduler] Error cerrando canal prueba:', err.message);
        }
      }

      async function openChannelPrueba() {
        const guild = client.guilds.cache.get(serverId);
        if (!guild) return console.warn('[scheduler] Guild prueba no encontrada');
        const channel = guild.channels.cache.get(channelId);
        if (!channel) return console.warn('[scheduler] Canal prueba no encontrado', channelId);

        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: true });
          console.log(`[scheduler] Canal prueba ${channelId} abierto`);
        } catch (err) {
          console.error('[scheduler] Error abriendo canal prueba:', err.message);
        }

        try {
          await channel.send('Buenos días, el canal de canalizaciones vuelve a estar abierto.');
        } catch (err) {
          console.error('[scheduler] Error enviando aviso de apertura (prueba):', err.message);
        }
      }

      // Cerrar viernes 18:00, abrir lunes 08:00
      cron.schedule('0 18 * * FRI', () => {
        console.log('[scheduler] Ejecutando tarea de cierre prueba (viernes 18:00)');
        closeChannelPrueba();
      }, { timezone: 'Europe/Madrid' });

      cron.schedule('0 8 * * MON', () => {
        console.log('[scheduler] Ejecutando tarea de apertura prueba (lunes 08:00)');
        openChannelPrueba();
      }, { timezone: 'Europe/Madrid' });

      console.log('[scheduler] Programador iniciado para canalizaciones prueba:', channelId);
    }
  }

  // ========================================
  // LECTOR AKAE® G11 - Canales de canalización (uno por embajador)
  // Cierre: viernes 20:00 | Apertura: lunes 08:00
  // ========================================
  const lectorId = '1442604968954691777';
  const lectorConfig = CONFIG_SERVIDORES[lectorId];
  if (!lectorConfig) {
    console.warn(`[scheduler] No hay configuración para Lector Akae G11 (${lectorId})`);
  } else {
    const canalesCanalizacion = lectorConfig.canalesCanalizacion || [];
    if (canalesCanalizacion.length === 0) {
      console.warn(`[scheduler] No hay canales de canalización configurados para Lector Akae G11`);
    } else {

      async function closeCanalizacionesLector() {
        const guild = client.guilds.cache.get(lectorId);
        if (!guild) return console.warn('[scheduler] Guild Lector Akae G11 no encontrada');

        for (const chId of canalesCanalizacion) {
          const channel = guild.channels.cache.get(chId);
          if (!channel) {
            console.warn(`[scheduler] Canal canalización ${chId} no encontrado en Lector Akae G11`);
            continue;
          }

          try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: false });
            console.log(`[scheduler] ✅ Cerrado canal canalización: ${channel.name} (${chId})`);
          } catch (err) {
            console.error(`[scheduler] ❌ Error cerrando ${channel.name} (${chId}):`, err.message);
          }
        }

        // Enviar aviso solo en el primer canal que se pueda
        const primerCanal = guild.channels.cache.get(canalesCanalizacion[0]);
        if (primerCanal) {
          try {
            await primerCanal.send('Los canales de canalización se cierran durante el fin de semana. Se volverán a abrir el lunes a las 08:00.');
          } catch (err) {
            console.error('[scheduler] Error enviando aviso de cierre Lector Akae:', err.message);
          }
        }
      }

      async function openCanalizacionesLector() {
        const guild = client.guilds.cache.get(lectorId);
        if (!guild) return console.warn('[scheduler] Guild Lector Akae G11 no encontrada');

        for (const chId of canalesCanalizacion) {
          const channel = guild.channels.cache.get(chId);
          if (!channel) {
            console.warn(`[scheduler] Canal canalización ${chId} no encontrado en Lector Akae G11`);
            continue;
          }

          try {
            await channel.permissionOverwrites.edit(guild.roles.everyone, { SEND_MESSAGES: true });
            console.log(`[scheduler] ✅ Abierto canal canalización: ${channel.name} (${chId})`);
          } catch (err) {
            console.error(`[scheduler] ❌ Error abriendo ${channel.name} (${chId}):`, err.message);
          }
        }

        // Enviar aviso solo en el primer canal
        const primerCanal = guild.channels.cache.get(canalesCanalizacion[0]);
        if (primerCanal) {
          try {
            await primerCanal.send('Buenos días, los canales de canalización vuelven a estar abiertos.');
          } catch (err) {
            console.error('[scheduler] Error enviando aviso de apertura Lector Akae:', err.message);
          }
        }
      }

      // Cerrar viernes 20:00, abrir lunes 08:00
      cron.schedule('0 20 * * FRI', () => {
        console.log('[scheduler] Ejecutando cierre canalizaciones Lector Akae G11 (viernes 20:00)');
        closeCanalizacionesLector();
      }, { timezone: 'Europe/Madrid' });

      cron.schedule('0 8 * * MON', () => {
        console.log('[scheduler] Ejecutando apertura canalizaciones Lector Akae G11 (lunes 08:00)');
        openCanalizacionesLector();
      }, { timezone: 'Europe/Madrid' });

      console.log(`[scheduler] Programador iniciado para ${canalesCanalizacion.length} canales de canalización en Lector Akae G11`);
    }
  }
}
