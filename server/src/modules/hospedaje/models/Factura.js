import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Factura = sequelize.define('HospedajeFactura', {
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
  numero: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  serie_sunat: {
    type: DataTypes.STRING(10),
    allowNull: true,
    defaultValue: 'B001',
  },
  correlativo_sunat: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_comprobante: {
    type: DataTypes.ENUM('Boleta', 'Factura', 'Ticket', 'NotaCredito'),
    defaultValue: 'Boleta',
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  huesped_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  igv: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('emitida', 'pagada', 'anulada'),
    defaultValue: 'pagada',
  },
  fecha_emision: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'hospedaje_facturas',
  timestamps: true,
});

export default Factura;

