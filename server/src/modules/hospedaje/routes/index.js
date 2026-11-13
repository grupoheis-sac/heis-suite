import { Router } from 'express';
import * as habitacionesController from '../controllers/habitacionesController.js';
import * as reservasController from '../controllers/reservasController.js';
import * as huespedesController from '../controllers/huespedesController.js';
import * as cargosController from '../controllers/cargosController.js';
import * as facturasController from '../controllers/facturasController.js';
import * as catalogoController from '../controllers/catalogoController.js';
import * as cajaController from '../controllers/cajaController.js';
import * as reportesController from '../controllers/reportesController.js';
import * as comprasController from '../controllers/comprasController.js';

const router = Router();

// ================= HABITACIONES Y PISOS =================
router.get('/habitaciones', habitacionesController.getHabitaciones);
router.post('/habitaciones', habitacionesController.crearHabitacion);
router.get('/habitaciones/tipos', habitacionesController.getTipos);
router.get('/habitaciones/:id', habitacionesController.getHabitacionPorId);
router.put('/habitaciones/:id/estado', habitacionesController.actualizarEstado);

// ================= RESERVAS Y CHECK-IN / CHECK-OUT =================
router.get('/reservas', reservasController.getReservas);
router.post('/reservas', reservasController.crearReserva);
router.post('/reservas/:id/checkin', reservasController.checkIn);
router.post('/reservas/:id/checkout', reservasController.checkOut);

// ================= HUÉSPEDES Y MINCETUR =================
router.get('/huespedes', huespedesController.getHuespedes);
router.post('/huespedes', huespedesController.crearHuesped);
router.get('/huespedes/doc/:doc', huespedesController.getHuespedPorDocumento);
router.get('/huespedes/mincetur/libro', huespedesController.getLibroMincetur);

// ================= CONSUMOS Y CARGOS A LA HABITACIÓN =================
router.get('/cargos/:reserva_id', cargosController.getCargosPorReserva);
router.post('/cargos', cargosController.agregarCargo);

// ================= FACTURACIÓN HOTELERA =================
router.get('/facturas', facturasController.getFacturas);
router.post('/facturas', facturasController.crearFactura);

// ================= CATÁLOGO DE PRODUCTOS / MINIBAR =================
router.get('/catalogo', catalogoController.getProductos);
router.post('/catalogo', catalogoController.crearProducto);

// ================= CAJA RECEPCIÓN =================
router.get('/caja/actual', cajaController.getCajaActual);
router.post('/caja/abrir', cajaController.abrirCaja);
router.post('/caja/cerrar/:id', cajaController.cerrarCaja);
router.post('/caja/movimiento', cajaController.registrarMovimiento);

// ================= REPORTES Y DASHBOARD =================
router.get('/dashboard', reportesController.getDashboard);

// ================= COMPRAS Y PROVEEDORES =================
router.get('/proveedores', comprasController.getProveedores);
router.post('/proveedores', comprasController.crearProveedor);
router.get('/compras', comprasController.getCompras);
router.post('/compras', comprasController.crearCompra);

export default router;

