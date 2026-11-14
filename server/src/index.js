import dotenv from 'dotenv';
import { createApp } from './app.js';
import { testConnection } from './config/db.js';
import {
  CajaGeneral,
  CajaMovimientoGeneral,
  ComprobanteElectronico,
  PagoSuscripcionSaaS,
} from './core/models/index.js';
import { ejecutarBarridoCorteAutomatico } from './core/services/subscriptionGuard.service.js';

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
      await CajaGeneral.sync({ alter: false });
      await CajaMovimientoGeneral.sync({ alter: false });
      await ComprobanteElectronico.sync({ alter: false });
      await PagoSuscripcionSaaS.sync({ alter: false });
      console.log('✅ Tablas transversales Core (Cajas, Facturación UBL 2.1 y Suscripciones SaaS) verificadas.');

      // Ejecutar revisión inicial de vencimientos y programar revisión cada 6 horas
      await ejecutarBarridoCorteAutomatico();
      setInterval(() => {
        ejecutarBarridoCorteAutomatico().catch(() => {});
      }, 6 * 60 * 60 * 1000);
    } catch (syncErr) {
      console.warn('⚠️ Nota sobre verificación de tablas Core:', syncErr.message);
    }
  }

  const app = await createApp();

  app.listen(PORT, () => {
    console.log(`🚀 Servidor HEIS Suite corriendo en: http://localhost:${PORT}`);
    console.log(`📡 Healthcheck disponible en:         http://localhost:${PORT}/api/health\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Error fatal al iniciar HEIS Suite Server:', err);
  process.exit(1);
});
