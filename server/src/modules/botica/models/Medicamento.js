import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Medicamento = sequelize.define('BoticaMedicamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  codigo_barras: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  nombre_comercial: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  nombre_generico: {
    type: DataTypes.STRING(200),
    allowNull: true, // Principio Activo DCI (ej. Paracetamol)
  },
  concentracion: {
    type: DataTypes.STRING(100),
    allowNull: true, // ej. 500 mg, 120mg/5ml
  },
  presentacion: {
    type: DataTypes.STRING(100),
    allowNull: true, // Tableta, Jarabe, Cápsula, Inyectable, Suspensión, etc.
  },
  laboratorio: {
    type: DataTypes.STRING(120),
    allowNull: true, // Bayer, Genfar, Medifarma, etc.
  },
  registro_sanitario: {
    type: DataTypes.STRING(60),
    allowNull: true, // Registro Sanitario DIGEMID (ej. EN-01234)
  },
  codigo_digemid: {
    type: DataTypes.STRING(60),
    allowNull: true, // Catálogo OPM DIGEMID
  },
  tipo_controlado: {
    type: DataTypes.ENUM('No_Controlado', 'Psicotropico_Lista_IV', 'Estupefaciente_Lista_II', 'Psicotropico_Lista_III'),
    defaultValue: 'No_Controlado',
  },
  requiere_receta: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fraccionable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  unidades_por_caja: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  unidad_medida: {
    type: DataTypes.STRING(30),
    defaultValue: 'Caja',
  },
  unidad_fraccion: {
    type: DataTypes.STRING(30),
    defaultValue: 'Pastilla',
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
  precio_fraccion: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  stock_cajas: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  stock_fraccion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  stock_minimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  ubicacion: {
    type: DataTypes.STRING(80),
    allowNull: true,
  },
  id_categoria: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'botica_medicamentos',
  timestamps: true,
});

export default Medicamento;

