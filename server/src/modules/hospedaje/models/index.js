import TipoHabitacion from './TipoHabitacion.js';
import Habitacion from './Habitacion.js';
import Huesped from './Huesped.js';
import Acompanante from './Acompanante.js';
import Reserva from './Reserva.js';
import CargoAdicional from './CargoAdicional.js';
import Factura from './Factura.js';
import Pago from './Pago.js';
import ProductoHotel from './ProductoHotel.js';
import TurnoCaja from './TurnoCaja.js';
import MovimientoCaja from './MovimientoCaja.js';
import Proveedor from './Proveedor.js';
import CompraStock from './CompraStock.js';
import { Usuario } from '../../../core/models/index.js';

// ================= ASOCIACIONES HOSPEDAJE =================

// Tipo <-> Habitaciones
TipoHabitacion.hasMany(Habitacion, { foreignKey: 'tipo_habitacion_id', as: 'habitaciones' });
Habitacion.belongsTo(TipoHabitacion, { foreignKey: 'tipo_habitacion_id', as: 'tipo' });

// Habitacion <-> Reservas
Habitacion.hasMany(Reserva, { foreignKey: 'habitacion_id', as: 'reservas' });
Reserva.belongsTo(Habitacion, { foreignKey: 'habitacion_id', as: 'habitacion' });

// Limpieza Camarera
Habitacion.belongsTo(Usuario, { foreignKey: 'limpieza_user_id', as: 'camarera' });
Usuario.hasMany(Habitacion, { foreignKey: 'limpieza_user_id', as: 'habitaciones_limpieza' });

// Huesped <-> Reservas
Huesped.hasMany(Reserva, { foreignKey: 'huesped_id', as: 'reservas' });
Reserva.belongsTo(Huesped, { foreignKey: 'huesped_id', as: 'huesped' });

// Usuario <-> Reservas
Usuario.hasMany(Reserva, { foreignKey: 'user_id', as: 'reservas_creadas' });
Reserva.belongsTo(Usuario, { foreignKey: 'user_id', as: 'usuario' });

// Reserva <-> Acompanantes
Reserva.hasMany(Acompanante, { foreignKey: 'reserva_id', as: 'acompanantes' });
Acompanante.belongsTo(Reserva, { foreignKey: 'reserva_id', as: 'reserva' });

// Reserva <-> Cargos Adicionales (Frigobar, Room Service, etc.)
Reserva.hasMany(CargoAdicional, { foreignKey: 'reserva_id', as: 'cargos' });
CargoAdicional.belongsTo(Reserva, { foreignKey: 'reserva_id', as: 'reserva' });

// Reserva <-> Facturas
Reserva.hasMany(Factura, { foreignKey: 'reserva_id', as: 'facturas' });
Factura.belongsTo(Reserva, { foreignKey: 'reserva_id', as: 'reserva' });

// Huesped <-> Facturas
Huesped.hasMany(Factura, { foreignKey: 'huesped_id', as: 'facturas' });
Factura.belongsTo(Huesped, { foreignKey: 'huesped_id', as: 'huesped' });

// Factura <-> Pagos
Factura.hasMany(Pago, { foreignKey: 'factura_id', as: 'pagos' });
Pago.belongsTo(Factura, { foreignKey: 'factura_id', as: 'factura' });

// Caja y Turnos
Usuario.hasMany(TurnoCaja, { foreignKey: 'user_id', as: 'turnos_hotel' });
TurnoCaja.belongsTo(Usuario, { foreignKey: 'user_id', as: 'usuario' });

TurnoCaja.hasMany(MovimientoCaja, { foreignKey: 'turno_id', as: 'movimientos' });
MovimientoCaja.belongsTo(TurnoCaja, { foreignKey: 'turno_id', as: 'turno' });

TurnoCaja.hasMany(Pago, { foreignKey: 'turno_id', as: 'pagos' });
Pago.belongsTo(TurnoCaja, { foreignKey: 'turno_id', as: 'turno' });

// Proveedores & Compras
Proveedor.hasMany(CompraStock, { foreignKey: 'proveedor_id', as: 'compras' });
CompraStock.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

export {
  TipoHabitacion,
  Habitacion,
  Huesped,
  Acompanante,
  Reserva,
  CargoAdicional,
  Factura,
  Pago,
  ProductoHotel,
  TurnoCaja,
  MovimientoCaja,
  Proveedor,
  CompraStock,
};

