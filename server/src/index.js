import dotenv from 'dotenv';
import { createApp } from './app.js';
import { sequelize, testConnection } from './config/db.js';
import {
  CajaGeneral,
  CajaMovimientoGeneral,
  ComprobanteElectronico,
  PagoSuscripcionSaaS,
} from './core/models/index.js';
import { ejecutarBarridoCorteAutomatico } from './core/services/subscriptionGuard.service.js';
import { runPendingMigrations } from './migrations/migrator.js';
import {
  startSunatContingencyWorker,
  stopSunatContingencyWorker,
} from './core/services/sunat/contingencyWorker.js';

dotenv.config();

// Guardia de seguridad obligatoria para producción
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ ERROR FATAL DE SEGURIDAD: JWT_SECRET debe estar definido y tener al menos 32 caracteres en producción.');
    process.exit(1);
  }
}

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap() {
  console.log('\n======================================================');
  console.log('   HEIS SUITE - BACKEND MULTI-TENANT ENTERPRISE   ');
  console.log('======================================================\n');

  const connected = await testConnection();
  if (connected) {
    try {
      // 1. Ejecutar motor unificado de migraciones transaccionales pre-listen
      console.log('🔄 Verificando y aplicando migraciones transaccionales...');
      await runPendingMigrations();

      // 2. Verificación de modelos base transversales
      await CajaGeneral.sync({ alter: false });
      await CajaMovimientoGeneral.sync({ alter: false });
      await ComprobanteElectronico.sync({ alter: false });
      await PagoSuscripcionSaaS.sync({ alter: false });
      console.log('✅ Tablas transversales Core (Cajas, Facturación UBL 2.1 y Suscripciones SaaS) verificadas.');

      // 3. Iniciar Worker de Contingencia y Reintentos Automáticos SUNAT
      startSunatContingencyWorker(30000);

      // 4. Ejecutar revisión inicial de vencimientos de suscripción y programar cada 6 horas
      await ejecutarBarridoCorteAutomatico();
      setInterval(() => {
        ejecutarBarridoCorteAutomatico().catch(() => {});
      }, 6 * 60 * 60 * 1000);
    } catch (startupErr) {
      console.warn('⚠️ Nota sobre inicialización de servicios Core:', startupErr.message);
    }
  }

  const app = await createApp();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor HEIS Suite corriendo en: http://localhost:${PORT}`);
    console.log(`📡 Healthcheck disponible en:         http://localhost:${PORT}/api/health\n`);
  });

  // Graceful Shutdown para entornos Docker, PM2 y Kubernetes
  const shutdown = async (signal) => {
    console.log(`\n🛑 Recibida señal ${signal}. Iniciando apagado controlado (Graceful Shutdown)...`);
    try {
      stopSunatContingencyWorker();
      server.close(async () => {
        console.log('🔌 Conexiones HTTP entrantes cerradas.');
        try {
          await sequelize.close();
          console.log('💾 Conexión y Pool de Base de Datos cerrados.');
        } catch (dbErr) {
          console.warn('Advertencia al cerrar pool de base de datos:', dbErr.message);
        }
        process.exit(0);
      });

      // Límite de tiempo máximo para forzar salida si hay sockets colgados
      setTimeout(() => {
        console.error('⚠️ Forzando cierre del proceso tras 10 segundos de espera.');
        process.exit(1);
      }, 10000).unref();
    } catch (err) {
      console.error('Error durante graceful shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Error fatal al iniciar HEIS Suite Server:', err);
  process.exit(1);
});
