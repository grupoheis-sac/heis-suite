import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const RegistroTemperatura = sequelize.define('BoticaRegistroTemperatura', {
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
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  turno: {
    type: DataTypes.ENUM('Mañana', 'Tarde'),
    allowNull: false,
  },
  hora: {
    type: DataTypes.STRING(10),
    allowNull: false, // ej. '09:15', '16:30'
  },
  temp_ambiente: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false, // normal <= 25.0°C
  },
  humedad_relativa: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false, // normal <= 65.0%
  },
  temp_refrigeracion: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: true, // 2.0°C a 8.0°C
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  alerta_generada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'botica_registros_temperatura',
  timestamps: true,
});

export default RegistroTemperatura;

