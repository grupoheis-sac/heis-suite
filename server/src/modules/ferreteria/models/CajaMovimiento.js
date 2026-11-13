import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const CajaMovimiento = sequelize.define('CajaMovimiento', {
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
  concepto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ferreteria_caja_movimientos',
});

export default CajaMovimiento;

