import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const Rol = sequelize.define('Rol', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // null para roles globales del sistema (ej: superadmin)
    references: {
      model: 'empresas',
      key: 'id',
    },
  },
  nombre: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  permisos: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
  },
  es_sistema: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'roles',
  indexes: [
    { fields: ['empresa_id'] },
  ],
});

export default Rol;

