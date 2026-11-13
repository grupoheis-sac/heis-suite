import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const CargoAdicional = sequelize.define('HospedajeCargoAdicional', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  factura_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  concepto: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.ENUM('restaurante', 'minibar', 'lavanderia', 'telefono', 'transporte', 'tours', 'spa', 'otros'),
    defaultValue: 'otros',
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'hospedaje_cargos_adicionales',
  timestamps: true,
});

export default CargoAdicional;

