import { Router } from 'express';
import * as mesasController from '../controllers/mesasController.js';
import * as ordenesController from '../controllers/ordenesController.js';
import * as cocinaController from '../controllers/cocinaController.js';
import * as productosController from '../controllers/productosController.js';
import * as reservasController from '../controllers/reservasController.js';
import * as gastosController from '../controllers/gastosController.js';

const router = Router();

// ================= MESAS Y SALONES =================
router.get('/mesas/areas', mesasController.getAreas);
router.post('/mesas/areas', mesasController.crearArea);
router.post('/mesas/cambiar-mesa', mesasController.cambiarMesa);
router.post('/mesas/unir-mesas', mesasController.unirMesas);
router.get('/mesas/:id', mesasController.getMesaDetalle);
router.post('/mesas', mesasController.crearMesa);
router.put('/mesas/:id', mesasController.actualizarMesa);

// ================= ORDENES Y COMANDAS =================
router.get('/ordenes', ordenesController.getHistorialOrdenes);
router.post('/ordenes/agregar', ordenesController.agregarItemsAMesa);
router.post('/ordenes/cocina', ordenesController.enviarACocina);
router.post('/ordenes/pedir-cuenta', ordenesController.pedirCuenta);
router.post('/ordenes/separar-cuenta', ordenesController.separarCuenta);
router.post('/ordenes/anular-item', ordenesController.anularItem);
router.post('/ordenes/cobrar', ordenesController.cobrarOrden);
router.post('/ordenes/:id/emitir-sunat', ordenesController.emitirSunatOrden);
router.post('/ordenes/:id/anular', ordenesController.anularOrden);

// ================= CARTA Y PRODUCTOS =================
router.get('/productos', productosController.getProductos);
router.get('/productos/categorias', productosController.getCategorias);
router.post('/productos/categorias', productosController.crearCategoria);
router.post('/productos', productosController.crearProducto);
router.put('/productos/:id', productosController.actualizarProducto);
router.delete('/productos/:id', productosController.eliminarProducto);

// ================= MONITOR DE COCINA / KDS =================
router.get('/cocina/comandas', cocinaController.getComandasCocina);
router.patch('/cocina/item/:id/estado', cocinaController.cambiarEstadoItem);

// ================= RESERVAS =================
router.get('/reservas', reservasController.getReservas);
router.post('/reservas', reservasController.crearReserva);
router.put('/reservas/:id', reservasController.actualizarReserva);
router.patch('/reservas/:id/estado', reservasController.cambiarEstadoReserva);
router.delete('/reservas/:id', reservasController.eliminarReserva);

// ================= GASTOS Y CAJA =================
router.get('/gastos', gastosController.getGastos);
router.post('/gastos', gastosController.registrarGasto);
router.put('/gastos/:id', gastosController.actualizarGasto);
router.delete('/gastos/:id', gastosController.eliminarGasto);

export default router;
