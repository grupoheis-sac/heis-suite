import Categoria from './Categoria.js';
import Producto from './Producto.js';
import Cliente from './Cliente.js';
import Caja from './Caja.js';
import CajaMovimiento from './CajaMovimiento.js';
import Venta from './Venta.js';
import VentaDetalle from './VentaDetalle.js';
import InventarioMovimiento from './InventarioMovimiento.js';
import Cotizacion from './Cotizacion.js';
import CotizacionDetalle from './CotizacionDetalle.js';
import Proveedor from './Proveedor.js';
import Compra from './Compra.js';
import CompraDetalle from './CompraDetalle.js';
import Custodia from './Custodia.js';
import CustodiaDetalle from './CustodiaDetalle.js';
import OrdenCompra from './OrdenCompra.js';
import OrdenCompraDetalle from './OrdenCompraDetalle.js';
import { Usuario } from '../../../core/models/index.js';

// Relaciones Ferretería
Producto.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });
Categoria.hasMany(Producto, { foreignKey: 'id_categoria', as: 'productos' });

Producto.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
Proveedor.hasMany(Producto, { foreignKey: 'id_proveedor', as: 'productos' });

Venta.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cliente.hasMany(Venta, { foreignKey: 'id_cliente', as: 'ventas' });

Venta.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Venta.belongsTo(Caja, { foreignKey: 'id_caja', as: 'caja' });

Venta.hasMany(VentaDetalle, { foreignKey: 'id_venta', as: 'detalles' });
VentaDetalle.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
VentaDetalle.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });

Caja.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Caja.hasMany(CajaMovimiento, { foreignKey: 'id_caja', as: 'movimientos' });
CajaMovimiento.belongsTo(Caja, { foreignKey: 'id_caja', as: 'caja' });
CajaMovimiento.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

InventarioMovimiento.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
InventarioMovimiento.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

Cotizacion.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cotizacion.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Cotizacion.hasMany(CotizacionDetalle, { foreignKey: 'id_cotizacion', as: 'detalles' });
CotizacionDetalle.belongsTo(Cotizacion, { foreignKey: 'id_cotizacion', as: 'cotizacion' });
CotizacionDetalle.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });

Compra.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
Compra.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Compra.hasMany(CompraDetalle, { foreignKey: 'id_compra', as: 'detalles' });
CompraDetalle.belongsTo(Compra, { foreignKey: 'id_compra', as: 'compra' });
CompraDetalle.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });

Custodia.hasMany(CustodiaDetalle, { foreignKey: 'id_custodia', as: 'detalles' });
CustodiaDetalle.belongsTo(Custodia, { foreignKey: 'id_custodia', as: 'custodia' });
CustodiaDetalle.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
Producto.hasMany(CustodiaDetalle, { foreignKey: 'id_producto', as: 'custodia_detalles' });
Custodia.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cliente.hasMany(Custodia, { foreignKey: 'id_cliente', as: 'custodias' });

// Relaciones Órdenes de Compra
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
Proveedor.hasMany(OrdenCompra, { foreignKey: 'id_proveedor', as: 'ordenes_compra' });
OrdenCompra.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
OrdenCompra.hasMany(OrdenCompraDetalle, { foreignKey: 'id_orden_compra', as: 'detalles' });
OrdenCompraDetalle.belongsTo(OrdenCompra, { foreignKey: 'id_orden_compra', as: 'orden' });
OrdenCompraDetalle.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });
Producto.hasMany(OrdenCompraDetalle, { foreignKey: 'id_producto', as: 'orden_detalles' });

Compra.belongsTo(OrdenCompra, { foreignKey: 'id_orden_compra', as: 'orden_compra' });
OrdenCompra.hasMany(Compra, { foreignKey: 'id_orden_compra', as: 'compras' });

export {
  Categoria,
  Producto,
  Cliente,
  Caja,
  CajaMovimiento,
  Venta,
  VentaDetalle,
  InventarioMovimiento,
  Cotizacion,
  CotizacionDetalle,
  Proveedor,
  Compra,
  CompraDetalle,
  Custodia,
  CustodiaDetalle,
  OrdenCompra,
  OrdenCompraDetalle,
};

export default {
  Categoria,
  Producto,
  Cliente,
  Caja,
  CajaMovimiento,
  Venta,
  VentaDetalle,
  InventarioMovimiento,
  Cotizacion,
  CotizacionDetalle,
  Proveedor,
  Compra,
  CompraDetalle,
  Custodia,
  CustodiaDetalle,
  OrdenCompra,
  OrdenCompraDetalle,
};
