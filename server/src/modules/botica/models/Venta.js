import { DataTypes } from 'sequelize';
import sequelize from '../../../config/db.js';

export const Venta = sequelize.define('BoticaVenta', {
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
  serie: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'B001',
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  tipo_comprobante: {
    type: DataTypes.ENUM('Boleta', 'Factura', 'Ticket', 'NotaCredito'),
    defaultValue: 'Boleta',
  },
  id_cliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_caja: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_pago: {
    type: DataTypes.STRING(50),
    defaultValue: 'Efectivo',
  },
  numero_operacion: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  medico_cmp: {
    type: DataTypes.STRING(30),
    allowNull: true, // CMP del médico tratante
  },
  medico_nombre: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  numero_receta: {
    type: DataTypes.STRING(40),
    allowNull: true, // Receta médica retenida DIGEMID
  },
  paciente_dni: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  paciente_nombre: {
    type: DataTypes.STRING(120),
    allowNull: true,
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
  descuento: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  total: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  monto_recibido: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
  },
  vuelto: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  estado: {
    type: DataTypes.ENUM('Completada', 'Anulada', 'Pendiente'),
    defaultValue: 'Completada',
  },
  puntos_ganados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  puntos_canjeados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'botica_ventas',
  timestamps: true,
});

export default Venta;

