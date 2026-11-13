import { Router } from 'express';
import { verifyJWT, requireRole } from '../middleware/auth.middleware.js';
import {
  listarEmpresas,
  crearEmpresa,
  actualizarEmpresa,
  actualizarModulosEmpresa,
  actualizarSubmodulosEmpresa,
  toggleEstadoEmpresa,
  resetPasswordAdminEmpresa,
  eliminarEmpresa,
  exportarBackupEmpresa,
  listarComunicados,
  crearComunicado,
  actualizarComunicado,
  toggleComunicado,
  eliminarComunicado,
  obtenerMetricasSaaS,
  obtenerAuditoriaGlobal,
  obtenerSaludSistema,
  probarPingSistema,
  purgarCacheSistema,
  ejecutarTestServicios,
  obtenerPlanesSaaS,
  actualizarPlanesSaaS,
  obtenerPermisosBotones,
  actualizarPermisosBotones,
  restablecerPermisosBotones,
  obtenerConfigWhitelabel,
  guardarConfigWhitelabel,
} from '../controllers/superadmin.controller.js';

const router = Router();

// Exclusivo para SuperAdmin de la plataforma HEIS
router.use(verifyJWT, requireRole('superadmin'));

router.get('/metricas', obtenerMetricasSaaS);
router.get('/auditoria', obtenerAuditoriaGlobal);
router.get('/sistema', obtenerSaludSistema);
router.post('/sistema/ping', probarPingSistema);
router.post('/sistema/purgar-cache', purgarCacheSistema);
router.post('/sistema/test-servicios', ejecutarTestServicios);
router.get('/planes', obtenerPlanesSaaS);
router.put('/planes', actualizarPlanesSaaS);

router.get('/empresas', listarEmpresas);
router.post('/empresas', crearEmpresa);
router.put('/empresas/:id', actualizarEmpresa);
router.put('/empresas/:id/modulos', actualizarModulosEmpresa);
router.put('/empresas/:id/submodulos', actualizarSubmodulosEmpresa);
router.put('/empresas/:id/estado', toggleEstadoEmpresa);
router.post('/empresas/:id/reset-password', resetPasswordAdminEmpresa);
router.delete('/empresas/:id', eliminarEmpresa);
router.get('/empresas/:id/backup', exportarBackupEmpresa);

// Gestión de Comunicados y Broadcast
router.get('/comunicados', listarComunicados);
router.post('/comunicados', crearComunicado);
router.put('/comunicados/:id', actualizarComunicado);
router.put('/comunicados/:id/toggle', toggleComunicado);
router.delete('/comunicados/:id', eliminarComunicado);

// Seguridad por Botón & Micro-Permisos RBAC Granular
router.get('/permisos-botones', obtenerPermisosBotones);
router.put('/permisos-botones', actualizarPermisosBotones);
router.post('/permisos-botones/restablecer', restablecerPermisosBotones);

// White-Label Studio & Login Personalizado
router.get('/whitelabel', obtenerConfigWhitelabel);
router.post('/whitelabel', guardarConfigWhitelabel);

export default router;


