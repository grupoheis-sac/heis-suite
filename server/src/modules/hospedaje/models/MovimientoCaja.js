import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const MovimientoCaja = sequelize.define('HospedajeCajaMovimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  turno_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('ingreso', 'egreso'),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  comprobante: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'hospedaje_caja_movimientos',
  timestamps: true,
});

export default MovimientoCaja;

