import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const TipoHabitacion = sequelize.define('HospedajeTipoHabitacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  nombre: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  capacidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  precio_base: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 80.00,
  },
  precio_por_hora: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 25.00,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'hospedaje_tipos_habitacion',
  timestamps: true,
});

export default TipoHabitacion;

