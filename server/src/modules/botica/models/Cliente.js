import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Cliente = sequelize.define('BoticaCliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_documento: {
    type: DataTypes.ENUM('DNI', 'RUC', 'CE', 'PASAPORTE', 'OTRO'),
    defaultValue: 'DNI',
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  puntos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'botica_clientes',
  timestamps: true,
});

export default Cliente;

