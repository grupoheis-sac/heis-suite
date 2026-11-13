import sequelize from '../../config/db.js';
import Empresa from './Empresa.js';
import Usuario from './Usuario.js';
import Rol from './Rol.js';
import Sucursal from './Sucursal.js';
import AuditoriaLog from './AuditoriaLog.js';
import Comunicado from './Comunicado.js';
import PlanSaaS from './PlanSaaS.js';

// Relaciones Multi-Tenant Core
Empresa.hasMany(Sucursal, { foreignKey: 'empresa_id', as: 'sucursales', onDelete: 'CASCADE' });
Sucursal.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Empresa.hasMany(Usuario, { foreignKey: 'empresa_id', as: 'usuarios', onDelete: 'CASCADE' });
Usuario.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Empresa.hasMany(Rol, { foreignKey: 'empresa_id', as: 'roles', onDelete: 'CASCADE' });
Rol.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Empresa.hasMany(AuditoriaLog, { foreignKey: 'empresa_id', as: 'auditorias', onDelete: 'CASCADE' });
AuditoriaLog.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

Sucursal.hasMany(Usuario, { foreignKey: 'sucursal_id', as: 'usuarios' });
Usuario.belongsTo(Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });

Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol_obj' });

Usuario.hasMany(AuditoriaLog, { foreignKey: 'usuario_id', as: 'auditorias' });
AuditoriaLog.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Empresa.hasMany(Comunicado, { foreignKey: 'empresa_id', as: 'comunicados', onDelete: 'CASCADE' });
Comunicado.belongsTo(Empresa, { foreignKey: 'empresa_id', as: 'empresa' });

export {
  sequelize,
  Empresa,
  Usuario,
  Rol,
  Sucursal,
  AuditoriaLog,
  Comunicado,
  PlanSaaS,
};

export default {
  sequelize,
  Empresa,
  Usuario,
  Rol,
  Sucursal,
  AuditoriaLog,
  Comunicado,
  PlanSaaS,
};

