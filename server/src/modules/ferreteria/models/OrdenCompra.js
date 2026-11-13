import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const OrdenCompra = sequelize.define('OrdenCompra', {
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
  codigo: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_emision: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_entrega_esperada: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  condicion_pago: {
    type: DataTypes.STRING(50),
    defaultValue: 'Contado',
  },
  metodo_envio: {
    type: DataTypes.STRING(100),
    defaultValue: 'Flete Proveedor',
  },
  almacen_destino: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  lugar_entrega: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  igv: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pendiente',
  },
}, {
  tableName: 'ferreteria_ordenes_compra',
  indexes: [
    { fields: ['codigo'] },
    { fields: ['id_proveedor'] },
    { fields: ['empresa_id'] },
  ],
});

export default OrdenCompra;

