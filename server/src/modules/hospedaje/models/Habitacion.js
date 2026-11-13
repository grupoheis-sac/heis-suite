import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Habitacion = sequelize.define('HospedajeHabitacion', {
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
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  piso: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '1',
  },
  tipo_habitacion_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'ocupada', 'mantenimiento', 'reservada'),
    defaultValue: 'disponible',
  },
  estado_limpieza: {
    type: DataTypes.ENUM('limpia', 'en_limpieza', 'sucia', 'inspeccion'),
    defaultValue: 'limpia',
  },
  limpieza_actualizado: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  limpieza_notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  limpieza_user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imagen: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  activa: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'hospedaje_habitaciones',
  timestamps: true,
});

export default Habitacion;

