import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const InventarioMovimiento = sequelize.define('InventarioMovimiento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_producto: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('Entrada', 'Salida', 'Ajuste', 'Anulacion'),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  stock_antes: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  stock_despues: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'ferreteria_inventario_movimientos',
  indexes: [
    { fields: ['id_producto'] },
    { fields: ['fecha'] },
    { fields: ['empresa_id'] },
  ],
});

export default InventarioMovimiento;

