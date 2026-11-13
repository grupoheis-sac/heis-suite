import Categoria from './Categoria.js';
import Medicamento from './Medicamento.js';
import Lote from './Lote.js';
import RegistroTemperatura from './RegistroTemperatura.js';
import Venta from './Venta.js';
import VentaDetalle from './VentaDetalle.js';
import Caja from './Caja.js';
import CajaMovimiento from './CajaMovimiento.js';
import KardexFarmacia from './KardexFarmacia.js';
import Cliente from './Cliente.js';
import Proveedor from './Proveedor.js';
import Compra from './Compra.js';
import CompraDetalle from './CompraDetalle.js';
import ActaBaja from './ActaBaja.js';
import ActaBajaDetalle from './ActaBajaDetalle.js';
import DeliveryPedido from './DeliveryPedido.js';
import DevolucionProveedor from './DevolucionProveedor.js';
import { Usuario } from '../../../core/models/index.js';

// ================= ASOCIACIONES BOTICA =================
// Categoria <-> Medicamentos
Medicamento.belongsTo(Categoria, { foreignKey: 'id_categoria', as: 'categoria' });
Categoria.hasMany(Medicamento, { foreignKey: 'id_categoria', as: 'medicamentos' });

// Medicamento <-> Lotes
Medicamento.hasMany(Lote, { foreignKey: 'id_medicamento', as: 'lotes' });
Lote.belongsTo(Medicamento, { foreignKey: 'id_medicamento', as: 'medicamento' });

// Venta <-> Cliente, Usuario, Caja
Venta.belongsTo(Cliente, { foreignKey: 'id_cliente', as: 'cliente' });
Cliente.hasMany(Venta, { foreignKey: 'id_cliente', as: 'ventas' });

Venta.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Venta.belongsTo(Caja, { foreignKey: 'id_caja', as: 'caja' });

// Venta <-> VentaDetalle <-> Medicamento, Lote
Venta.hasMany(VentaDetalle, { foreignKey: 'id_venta', as: 'detalles' });
VentaDetalle.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
VentaDetalle.belongsTo(Medicamento, { foreignKey: 'id_medicamento', as: 'medicamento' });
VentaDetalle.belongsTo(Lote, { foreignKey: 'id_lote', as: 'lote' });

// Caja <-> Usuario & Movimientos
Caja.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Caja.hasMany(CajaMovimiento, { foreignKey: 'id_caja', as: 'movimientos' });
CajaMovimiento.belongsTo(Caja, { foreignKey: 'id_caja', as: 'caja' });
CajaMovimiento.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// Kardex Farmacia
KardexFarmacia.belongsTo(Medicamento, { foreignKey: 'id_medicamento', as: 'medicamento' });
Medicamento.hasMany(KardexFarmacia, { foreignKey: 'id_medicamento', as: 'movimientos_kardex' });

KardexFarmacia.belongsTo(Lote, { foreignKey: 'id_lote', as: 'lote' });
KardexFarmacia.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// Registro Temperatura BPA
RegistroTemperatura.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

// Compras
Compra.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
Proveedor.hasMany(Compra, { foreignKey: 'id_proveedor', as: 'compras' });

Compra.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
Compra.hasMany(CompraDetalle, { foreignKey: 'id_compra', as: 'detalles' });
CompraDetalle.belongsTo(Compra, { foreignKey: 'id_compra', as: 'compra' });
CompraDetalle.belongsTo(Medicamento, { foreignKey: 'id_medicamento', as: 'medicamento' });

// Actas de Baja
ActaBaja.belongsTo(Usuario, { foreignKey: 'id_usuario_qf', as: 'usuario_qf' });
ActaBaja.hasMany(ActaBajaDetalle, { foreignKey: 'id_acta_baja', as: 'detalles' });
ActaBajaDetalle.belongsTo(ActaBaja, { foreignKey: 'id_acta_baja', as: 'acta' });
ActaBajaDetalle.belongsTo(Medicamento, { foreignKey: 'id_medicamento', as: 'medicamento' });
ActaBajaDetalle.belongsTo(Lote, { foreignKey: 'id_lote', as: 'lote' });

// Delivery
DeliveryPedido.belongsTo(Venta, { foreignKey: 'id_venta', as: 'venta' });
DeliveryPedido.belongsTo(Usuario, { foreignKey: 'id_usuario_despacho', as: 'usuario_despacho' });

// Devoluciones
DevolucionProveedor.belongsTo(Proveedor, { foreignKey: 'id_proveedor', as: 'proveedor' });
DevolucionProveedor.belongsTo(Usuario, { foreignKey: 'id_usuario', as: 'usuario' });

export {
  Categoria,
  Medicamento,
  Lote,
  RegistroTemperatura,
  Venta,
  VentaDetalle,
  Caja,
  CajaMovimiento,
  KardexFarmacia,
  Cliente,
  Proveedor,
  Compra,
  CompraDetalle,
  ActaBaja,
  ActaBajaDetalle,
  DeliveryPedido,
  DevolucionProveedor,
};

