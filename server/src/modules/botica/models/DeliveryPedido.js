import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const DeliveryPedido = sequelize.define('BoticaDeliveryPedido', {
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
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario_despacho: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  motorizado_nombre: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  direccion_entrega: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  telefono_contacto: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  referencia: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tarifa_envio: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  tiempo_estimado: {
    type: DataTypes.STRING(30),
    allowNull: true, // ej. '30-45 min'
  },
  estado: {
    type: DataTypes.ENUM('Pendiente', 'En_Ruta', 'Entregado', 'Cancelado'),
    defaultValue: 'Pendiente',
  },
}, {
  tableName: 'botica_deliveries',
  timestamps: true,
});

export default DeliveryPedido;

