import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const TurnoCaja = sequelize.define('HospedajeCaja', {
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
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fecha_apertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  monto_apertura: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  monto_cierre_sistema: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  monto_cierre_real: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  diferencia: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('abierto', 'cerrado'),
    defaultValue: 'abierto',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'hospedaje_cajas',
  timestamps: true,
});

export default TurnoCaja;

