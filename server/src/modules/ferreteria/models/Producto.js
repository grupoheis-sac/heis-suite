import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Producto = sequelize.define('Producto', {
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
  codigo_barras: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precio_compra: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  precio_venta: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  precio_mayorista: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: null,
  },
  stock: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 0.000,
  },
  stock_minimo: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: false,
    defaultValue: 5.000,
  },
  unidad_medida: {
    type: DataTypes.STRING(30),
    defaultValue: 'Unidad',
  },
  ubicacion: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  imagen: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  marca: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  es_material_construccion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  es_fiscalizado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  codigo_iqbf: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  tipo_fiscalizacion: {
    type: DataTypes.STRING(50),
    defaultValue: 'NINGUNO',
  },
  norma_tecnica: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  es_combo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'ferreteria_productos',
  indexes: [
    { fields: ['codigo_barras'] },
    { fields: ['nombre'] },
    { fields: ['id_categoria'] },
    { fields: ['empresa_id'] },
  ],
});

export default Producto;

