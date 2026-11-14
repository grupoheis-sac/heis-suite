import { createModuleApi } from '@heis/core';

/**
 * Cliente API para Caja y Turnos Unificados (Core Transversal)
 * Se conecta a /api/core/caja/* garantizando acceso libre para todos los giros (Restaurante, Ferretería, Botica, Hospedaje).
 */
export const cajaApi = createModuleApi('core');
export default cajaApi;
