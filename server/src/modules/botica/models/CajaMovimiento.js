import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const CajaMovimiento = sequelize.define('BoticaCajaMovimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_caja: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('Ingreso', 'Egreso'),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
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
  tableName: 'botica_caja_movimientos',
  timestamps: true,
});

export default CajaMovimiento;

