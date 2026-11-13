import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const OrdenCompraDetalle = sequelize.define('OrdenCompraDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_orden_compra: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  cantidad_recibida: {
    type: DataTypes.DECIMAL(12, 3),
    defaultValue: 0.000,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
}, {
  tableName: 'ferreteria_orden_compra_detalles',
  indexes: [
    { fields: ['id_orden_compra'] },
    { fields: ['id_producto'] },
  ],
});

export default OrdenCompraDetalle;

