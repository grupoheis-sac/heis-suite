import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Cotizacion = sequelize.define('Cotizacion', {
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
  serie: {
    type: DataTypes.STRING(10),
    defaultValue: 'COT',
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  obra: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  contacto_nombre: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  contacto_telefono: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  lugar_entrega: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  tiempo_entrega: {
    type: DataTypes.STRING(100),
    defaultValue: 'Inmediato',
  },
  forma_pago: {
    type: DataTypes.STRING(100),
    defaultValue: 'Contado',
  },
  incluye_flete: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  id_venta: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  igv: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  validez_dias: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  estado: {
    type: DataTypes.STRING(30),
    defaultValue: 'Pendiente',
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ferreteria_cotizaciones',
  indexes: [
    { fields: ['numero'] },
    { fields: ['id_cliente'] },
    { fields: ['empresa_id'] },
  ],
});

export default Cotizacion;

