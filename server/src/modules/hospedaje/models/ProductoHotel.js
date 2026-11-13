import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const ProductoHotel = sequelize.define('HospedajeProducto', {
  id: {
    type: DataTypes.INTEGER,
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
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING(60),
    defaultValue: 'Minibar',
  },
  precio_compra: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  precio_venta: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  stock_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  imagen: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'hospedaje_productos',
  timestamps: true,
});

export default ProductoHotel;

