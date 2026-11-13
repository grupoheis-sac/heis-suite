import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Proveedor = sequelize.define('BoticaProveedor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  ruc: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  razon_social: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  nombre_contacto: {
    type: DataTypes.STRING(120),
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
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'botica_proveedores',
  timestamps: true,
});

export default Proveedor;

