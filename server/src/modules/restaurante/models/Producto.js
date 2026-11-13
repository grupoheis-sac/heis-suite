import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  barcode: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 999,
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  destination: {
    type: DataTypes.ENUM('kitchen', 'bar', 'dessert'),
    defaultValue: 'kitchen',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'restaurante_productos',
});

export default Producto;

