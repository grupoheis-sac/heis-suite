import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Huesped = sequelize.define('HospedajeHuesped', {
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
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  genero: {
    type: DataTypes.ENUM('M', 'F', 'Otro'),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ciudad_origen: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  ocupacion: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  clasificacion: {
    type: DataTypes.ENUM('estandar', 'vip', 'lista_negra'),
    defaultValue: 'estandar',
  },
  notas_internas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'hospedaje_huespedes',
  timestamps: true,
});

export default Huesped;

