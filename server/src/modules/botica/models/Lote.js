import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Lote = sequelize.define('BoticaLote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_medicamento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  numero_lote: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  stock_cajas: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  stock_fraccion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  costo_compra: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'botica_lotes',
  timestamps: true,
});

export default Lote;

