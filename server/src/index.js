import dotenv from 'dotenv';
import { createApp } from './app.js';
import { testConnection } from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap() {
  console.log('\n======================================================');
  console.log('   HEIS SUITE - BACKEND MULTI-TENANT ENTERPRISE   ');
  console.log('======================================================\n');

  await testConnection();

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

