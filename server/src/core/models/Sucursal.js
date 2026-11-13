import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const Sucursal = sequelize.define('Sucursal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'empresas',
      key: 'id',
    },
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  es_principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'sucursales',
  indexes: [
    { fields: ['empresa_id'] },
  ],
});

export default Sucursal;

