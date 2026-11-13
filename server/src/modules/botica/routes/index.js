import { Router } from 'express';
import * as medicamentosController from '../controllers/medicamentosController.js';
import * as lotesController from '../controllers/lotesController.js';
import * as posController from '../controllers/posController.js';
import * as cajaController from '../controllers/cajaController.js';
import * as kardexController from '../controllers/kardexController.js';
import * as temperaturaController from '../controllers/temperaturaController.js';
import * as digemidController from '../controllers/digemidController.js';
import * as bajasController from '../controllers/bajasController.js';
import * as deliveryController from '../controllers/deliveryController.js';
import * as clientesController from '../controllers/clientesController.js';
import * as comprasController from '../controllers/comprasController.js';
import * as reportesController from '../controllers/reportesController.js';

const router = Router();

// ================= MEDICAMENTOS & CATÁLOGO =================
router.get('/medicamentos', medicamentosController.getMedicamentos);
router.post('/medicamentos', medicamentosController.crearMedicamento);
router.get('/medicamentos/categorias', medicamentosController.getCategorias);
router.post('/medicamentos/categorias', medicamentosController.crearCategoria);
router.get('/medicamentos/:id', medicamentosController.getMedicamentoPorId);
router.put('/medicamentos/:id', medicamentosController.actualizarMedicamento);
router.delete('/medicamentos/:id', medicamentosController.eliminarMedicamento);

router.get('/categorias', medicamentosController.getCategorias);
router.post('/categorias', medicamentosController.crearCategoria);

// ================= LOTES & FEFO =================
router.get('/lotes', lotesController.getLotes);
router.post('/lotes', lotesController.crearLote);

// ================= VENTAS & POS DISPENSACIÓN =================
router.get('/ventas', posController.getVentas);
router.post('/ventas', posController.crearVenta);
router.get('/ventas/:id', posController.getVentaPorId);
router.post('/ventas/:id/anular', posController.anularVenta);

// ================= CAJA & ARQUEO =================
router.get('/caja/actual', cajaController.getCajaActual);
router.post('/caja/abrir', cajaController.aperturarCaja);
router.post('/caja/cerrar/:id', cajaController.cerrarCaja);
router.post('/caja/movimiento', cajaController.registrarMovimiento);
router.get('/caja/historial', cajaController.getHistorialCajas);

// ================= KARDEX FARMACÉUTICO 13.1 =================
router.get('/kardex', kardexController.getKardex);
router.get('/inventario/resumen', kardexController.getResumen);

// ================= CONTROL TEMPERATURA Y HUMEDAD BPA =================
router.get('/temperatura', temperaturaController.getRegistros);
router.post('/temperatura', temperaturaController.crearRegistro);

// ================= OBSERVATORIO DIGEMID =================
router.get('/digemid/catalogo', digemidController.getCatalogoDigemid);

// ================= ACTAS DE BAJA Y CUARENTENA =================
router.get('/bajas', bajasController.getActasBaja);
router.post('/bajas', bajasController.crearActaBaja);

// ================= DELIVERY Y DESPACHOS =================
router.get('/delivery', deliveryController.getDeliveries);
router.post('/delivery', deliveryController.crearDelivery);
router.put('/delivery/:id/estado', deliveryController.actualizarEstadoDelivery);

// ================= CLIENTES =================
router.get('/clientes', clientesController.getClientes);
router.post('/clientes', clientesController.crearCliente);
router.get('/clientes/:id', clientesController.getClientePorId);
router.put('/clientes/:id', clientesController.actualizarCliente);

// ================= PROVEEDORES & COMPRAS =================
router.get('/proveedores', comprasController.getProveedores);
router.post('/proveedores', comprasController.crearProveedor);
router.get('/compras', comprasController.getCompras);
router.post('/compras', comprasController.crearCompra);

// ================= REPORTES =================
router.get('/reportes', reportesController.getReporteGeneral);

export default router;

