import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const VentaDetalle = sequelize.define('BoticaVentaDetalle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_medicamento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_lote: {
    type: DataTypes.INTEGER,
    allowNull: true, // Lote asignado por FEFO
  },
  formato_venta: {
    type: DataTypes.ENUM('Caja', 'Fraccion'),
    defaultValue: 'Caja',
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
  tableName: 'botica_venta_detalles',
  timestamps: true,
});

export default VentaDetalle;

