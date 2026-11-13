import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Reserva = sequelize.define('HospedajeReserva', {
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
  codigo: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  huesped_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  habitacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_entrada: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_salida: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_checkin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  fecha_checkout: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  num_personas: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  modalidad: {
    type: DataTypes.ENUM('noches', 'horas'),
    defaultValue: 'noches',
  },
  num_horas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  precio_hora: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  ciudad_destino: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  motivo_viaje: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'checkin', 'checkout', 'cancelada', 'no_show'),
    defaultValue: 'pendiente',
  },
  precio_noche: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  num_noches: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  subtotal: {
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
    defaultValue: 0.00,
  },
  adelanto: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  saldo: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  origen: {
    type: DataTypes.ENUM('web', 'telefono', 'presencial', 'agencia'),
    defaultValue: 'presencial',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tarjeta_llave_codigo: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'hospedaje_reservas',
  timestamps: true,
});

export default Reserva;

