import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

export const ComprobanteElectronico = sequelize.define('ComprobanteElectronico', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
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
    allowNull: true,
  },
  origen_modulo: {
    type: DataTypes.STRING(40),
    allowNull: false,
    defaultValue: 'general',
    // 'restaurante' | 'ferreteria' | 'botica' | 'hospedaje' | 'general'
  },
  origen_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  tipo_documento_codigo: {
    type: DataTypes.STRING(4),
    allowNull: false,
    defaultValue: '03',
    // '01' = Factura, '03' = Boleta, '07' = Nota de Crédito, '08' = Nota de Débito
  },
  tipo_comprobante: {
    type: DataTypes.ENUM('Factura', 'Boleta', 'NotaCredito', 'NotaDebito'),
    allowNull: false,
    defaultValue: 'Boleta',
  },
  serie: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  correlativo: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  numero_formato: {
    type: DataTypes.STRING(25),
    allowNull: false,
    // Ejemplo: F001-00000125
  },
  fecha_emision: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  moneda: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'PEN',
  },
  cliente_tipo_doc: {
    type: DataTypes.STRING(2),
    allowNull: false,
    defaultValue: '1',
    // '6' = RUC, '1' = DNI, '4' = CE, '0' = Sin Documento
  },
  cliente_num_doc: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '00000000',
  },
  cliente_razon_social: {
    type: DataTypes.STRING(250),
    allowNull: false,
    defaultValue: 'CLIENTE VARIOS',
  },
  cliente_direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  op_gravadas: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  op_exoneradas: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  op_inafectas: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  descuento_global: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  igv: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  items_json: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
  doc_referencia_serie_num: {
    type: DataTypes.STRING(25),
    allowNull: true,
  },
  doc_referencia_motivo: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  entorno_sunat: {
    type: DataTypes.ENUM('beta', 'produccion'),
    defaultValue: 'beta',
  },
  sunat_estado: {
    type: DataTypes.ENUM('PENDIENTE', 'ACEPTADO', 'OBSERVADO', 'RECHAZADO', 'ANULADO'),
    defaultValue: 'PENDIENTE',
  },
  sunat_codigo_respuesta: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  sunat_descripcion: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  sunat_hash: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  sunat_qr: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  xml_firmado: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  cdr_respuesta: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
}, {
  tableName: 'core_comprobantes_electronicos',
  indexes: [
    {
      name: 'idx_cpe_tenant_serie_corr',
      unique: true,
      fields: ['empresa_id', 'serie', 'correlativo'],
    },
    {
      name: 'idx_cpe_tenant_fecha',
      fields: ['empresa_id', 'fecha_emision'],
    },
    {
      name: 'idx_cpe_origen',
      fields: ['empresa_id', 'origen_modulo', 'origen_id'],
    },
  ],
});

export default ComprobanteElectronico;
