import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Caja = sequelize.define('Caja', {
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
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
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
  total_ventas_efectivo: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_egresos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_ingresos_abonos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  fecha_apertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_cierre: {
    type: DataTypes.DATE,
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
  tableName: 'ferreteria_cajas',
});

export default Caja;

