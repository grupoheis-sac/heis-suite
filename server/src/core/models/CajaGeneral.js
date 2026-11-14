import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const CajaGeneral = sequelize.define('CajaGeneral', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  origen_modulo: {
    type: DataTypes.STRING(40),
    defaultValue: 'general',
    // 'general' | 'restaurante' | 'ferreteria' | 'botica' | 'hospedaje'
  },
  ref_legacy_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  monto_inicial: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  monto_final: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  total_ventas_efectivo: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_ventas_digital: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_ingresos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total_egresos: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  saldo_esperado: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  diferencia: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  fecha_apertura: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_cierre: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('Abierta', 'Cerrada'),
    defaultValue: 'Abierta',
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'core_cajas',
  indexes: [
    { name: 'idx_core_cajas_tenant_estado', fields: ['empresa_id', 'sucursal_id', 'estado'] },
    { name: 'idx_core_cajas_tenant_apertura', fields: ['empresa_id', 'fecha_apertura'] },
    { name: 'idx_core_cajas_legacy', fields: ['origen_modulo', 'ref_legacy_id'] },
  ],
});

export default CajaGeneral;
