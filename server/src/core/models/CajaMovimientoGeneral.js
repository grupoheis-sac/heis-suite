import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const CajaMovimientoGeneral = sequelize.define('CajaMovimientoGeneral', {
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
  id_caja: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  origen_modulo: {
    type: DataTypes.STRING(40),
    defaultValue: 'general',
  },
  tipo: {
    type: DataTypes.ENUM('Ingreso', 'Egreso'),
    allowNull: false,
  },
  metodo_pago: {
    type: DataTypes.STRING(40),
    defaultValue: 'Efectivo',
  },
  concepto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  comprobante: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  monto: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'core_caja_movimientos',
  indexes: [
    { name: 'idx_core_mov_tenant_caja', fields: ['empresa_id', 'id_caja', 'tipo'] },
  ],
});

export default CajaMovimientoGeneral;
