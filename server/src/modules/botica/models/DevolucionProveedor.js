import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const DevolucionProveedor = sequelize.define('BoticaDevolucionProveedor', {
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
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  numero_guia: {
    type: DataTypes.STRING(40),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.ENUM('Vencimiento_Proximo', 'Producto_Dañado', 'Error_Despacho', 'Canje_Comercial', 'Otro'),
    defaultValue: 'Vencimiento_Proximo',
  },
  monto_total: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  estado: {
    type: DataTypes.ENUM('Emitida', 'Aceptada_Drogueria', 'Canjeada', 'Rechazada'),
    defaultValue: 'Emitida',
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'botica_devoluciones_proveedor',
  timestamps: true,
});

export default DevolucionProveedor;

