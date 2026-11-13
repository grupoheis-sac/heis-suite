import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Acompanante = sequelize.define('HospedajeAcompanante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tipo_documento: {
    type: DataTypes.ENUM('DNI', 'Pasaporte', 'CE', 'RUC'),
    defaultValue: 'DNI',
  },
  num_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  nacionalidad: {
    type: DataTypes.STRING(60),
    defaultValue: 'Peruana',
  },
  parentesco: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'hospedaje_acompanantes',
  timestamps: true,
});

export default Acompanante;

