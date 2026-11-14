import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Orden = sequelize.define('Orden', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
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
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  client_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'cooking', 'served', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  document_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'Ticket',
  },
  serie: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  correlativo: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  client_name: {
    type: DataTypes.STRING(255),
    defaultValue: 'Público General',
  },
  client_document: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  channel: {
    type: DataTypes.STRING(50),
    defaultValue: 'salon',
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  tip: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  received_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  change_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  monto_efectivo: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  monto_digital: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  billetera_digital: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'restaurante_ordenes',
});

export default Orden;

