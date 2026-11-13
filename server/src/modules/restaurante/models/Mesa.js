import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Mesa = sequelize.define('Mesa', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  area_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 4,
  },
  status: {
    type: DataTypes.ENUM('available', 'occupied', 'billed', 'reserved'),
    defaultValue: 'available',
  },
  x_pos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  y_pos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'restaurante_mesas',
});

export default Mesa;
