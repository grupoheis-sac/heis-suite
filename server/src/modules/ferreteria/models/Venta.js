import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Venta = sequelize.define('Venta', {
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
  serie: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'B001',
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  tipo_comprobante: {
    type: DataTypes.ENUM('Boleta', 'Factura', 'Ticket'),
    defaultValue: 'Boleta',
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_caja: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_pago: {
    type: DataTypes.ENUM('Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Credito', 'Mixto'),
    defaultValue: 'Efectivo',
  },
  numero_operacion: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  igv: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  descuento: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  monto_recibido: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  vuelto: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  estado: {
    type: DataTypes.ENUM('Completada', 'Anulada'),
    defaultValue: 'Completada',
  },
  sunat_estado: {
    type: DataTypes.STRING(30),
    defaultValue: 'No_Enviado',
  },
  sunat_hash: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  sunat_cdr: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sunat_qr: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  enlace_pdf: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  enlace_xml: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  enlace_cdr: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  monto_efectivo: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  monto_digital: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  billetera_digital: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ferreteria_ventas',
  indexes: [
    { fields: ['numero'] },
    { fields: ['id_cliente'] },
    { fields: ['id_usuario'] },
    { fields: ['empresa_id'] },
  ],
});

export default Venta;

