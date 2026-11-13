import { Router } from 'express';
import { verifyJWT, requireRole } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/empresa.middleware.js';
import {
  listarSucursales,
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
} from '../controllers/sucursales.controller.js';
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../controllers/usuarios.controller.js';
import {
  listarRoles,
  crearRol,
  actualizarRol,
} from '../controllers/roles.controller.js';
import { listarAuditoria } from '../controllers/auditoria.controller.js';

const router = Router();

// Todas las rutas de administración requieren JWT y Contexto de Empresa
router.use(verifyJWT, tenantContext);

// SUCURSALES / SEDES
router.get('/sucursales', listarSucursales);
router.post('/sucursales', requireRole('Administrador', 'admin', 'Gerente'), crearSucursal);
router.put('/sucursales/:id', requireRole('Administrador', 'admin', 'Gerente'), actualizarSucursal);
router.delete('/sucursales/:id', requireRole('Administrador', 'admin', 'Gerente'), eliminarSucursal);

// USUARIOS / EQUIPO
router.get('/usuarios', listarUsuarios);
router.post('/usuarios', requireRole('Administrador', 'admin', 'Gerente'), crearUsuario);
router.put('/usuarios/:id', requireRole('Administrador', 'admin', 'Gerente'), actualizarUsuario);
router.delete('/usuarios/:id', requireRole('Administrador', 'admin', 'Gerente'), eliminarUsuario);

// ROLES Y PERMISOS
router.get('/roles', listarRoles);
router.post('/roles', requireRole('Administrador', 'admin', 'Gerente'), crearRol);
router.put('/roles/:id', requireRole('Administrador', 'admin', 'Gerente'), actualizarRol);

// AUDITORIA Y SEGURIDAD FORENSE
router.get('/auditoria', requireRole('Administrador', 'admin', 'Gerente'), listarAuditoria);

export default router;

