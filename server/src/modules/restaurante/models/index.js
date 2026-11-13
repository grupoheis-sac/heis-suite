import Area from './Area.js';
import Mesa from './Mesa.js';
import Categoria from './Categoria.js';
import Producto from './Producto.js';
import Orden from './Orden.js';
import OrdenDetalle from './OrdenDetalle.js';
import Reserva from './Reserva.js';
import Gasto from './Gasto.js';
import { Usuario } from '../../../core/models/index.js';

// Relaciones Restaurante
Area.hasMany(Mesa, { foreignKey: 'area_id', as: 'mesas' });
Mesa.belongsTo(Area, { foreignKey: 'area_id', as: 'area' });

Categoria.hasMany(Producto, { foreignKey: 'category_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'category_id', as: 'categoria' });

Mesa.hasMany(Orden, { foreignKey: 'table_id', as: 'ordenes' });
Orden.belongsTo(Mesa, { foreignKey: 'table_id', as: 'mesa' });

Orden.hasMany(OrdenDetalle, { foreignKey: 'order_id', as: 'detalles' });
OrdenDetalle.belongsTo(Orden, { foreignKey: 'order_id', as: 'orden' });

Producto.hasMany(OrdenDetalle, { foreignKey: 'product_id', as: 'detalles' });
OrdenDetalle.belongsTo(Producto, { foreignKey: 'product_id', as: 'producto' });

Usuario.hasMany(Orden, { foreignKey: 'user_id', as: 'ordenes' });
Orden.belongsTo(Usuario, { foreignKey: 'user_id', as: 'mozo' });

Mesa.hasMany(Reserva, { foreignKey: 'table_id', as: 'reservas' });
Reserva.belongsTo(Mesa, { foreignKey: 'table_id', as: 'mesa' });

Gasto.belongsTo(Usuario, { foreignKey: 'user_id', as: 'usuario' });
Usuario.hasMany(Gasto, { foreignKey: 'user_id', as: 'gastos_restaurante' });

export {
  Area,
  Mesa,
  Categoria,
  Producto,
  Orden,
  OrdenDetalle,
  Reserva,
  Gasto,
};

export default {
  Area,
  Mesa,
  Categoria,
  Producto,
  Orden,
  OrdenDetalle,
  Reserva,
  Gasto,
};

