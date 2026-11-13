import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  destination: {
    type: DataTypes.ENUM('kitchen', 'bar', 'dessert'),
    defaultValue: 'kitchen',
  },
}, {
  tableName: 'restaurante_categorias',
});

export default Categoria;

