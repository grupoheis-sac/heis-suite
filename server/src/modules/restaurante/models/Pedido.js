import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'empresas',
      key: 'id',
    },
  },
  sucursal_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sucursales',
      key: 'id',
    },
  },
  mesa_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'restaurante_mesas',
      key: 'id',
    },
  },
  mesa_numero: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  mozo_nombre: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  cliente_nombre: {
    type: DataTypes.STRING(120),
    defaultValue: 'Público General',
  },
  cliente_documento: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en_cocina', 'servido', 'pagado', 'anulado'),
    defaultValue: 'pendiente',
  },
  tipo_comprobante: {
    type: DataTypes.STRING(20),
    defaultValue: 'NOTA_VENTA', // BOLETA, FACTURA, NOTA_VENTA
  },
  metodo_pago: {
    type: DataTypes.STRING(40),
    defaultValue: 'EFECTIVO', // YAPE, PLIN, TARJETA, EFECTIVO
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  igv: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  items: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
  },
}, {
  tableName: 'restaurante_pedidos',
  indexes: [
    { fields: ['empresa_id', 'sucursal_id'] },
    { fields: ['estado'] },
    { fields: ['created_at'] },
  ],
});

export default Pedido;

