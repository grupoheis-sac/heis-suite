import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const AuditoriaLog = sequelize.define('AuditoriaLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'empresas',
      key: 'id',
    },
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id',
    },
  },
  usuario_nombre: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  usuario_rol: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  modulo: {
    type: DataTypes.STRING(60),
    allowNull: false,
    // 'restaurante', 'ferreteria', 'administracion', 'seguridad', 'sunat', etc.
  },
  accion: {
    type: DataTypes.STRING(100),
    allowNull: false,
    // 'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'LOGIN', 'CIERRE_CAJA', etc.
  },
  entidad: {
    type: DataTypes.STRING(60),
    allowNull: true,
    // 'Sucursal', 'Usuario', 'Mesa', 'Pedido', etc.
  },
  entidad_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  detalles: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  navegador: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'auditoria_logs',
  indexes: [
    { fields: ['empresa_id'] },
    { fields: ['modulo'] },
    { fields: ['created_at'] },
  ],
});

export default AuditoriaLog;

