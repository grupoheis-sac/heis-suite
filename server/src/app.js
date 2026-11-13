import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './core/routes/auth.routes.js';
import adminRoutes from './core/routes/admin.routes.js';
import superadminRoutes from './core/routes/superadmin.routes.js';
import consultaRoutes from './core/routes/consulta.routes.js';
import { obtenerComunicadoActivo, obtenerWhitelabelPublico } from './core/controllers/superadmin.controller.js';
import { loadModules } from './loader.js';

export async function createApp() {
  const app = express();

  // Middlewares Globales
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
    contentSecurityPolicy: false,
  }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      suite: 'HEIS Suite Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Rutas Core (Siempre activas)
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/superadmin', superadminRoutes);
  app.use('/api/consulta', consultaRoutes);
  app.get('/api/comunicados/activo', obtenerComunicadoActivo);
  app.get('/api/whitelabel/public', obtenerWhitelabelPublico);

  // Cargar módulos verticales dinámicamente
  await loadModules(app);

  // Manejador global de 404
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint no encontrado en HEIS Suite' });
  });

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

