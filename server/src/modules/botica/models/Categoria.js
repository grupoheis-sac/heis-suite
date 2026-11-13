import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Categoria = sequelize.define('BoticaCategoria', {
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
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icono: {
    type: DataTypes.STRING(50),
    defaultValue: 'Pill',
  },
  color: {
    type: DataTypes.STRING(50),
    defaultValue: '#10B981',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'botica_categorias',
  timestamps: true,
});

export default Categoria;

