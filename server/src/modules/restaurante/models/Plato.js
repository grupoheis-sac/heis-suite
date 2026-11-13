import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Plato = sequelize.define('Plato', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'empresas',
      key: 'id',
    },
  },
  categoria: {
    type: DataTypes.STRING(60),
    defaultValue: 'Platos Fuertes',
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  imagen_url: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'restaurante_platos',
  indexes: [
    { fields: ['empresa_id', 'categoria'] },
  ],
});

export default Plato;

