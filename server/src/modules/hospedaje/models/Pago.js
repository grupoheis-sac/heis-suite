import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Pago = sequelize.define('HospedajePago', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  factura_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  turno_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  metodo_pago: {
    type: DataTypes.ENUM('efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia', 'yape', 'plin', 'otro'),
    defaultValue: 'efectivo',
  },
  referencia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  fecha_pago: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'hospedaje_pagos',
  timestamps: true,
});

export default Pago;

