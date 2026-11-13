import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const OrdenDetalle = sequelize.define('OrdenDetalle', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  note: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'cooking', 'ready', 'served'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'restaurante_orden_detalles',
});

export default OrdenDetalle;

