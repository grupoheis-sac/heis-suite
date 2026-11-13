import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Reserva = sequelize.define('Reserva', {
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
  table_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  client_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  reservation_time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  people: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'restaurante_reservas',
});

export default Reserva;

