import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './core/routes/auth.routes.js';
import adminRoutes from './core/routes/admin.routes.js';
import cajaRoutes from './core/routes/caja.routes.js';
import facturacionRoutes from './core/routes/facturacion.routes.js';
import biRealtimeRoutes from './core/routes/bi-realtime.routes.js';
import superadminRoutes from './core/routes/superadmin.routes.js';
import consultaRoutes from './core/routes/consulta.routes.js';
import { obtenerComunicadoActivo, obtenerWhitelabelPublico } from './core/controllers/superadmin.controller.js';
import { loadModules } from './loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const healthResponse = (req, res) => {
    res.json({
      status: 'online',
      suite: 'HEIS Suite Platform (Unified Single-Container Multi-Tenant)',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
    });
  };

  app.get('/health', healthResponse);
  app.get('/api/health', healthResponse);

  // Rutas Core Transversales (Siempre activas para todos los giros)
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/core/caja', cajaRoutes);
  app.use('/api/caja', cajaRoutes);
  app.use('/api/core/facturacion', facturacionRoutes);
  app.use('/api/facturacion', facturacionRoutes);
  app.use('/api/core', biRealtimeRoutes);
  app.use('/api/superadmin', superadminRoutes);
  app.use('/api/consulta', consultaRoutes);
  app.get('/api/comunicados/activo', obtenerComunicadoActivo);
  app.get('/api/whitelabel/public', obtenerWhitelabelPublico);

  // Cargar módulos verticales dinámicamente con guard de licencias
  await loadModules(app);

  // Manejador 404 para rutas de API
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint no encontrado en HEIS Suite' });
  });

  // En Producción (Single Deploy Container): servir el Frontend compilado desde Express
  const distPath = path.resolve(__dirname, '../../apps/shell/dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { maxAge: '7d' }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Manejador global de errores (500)
  app.use((err, req, res, next) => {
    console.error('Error no capturado en servidor:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Error interno del servidor en HEIS Suite',
    });
  });

  return app;
}

export default createApp;
