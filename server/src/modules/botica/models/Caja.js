import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Caja = sequelize.define('BoticaCaja', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
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
  monto_inicial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  monto_final: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  total_ventas: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_ingresos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_egresos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  saldo_esperado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  saldo_real: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  diferencia: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('Abierta', 'Cerrada'),
    defaultValue: 'Abierta',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'botica_cajas',
  timestamps: true,
});

export default Caja;

