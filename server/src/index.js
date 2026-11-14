import dotenv from 'dotenv';
import { createApp } from './app.js';
import { testConnection } from './config/db.js';
import { CajaGeneral, CajaMovimientoGeneral } from './core/models/index.js';

dotenv.config();

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
      console.log('✅ Tablas transversales core_cajas y core_caja_movimientos verificadas.');
    } catch (syncErr) {
      console.warn('⚠️ Nota sobre verificación de tablas core_cajas:', syncErr.message);
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

