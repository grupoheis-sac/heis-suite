import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const PagoSuscripcionSaaS = sequelize.define('PagoSuscripcionSaaS', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  plan: {
    type: DataTypes.STRING(40),
    allowNull: false,
    defaultValue: 'professional',
  },
  periodo_meses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  moneda: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'PEN',
  },
  metodo_pago: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Transferencia',
    // 'Transferencia' | 'Yape' | 'Plin' | 'Tarjeta' | 'Efectivo'
  },
  numero_operacion: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  fecha_pago: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  vigencia_desde: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  vigencia_hasta: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('CONFIRMADO', 'PENDIENTE', 'ANULADO'),
    defaultValue: 'CONFIRMADO',
  },
  registrado_por: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'core_pagos_suscripcion_saas',
  indexes: [
    { name: 'idx_pagos_saas_empresa', fields: ['empresa_id', 'fecha_pago'] },
  ],
});

export default PagoSuscripcionSaaS;
