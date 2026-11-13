import { Router } from 'express';
import * as productosController from '../controllers/productosController.js';
import * as posController from '../controllers/posController.js';
import * as cajaController from '../controllers/cajaController.js';
import * as inventarioController from '../controllers/inventarioController.js';
import * as clientesController from '../controllers/clientesController.js';
import * as cotizacionesController from '../controllers/cotizacionesController.js';
import * as comprasController from '../controllers/comprasController.js';
import * as ordenesCompraController from '../controllers/ordenesCompraController.js';
import * as custodiasController from '../controllers/custodiasController.js';
import * as fiscalizacionController from '../controllers/fiscalizacionController.js';
import { consultarDocumento } from '../../../core/controllers/consulta.controller.js';

const router = Router();

// ================= PRODUCTOS Y CATALOGO =================
router.get('/productos', productosController.getProductos);
router.post('/productos', productosController.crearProducto);
router.get('/productos/categorias', productosController.getCategorias);
router.post('/productos/categorias', productosController.crearCategoria);
router.get('/productos/codigo/:codigo', productosController.getProductoPorCodigo);
router.get('/productos/:id', productosController.getProductoPorId);
router.put('/productos/:id', productosController.actualizarProducto);
router.delete('/productos/:id', productosController.eliminarProducto);

router.get('/categorias', productosController.getCategorias);
router.post('/categorias', productosController.crearCategoria);

// ================= VENTAS Y POS =================
router.get('/ventas', posController.getVentas);
router.post('/ventas', posController.crearVenta);
router.get('/ventas/:id', posController.getVentaPorId);
router.post('/ventas/:id/anular', posController.anularVenta);

// ================= CAJA Y ARQUEO =================
router.get('/caja/actual', cajaController.getCajaActual);
router.post('/caja/abrir', cajaController.aperturarCaja);
router.post('/caja/cerrar', cajaController.cerrarCaja);
router.post('/caja/movimiento', cajaController.registrarMovimiento);
router.get('/caja/historial', cajaController.getHistorialCajas);

// ================= INVENTARIO Y KARDEX =================
router.get('/inventario/resumen', inventarioController.getResumen);
router.get('/inventario/kardex', inventarioController.getKardex);
router.post('/inventario/ajuste', inventarioController.registrarAjusteStock);

// ================= CUSTODIA Y DESPACHOS =================
router.get('/inventario/custodias', custodiasController.getCustodias);
router.post('/inventario/custodias', custodiasController.crearCustodia);
router.post('/inventario/custodias/despachar', custodiasController.despacharCustodia);
router.delete('/inventario/custodias/:id', custodiasController.eliminarCustodia);

// ================= CLIENTES =================
router.get('/clientes', clientesController.getClientes);
router.get('/clientes/resumen', clientesController.getResumenClientes);
router.get('/clientes/:id/detalle', clientesController.getClienteDetalle);
router.get('/clientes/:id', clientesController.getClientePorId);
router.post('/clientes', clientesController.crearCliente);
router.put('/clientes/:id', clientesController.actualizarCliente);
router.delete('/clientes/:id', clientesController.eliminarCliente);

// ================= CONSULTAS RUC / DNI =================
router.get('/consultas/:tipo/:numero', consultarDocumento);

// ================= COTIZACIONES =================
router.get('/cotizaciones', cotizacionesController.getCotizaciones);
router.post('/cotizaciones', cotizacionesController.crearCotizacion);

// ================= COMPRAS Y PROVEEDORES =================
router.get('/proveedores', comprasController.getProveedores);
router.post('/proveedores', comprasController.crearProveedor);
router.put('/proveedores/:id', comprasController.actualizarProveedor);
router.delete('/proveedores/:id', comprasController.eliminarProveedor);
router.get('/compras', comprasController.getCompras);
router.post('/compras', comprasController.crearCompra);

// ================= ORDENES DE COMPRA =================
router.get('/ordenes-compra', ordenesCompraController.getOrdenesCompra);
router.post('/ordenes-compra', ordenesCompraController.crearOrdenCompra);
router.patch('/ordenes-compra/:id/estado', ordenesCompraController.cambiarEstadoOrdenCompra);
router.post('/ordenes-compra/:id/recepcionar', ordenesCompraController.recepcionarOrdenCompra);

// ================= FISCALIZACION IQBF / SUCAMEC =================
router.get('/fiscalizacion/resumen', fiscalizacionController.getResumenFiscalizacion);
router.get('/fiscalizacion/productos', fiscalizacionController.getProductosFiscalizados);
router.put('/fiscalizacion/productos/:id', fiscalizacionController.actualizarProductoFiscalizado);
router.get('/fiscalizacion/exportar', fiscalizacionController.exportarFiscalizacion);

export default router;

