import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Compra = sequelize.define('Compra', {
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
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_orden_compra: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  serie: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  numero: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  tipo_comprobante: {
    type: DataTypes.STRING(30),
    defaultValue: 'Factura',
  },
  guia_remision: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  igv: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING(30),
    defaultValue: 'Registrada',
  },
}, {
  tableName: 'ferreteria_compras',
  indexes: [
    { fields: ['numero'] },
    { fields: ['id_proveedor'] },
    { fields: ['id_orden_compra'] },
    { fields: ['empresa_id'] },
  ],
});

export default Compra;
