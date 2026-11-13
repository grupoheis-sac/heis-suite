import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Compra = sequelize.define('BoticaCompra', {
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
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  serie: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  numero: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  tipo_comprobante: {
    type: DataTypes.ENUM('Factura', 'Boleta', 'GuiaRemision', 'NotaCredito'),
    defaultValue: 'Factura',
  },
  fecha: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
  },
  subtotal: {
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
  estado: {
    type: DataTypes.ENUM('Registrada', 'Anulada', 'Pendiente'),
    defaultValue: 'Registrada',
  },
}, {
  tableName: 'botica_compras',
  timestamps: true,
});

export default Compra;

