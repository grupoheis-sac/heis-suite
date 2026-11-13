import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const KardexFarmacia = sequelize.define('BoticaKardexFarmacia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_sucursal: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_medicamento: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_lote: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_movimiento: {
    type: DataTypes.ENUM(
      'ENTRADA',
      'SALIDA',
      'AJUSTE_POSITIVO',
      'AJUSTE_NEGATIVO',
      'MERMA_VENCIMIENTO',
      'MERMA_DETERIORO',
      'DEVOLUCION_PROVEEDOR',
      'TRASLADO_SALIDA',
      'TRASLADO_ENTRADA'
    ),
    allowNull: false,
  },
  cantidad_cajas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  cantidad_fraccion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  saldo_cajas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  saldo_fraccion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  motivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  referencia_documento: {
    type: DataTypes.STRING(100),
    allowNull: true, // ej. Boleta B001-00042, Factura F001-1234
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'botica_kardex_farmacia',
  timestamps: true,
});

export default KardexFarmacia;

