import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const CompraDetalle = sequelize.define('BoticaCompraDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_compra: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_medicamento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  numero_lote: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  fecha_vencimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  cantidad: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
}, {
  tableName: 'botica_compra_detalles',
  timestamps: true,
});

export default CompraDetalle;

