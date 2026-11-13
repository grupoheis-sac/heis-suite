import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null para SuperAdmin SaaS
    references: {
      model: 'empresas',
      key: 'id',
    },
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sucursales',
      key: 'id',
    },
  },
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'roles',
      key: 'id',
    },
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.STRING(50),
    defaultValue: 'Operador',
    // 'superadmin', 'Administrador', 'Cajero', 'Mozo', 'Cocina', etc.
  },
  tipo_documento: {
    type: DataTypes.STRING(20),
    defaultValue: 'DNI',
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  ultimo_acceso: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
  indexes: [
    { fields: ['empresa_id'] },
    { fields: ['email'] },
  ],
});

export default Usuario;

