import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { sembrarTodasLasCredenciales } from './seed_credenciales.js';
import { sequelize, Empresa, Usuario, Sucursal, Rol, AuditoriaLog } from '../core/models/index.js';
import {
  Area,
  Mesa,
  Categoria,
  Producto,
  Orden,
  OrdenDetalle,
  Reserva,
  Gasto,
} from '../modules/restaurante/models/index.js';
import {
  Categoria as CategoriaFerreteria,
  Producto as ProductoFerreteria,
  Cliente as ClienteFerreteria,
  Caja as CajaFerreteria,
  CajaMovimiento as CajaMovimientoFerreteria,
  Venta as VentaFerreteria,
  VentaDetalle as VentaDetalleFerreteria,
  InventarioMovimiento as InventarioMovimientoFerreteria,
  Cotizacion as CotizacionFerreteria,
  CotizacionDetalle as CotizacionDetalleFerreteria,
  Proveedor as ProveedorFerreteria,
  Compra as CompraFerreteria,
  CompraDetalle as CompraDetalleFerreteria,
  Custodia as CustodiaFerreteria,
  CustodiaDetalle as CustodiaDetalleFerreteria,
} from '../modules/ferreteria/models/index.js';
import {
  Categoria as CategoriaBotica,
  Medicamento as MedicamentoBotica,
  Lote as LoteBotica,
  RegistroTemperatura as RegistroTemperaturaBotica,
  Caja as CajaBotica,
  Cliente as ClienteBotica,
  Proveedor as ProveedorBotica,
  KardexFarmacia as KardexFarmaciaBotica,
} from '../modules/botica/models/index.js';
import {
  TipoHabitacion as TipoHabitacionHospedaje,
  Habitacion as HabitacionHospedaje,
  Huesped as HuespedHospedaje,
  Reserva as ReservaHospedaje,
  TurnoCaja as TurnoCajaHospedaje,
  ProductoHotel as ProductoHotelHospedaje,
} from '../modules/hospedaje/models/index.js';

dotenv.config();

async function asegurarBaseDatosExiste() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'heis_suite_db';

  try {
    const conn = await mysql.createConnection({ host, port, user, password });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ Base de datos '${database}' verificada o creada en MySQL.`);
    await conn.end();
  } catch (error) {
    console.error('⚠️  No se pudo conectar directamente a MySQL para verificar la base de datos:', error.message);
  }
}

export async function runSeeder() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    console.warn('⚠️ Seeder cancelado: La ejecución de seeders en producción está bloqueada por seguridad. Para forzar, configure ALLOW_SEED=true.');
    return;
  }
  console.log('🚀 Iniciando sembrado y sincronización de HEIS Suite Multi-Tenant...');

  try {
    // 0. Asegurar existencia de la BD
    await asegurarBaseDatosExiste();

    // Sincronizar todas las tablas de forma segura
    const shouldAlter = process.env.DB_SYNC_ALTER === 'true' && process.env.NODE_ENV !== 'production';
    await sequelize.sync({ alter: shouldAlter });
    console.log('✅ Tablas sincronizadas con éxito (Core + Restaurante + Ferretería).');

    // 1. Crear o actualizar SuperAdmin Plataforma
    const superadminPass = await bcrypt.hash('admin123', 10);
    const [superadmin] = await Usuario.findOrCreate({
      where: { email: 'superadmin@heissuite.com' },
      defaults: {
        nombre: 'SuperAdmin HEIS',
        email: 'superadmin@heissuite.com',
        password_hash: superadminPass,
        rol: 'superadmin',
        activo: true,
      },
    });
    console.log('👑 SuperAdmin listo: superadmin@heissuite.com');

    // 2. Crear Empresa Demo Multi-Módulo
    const [empresa] = await Empresa.findOrCreate({
      where: { ruc: '20601234567' },
      defaults: {
        nombre: 'Corporación HEIS Demo',
        ruc: '20601234567',
        direccion: 'Av. Javier Prado Este 4500, Lima',
        telefono: '01 445-8900',
        plan: 'enterprise',
        modulos_activos: ['restaurante', 'ferreteria', 'botica', 'hospedaje'],
        color_brand: '#f59e0b',
        activo: true,
      },
    });
    console.log('🏢 Empresa Demo lista:', empresa.nombre);

    // 3. Crear Sedes
    const [sedePrincipal] = await Sucursal.findOrCreate({
      where: { empresa_id: empresa.id, es_principal: true },
      defaults: {
        empresa_id: empresa.id,
        nombre: 'Sede Central - San Isidro',
        codigo: 'SEDE-01',
        direccion: 'Av. Las Begonias 441',
        telefono: '998-123-456',
        email: 'sanisidro@heissuite.com',
        ciudad: 'Lima',
        es_principal: true,
        activo: true,
      },
    });

    const [sedeMiraflores] = await Sucursal.findOrCreate({
      where: { empresa_id: empresa.id, nombre: 'Sede Miraflores - Malecón' },
      defaults: {
        empresa_id: empresa.id,
        nombre: 'Sede Miraflores - Malecón',
        codigo: 'SEDE-02',
        direccion: 'Malecón de la Reserva 610',
        telefono: '998-654-321',
        email: 'miraflores@heissuite.com',
        ciudad: 'Lima',
        es_principal: false,
        activo: true,
      },
    });
    console.log('📍 Sedes listas: Sede Central y Sede Miraflores');

    // 4. Crear Roles Base
    const [rolAdmin] = await Rol.findOrCreate({
      where: { empresa_id: empresa.id, nombre: 'Administrador' },
      defaults: {
        empresa_id: empresa.id,
        nombre: 'Administrador',
        descripcion: 'Control y supervisión ejecutiva total',
        permisos: { all: true },
        es_sistema: true,
      },
    });

    const [rolCajero] = await Rol.findOrCreate({
      where: { empresa_id: empresa.id, nombre: 'Cajero' },
      defaults: {
        empresa_id: empresa.id,
        nombre: 'Cajero',
        descripcion: 'Cobros, facturación y turnos de caja',
        permisos: { ventas: true, caja: true },
        es_sistema: true,
      },
    });

    const [rolMozo] = await Rol.findOrCreate({
      where: { empresa_id: empresa.id, nombre: 'Mozo' },
      defaults: {
        empresa_id: empresa.id,
        nombre: 'Mozo',
        descripcion: 'Toma de pedidos y asignación de mesas',
        permisos: { mesas: true, pedidos: true },
        es_sistema: true,
      },
    });

    // 5. Crear Usuarios del Negocio
    const passComun = await bcrypt.hash('admin123', 10);
    const passMozo = await bcrypt.hash('mozo123', 10);
    const passCaja = await bcrypt.hash('caja123', 10);

    const [usuarioAdmin] = await Usuario.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        rol_id: rolAdmin.id,
        nombre: 'Administrador General',
        email: 'admin@admin.com',
        password_hash: passComun,
        rol: 'Administrador',
        tipo_documento: 'DNI',
        numero_documento: '44889922',
        telefono: '998-111-222',
        activo: true,
      },
    });

    await Usuario.findOrCreate({
      where: { email: 'caja@admin.com' },
      defaults: {
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        rol_id: rolCajero.id,
        nombre: 'Cajero Principal',
        email: 'caja@admin.com',
        password_hash: passCaja,
        rol: 'Cajero',
        tipo_documento: 'DNI',
        numero_documento: '77665544',
        telefono: '998-333-444',
        activo: true,
      },
    });

    const [usuarioMozo] = await Usuario.findOrCreate({
      where: { email: 'mozo@admin.com' },
      defaults: {
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        rol_id: rolMozo.id,
        nombre: 'Carlos Mozo',
        email: 'mozo@admin.com',
        password_hash: passMozo,
        rol: 'Mozo',
        tipo_documento: 'DNI',
        numero_documento: '88776655',
        telefono: '998-555-666',
        activo: true,
      },
    });
    console.log('👥 Usuarios base listos (admin@admin.com, caja@admin.com, mozo@admin.com)');
    await sembrarTodasLasCredenciales();

    // 6. Sembrar Áreas y Mesas de Restaurante
    const conteoAreas = await Area.count({ where: { empresa_id: empresa.id } });
    let areaSalon, areaTerraza, areaVip;

    if (conteoAreas === 0) {
      areaSalon = await Area.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        name: 'Salón Principal',
        is_active: true,
      });

      areaTerraza = await Area.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        name: 'Terraza Vista al Parque',
        is_active: true,
      });

      areaVip = await Area.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        name: 'Zona VIP Acústica',
        is_active: true,
      });

      await Mesa.bulkCreate([
        { empresa_id: empresa.id, sucursal_id: sedePrincipal.id, area_id: areaSalon.id, name: 'Mesa 1', seats: 4, status: 'available', x_pos: 10, y_pos: 10 },
        { empresa_id: empresa.id, sucursal_id: sedePrincipal.id, area_id: areaSalon.id, name: 'Mesa 2', seats: 4, status: 'available', x_pos: 120, y_pos: 10 },
        { empresa_id: empresa.id, sucursal_id: sedePrincipal.id, area_id: areaSalon.id, name: 'Mesa 3', seats: 2, status: 'available', x_pos: 230, y_pos: 10 },
        { empresa_id: empresa.id, sucursal_id: sedePrincipal.id, area_id: areaTerraza.id, name: 'Mesa T-1', seats: 6, status: 'available', x_pos: 10, y_pos: 10 },
        { empresa_id: empresa.id, sucursal_id: sedePrincipal.id, area_id: areaTerraza.id, name: 'Mesa T-2', seats: 4, status: 'available', x_pos: 120, y_pos: 10 },
        { empresa_id: empresa.id, sucursal_id: sedePrincipal.id, area_id: areaVip.id, name: 'Mesa VIP 1', seats: 8, status: 'available', x_pos: 10, y_pos: 10 },
      ]);
      console.log('🍽️  Áreas y Mesas creadas correctamente.');
    }

    // 7. Sembrar Categorías y Productos de Restaurante
    const conteoCategorias = await Categoria.count({ where: { empresa_id: empresa.id } });
    if (conteoCategorias === 0) {
      const catEntradas = await Categoria.create({
        empresa_id: empresa.id,
        name: 'Entradas',
        destination: 'kitchen',
        is_active: true,
      });

      const catFondos = await Categoria.create({
        empresa_id: empresa.id,
        name: 'Platos Fuertes',
        destination: 'kitchen',
        is_active: true,
      });

      const catBebidas = await Categoria.create({
        empresa_id: empresa.id,
        name: 'Bebidas y Licores',
        destination: 'bar',
        is_active: true,
      });

      const catPostres = await Categoria.create({
        empresa_id: empresa.id,
        name: 'Postres Artesanales',
        destination: 'dessert',
        is_active: true,
      });

      await Producto.bulkCreate([
        {
          empresa_id: empresa.id,
          category_id: catEntradas.id,
          name: 'Ceviche Clásico de Corvina',
          description: 'Pesca fresca del día con leche de tigre, camote glaseado y choclo tierno',
          price: 38.00,
          cost: 16.00,
          stock: 999,
          destination: 'kitchen',
          is_active: true,
        },
        {
          empresa_id: empresa.id,
          category_id: catEntradas.id,
          name: 'Tequeños de Lomo Saltado (6 uds)',
          description: 'Crujientes rellenos de lomo al wok con crema de rocoto y guacamole casero',
          price: 24.00,
          cost: 9.00,
          stock: 999,
          destination: 'kitchen',
          is_active: true,
        },
        {
          empresa_id: empresa.id,
          category_id: catFondos.id,
          name: 'Lomo Saltado al Wok Gourmet',
          description: 'Lomo fino flameado al pisco, cebolla, tomate, papas amarillas fritas y arroz con choclo',
          price: 46.00,
          cost: 20.00,
          stock: 999,
          destination: 'kitchen',
          is_active: true,
        },
        {
          empresa_id: empresa.id,
          category_id: catFondos.id,
          name: 'Arroz con Mariscos al Pisco',
          description: 'Langostinos, calamares y conchas en arroz meloso al pisco acholado con sarsa criolla',
          price: 42.00,
          cost: 18.00,
          stock: 999,
          destination: 'kitchen',
          is_active: true,
        },
        {
          empresa_id: empresa.id,
          category_id: catBebidas.id,
          name: 'Chicha Morada Especial de la Casa (1L)',
          description: 'Elaborada con maíz morado culli, piña golden, manzana y especias andinas',
          price: 16.00,
          cost: 4.50,
          stock: 999,
          destination: 'bar',
          is_active: true,
        },
        {
          empresa_id: empresa.id,
          category_id: catBebidas.id,
          name: 'Pisco Sour Tradicional Quebranta',
          description: '4oz de pisco quebranta premium, zumo de limón fresco, clara y amargo de angostura',
          price: 26.00,
          cost: 7.00,
          stock: 999,
          destination: 'bar',
          is_active: true,
        },
        {
          empresa_id: empresa.id,
          category_id: catPostres.id,
          name: 'Suspiro a la Limeña Tradicional',
          description: 'Manjar blanco de yemas con merengue al oporto y canela molida',
          price: 18.00,
          cost: 5.50,
          stock: 999,
          destination: 'dessert',
          is_active: true,
        },
      ]);
      console.log('🥘 Categorías y Productos de la carta gourmet sembrados.');
    }

    // 8. Sembrar Gastos Demo Restaurante
    const conteoGastos = await Gasto.count({ where: { empresa_id: empresa.id } });
    if (conteoGastos === 0) {
      await Gasto.bulkCreate([
        {
          empresa_id: empresa.id,
          sucursal_id: sedePrincipal.id,
          user_id: usuarioAdmin.id,
          description: 'Compra de pescados y mariscos del terminal pesquero',
          amount: 280.50,
          category: 'Insumos Frescos',
          payment_method: 'Efectivo',
        },
        {
          empresa_id: empresa.id,
          sucursal_id: sedePrincipal.id,
          user_id: usuarioAdmin.id,
          description: 'Recarga de balón de gas industrial 45kg',
          amount: 145.00,
          category: 'Servicios y Gas',
          payment_method: 'Efectivo',
        },
      ]);
      console.log('💸 Gastos demo restaurante sembrados.');
    }

    // 9. Sembrar Módulo Ferretería / Comercial Retail
    const conteoCatFerreteria = await CategoriaFerreteria.count({ where: { empresa_id: empresa.id } });
    if (conteoCatFerreteria === 0) {
      console.log('🔨 Sembrando Módulo Ferretería & Comercial Retail...');

      const catHerramientas = await CategoriaFerreteria.create({
        empresa_id: empresa.id,
        nombre: 'Herramientas Eléctricas y Manuales',
        descripcion: 'Taladros, amoladoras, martillos, llaves y accesorios profesionales',
        activo: true,
      });

      const catConstruccion = await CategoriaFerreteria.create({
        empresa_id: empresa.id,
        nombre: 'Construcción y Cemento',
        descripcion: 'Cemento, fierro corrugado, alambre, yeso y agregados',
        activo: true,
      });

      const catPinturas = await CategoriaFerreteria.create({
        empresa_id: empresa.id,
        nombre: 'Pinturas y Acabados',
        descripcion: 'Látex lavable, esmaltes sintéticos, brochas, rodillos y thinner',
        activo: true,
      });

      const catTuberias = await CategoriaFerreteria.create({
        empresa_id: empresa.id,
        nombre: 'Tuberías y Grifería',
        descripcion: 'Tubos PVC agua/desagüe, pegamentos, codos, tees y válvulas',
        activo: true,
      });

      const catElectricidad = await CategoriaFerreteria.create({
        empresa_id: empresa.id,
        nombre: 'Electricidad e Iluminación',
        descripcion: 'Cables vulcanizados/mellizos, interruptores, tableros y focos LED',
        activo: true,
      });

      // Proveedor Demo
      const provUnicon = await ProveedorFerreteria.create({
        empresa_id: empresa.id,
        ruc: '20100034561',
        razon_social: 'Distribuidora Mayorista Ferretera SAC',
        contacto: 'Ing. Carlos Mendoza',
        telefono: '998-777-888',
        email: 'ventas@distribuidoraferretera.pe',
        direccion: 'Av. Argentina 2240, Callao',
        activo: true,
      });

      // Productos Ferretería
      const p1 = await ProductoFerreteria.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        id_categoria: catConstruccion.id,
        id_proveedor: provUnicon.id,
        codigo_barras: '775012300001',
        nombre: 'Cemento Sol Tipo I (Bolsa 42.5 kg)',
        descripcion: 'Cemento Portland para obras estructurales de alta resistencia inicial',
        precio_compra: 24.50,
        precio_venta: 28.50,
        precio_mayorista: 27.50,
        stock: 180.000,
        stock_minimo: 30.000,
        unidad_medida: 'Bolsa',
        ubicacion: 'Patio Posterior Almacén A',
        marca: 'Sol',
        es_material_construccion: true,
        activo: true,
      });

      const p2 = await ProductoFerreteria.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        id_categoria: catHerramientas.id,
        id_proveedor: provUnicon.id,
        codigo_barras: '316514085478',
        nombre: 'Taladro Percutor Bosch GSB 13 RE (650W)',
        descripcion: 'Mandril 1/2 pulgada, velocidad variable y reversible con maletín',
        precio_compra: 185.00,
        precio_venta: 245.00,
        precio_mayorista: 230.00,
        stock: 14.000,
        stock_minimo: 3.000,
        unidad_medida: 'Unidad',
        ubicacion: 'Vitrina Central Herramientas',
        marca: 'Bosch',
        activo: true,
      });

      const p3 = await ProductoFerreteria.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        id_categoria: catPinturas.id,
        id_proveedor: provUnicon.id,
        codigo_barras: '775198200102',
        nombre: 'Pintura Látex Pato Blanco Galón',
        descripcion: 'Acabado mate para interiores y exteriores, excelente poder cubriente',
        precio_compra: 32.00,
        precio_venta: 45.00,
        precio_mayorista: 41.00,
        stock: 35.000,
        stock_minimo: 8.000,
        unidad_medida: 'Galon',
        ubicacion: 'Estante Pinturas Nivel 2',
        marca: 'Pato',
        activo: true,
      });

      const p4 = await ProductoFerreteria.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        id_categoria: catTuberias.id,
        id_proveedor: provUnicon.id,
        codigo_barras: '775899200054',
        nombre: 'Tubo PVC SAP Agua Fría 1/2" x 3m Pavco',
        descripcion: 'Presión 10 bar clase 10 para conexiones domiciliarias',
        precio_compra: 8.20,
        precio_venta: 13.50,
        precio_mayorista: 12.00,
        stock: 120.000,
        stock_minimo: 25.000,
        unidad_medida: 'Tubo',
        ubicacion: 'Racks Metálicos Tuberías',
        marca: 'Pavco Wavin',
        activo: true,
      });

      const p5 = await ProductoFerreteria.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        id_categoria: catElectricidad.id,
        id_proveedor: provUnicon.id,
        codigo_barras: '775443300188',
        nombre: 'Cable Mellizo Indeco 2x14 AWG Blanco (Rollo 100m)',
        descripcion: 'Conductor de cobre suave para instalaciones fijas o extensiones',
        precio_compra: 110.00,
        precio_venta: 148.00,
        precio_mayorista: 138.00,
        stock: 18.000,
        stock_minimo: 5.000,
        unidad_medida: 'Rollo',
        ubicacion: 'Sección Electricidad Estante B',
        marca: 'Indeco',
        activo: true,
      });

      const p6 = await ProductoFerreteria.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        id_categoria: catHerramientas.id,
        id_proveedor: provUnicon.id,
        codigo_barras: '775332211005',
        nombre: 'Disco de Corte Metal 4.5" Norton Classic',
        descripcion: 'Para corte rápido y preciso de fierro, acero y metales ferrosos',
        precio_compra: 2.20,
        precio_venta: 4.50,
        precio_mayorista: 3.80,
        stock: 250.000,
        stock_minimo: 40.000,
        unidad_medida: 'Unidad',
        ubicacion: 'Caja Mostrador Discos',
        marca: 'Norton',
        activo: true,
      });

      // Registrar inventario inicial en Kardex
      const prodsInit = [p1, p2, p3, p4, p5, p6];
      for (const p of prodsInit) {
        await InventarioMovimientoFerreteria.create({
          empresa_id: empresa.id,
          sucursal_id: sedePrincipal.id,
          id_producto: p.id,
          id_usuario: usuarioAdmin.id,
          tipo: 'Entrada',
          cantidad: p.stock,
          stock_antes: 0,
          stock_despues: p.stock,
          motivo: 'Inventario inicial de apertura de tienda',
        });
      }

      // Clientes Ferretería
      await ClienteFerreteria.create({
        empresa_id: empresa.id,
        tipo_documento: 'RUC',
        numero_documento: '20556677889',
        nombre: 'Constructora & Acabados Los Andes SAC',
        perfil_cliente: 'Empresa Constructora',
        tipo_precio: 'Mayorista',
        telefono: '01 556-9900',
        email: 'logistica@constructoralosandes.pe',
        direccion: 'Av. República de Panamá 3560, San Isidro',
        contacto_obra: 'Ing. Mateo Morales',
        telefono_obra: '991-223-344',
        direccion_obra: 'Obra Edificio Mirador del Parque - Calle 8 N° 220, Surco',
        limite_credito: 25000.00,
        dias_credito: 30,
        activo: true,
      });

      await ClienteFerreteria.create({
        empresa_id: empresa.id,
        tipo_documento: 'DNI',
        numero_documento: '44332211',
        nombre: 'Juan Pérez Maestro de Obra',
        perfil_cliente: 'Contratista / Maestro de Obra',
        tipo_precio: 'Mayorista',
        telefono: '998-333-222',
        email: 'juanperez.obras@gmail.com',
        direccion: 'Jr. Los Álamos 450, Chorrillos',
        limite_credito: 4500.00,
        dias_credito: 15,
        activo: true,
      });

      // Caja Inicial Abierta para Admin
      await CajaFerreteria.findOrCreate({
        where: {
          empresa_id: empresa.id,
          id_usuario: usuarioAdmin.id,
          estado: 'Abierta',
        },
        defaults: {
          empresa_id: empresa.id,
          sucursal_id: sedePrincipal.id,
          id_usuario: usuarioAdmin.id,
          monto_inicial: 350.00,
          total_ventas_efectivo: 0,
          total_egresos: 0,
          total_ingresos_abonos: 0,
          estado: 'Abierta',
          observaciones: 'Apertura de turno mañana',
          fecha_apertura: new Date(),
        },
      });

      console.log('📦 Productos, Proveedores, Clientes y Caja de Ferretería sembrados.');
    }

    // ==========================================
    // 7. SEMBRADO MÓDULO BOTICA / FARMACIA
    // ==========================================
    const totalBoticaMeds = await MedicamentoBotica.count({ where: { empresa_id: empresa.id } });
    if (totalBoticaMeds === 0) {
      console.log('💊 Sembrando catálogo farmacéutico, lotes FEFO y normativas DIGEMID...');

      // Categorías Farmacéuticas
      const catAnalgesicos = await CategoriaBotica.create({
        empresa_id: empresa.id,
        nombre: 'Analgésicos y Antiinflamatorios',
        descripcion: 'Medicamentos para alivio del dolor y procesos inflamatorios',
        color: '#10B981',
        icono: 'Pill',
      });

      const catAntibioticos = await CategoriaBotica.create({
        empresa_id: empresa.id,
        nombre: 'Antibióticos y Antimicrobianos',
        descripcion: 'Tratamiento de infecciones bacterianas bajo prescripción médica',
        color: '#059669',
        icono: 'ShieldCheck',
      });

      const catGastro = await CategoriaBotica.create({
        empresa_id: empresa.id,
        nombre: 'Gastrointestinales',
        descripcion: 'Protectores gástricos, antiácidos y digestivos',
        color: '#047857',
        icono: 'Activity',
      });

      const catResp = await CategoriaBotica.create({
        empresa_id: empresa.id,
        nombre: 'Respiratorios y Antialérgicos',
        descripcion: 'Antihistamínicos, broncodilatadores y descongestionantes',
        color: '#34D399',
        icono: 'Wind',
      });

      const catVitaminas = await CategoriaBotica.create({
        empresa_id: empresa.id,
        nombre: 'Vitaminas y Suplementos',
        descripcion: 'Complejos vitamínicos, minerales y complementos nutricionales',
        color: '#6EE7B7',
        icono: 'Sparkles',
      });

      // Medicamentos con normativa DIGEMID
      const medParacetamol = await MedicamentoBotica.create({
        empresa_id: empresa.id,
        codigo_barras: '775012345001',
        nombre_comercial: 'Paracetamol 500mg Genfar',
        nombre_generico: 'Paracetamol',
        concentracion: '500 mg',
        presentacion: 'Tableta',
        laboratorio: 'Genfar',
        registro_sanitario: 'EN-01234',
        codigo_digemid: 'DIG-001',
        tipo_controlado: 'No_Controlado',
        requiere_receta: false,
        fraccionable: true,
        unidades_por_caja: 100,
        unidad_medida: 'Caja',
        unidad_fraccion: 'Pastilla',
        precio_compra: 8.00,
        precio_venta: 20.00,
        precio_fraccion: 0.30,
        stock_cajas: 45.00,
        stock_fraccion: 20,
        stock_minimo: 10,
        ubicacion: 'Anaquel A-1',
        id_categoria: catAnalgesicos.id,
        activo: true,
      });

      const medAmoxicilina = await MedicamentoBotica.create({
        empresa_id: empresa.id,
        codigo_barras: '775012345002',
        nombre_comercial: 'Amoxicilina 500mg Medifarma',
        nombre_generico: 'Amoxicilina',
        concentracion: '500 mg',
        presentacion: 'Cápsula',
        laboratorio: 'Medifarma',
        registro_sanitario: 'EN-05678',
        codigo_digemid: 'DIG-002',
        tipo_controlado: 'No_Controlado',
        requiere_receta: true,
        fraccionable: true,
        unidades_por_caja: 100,
        unidad_medida: 'Caja',
        unidad_fraccion: 'Pastilla',
        precio_compra: 15.00,
        precio_venta: 35.00,
        precio_fraccion: 0.50,
        stock_cajas: 30.00,
        stock_fraccion: 0,
        stock_minimo: 8,
        ubicacion: 'Anaquel B-3',
        id_categoria: catAntibioticos.id,
        activo: true,
      });

      const medIbuprofeno = await MedicamentoBotica.create({
        empresa_id: empresa.id,
        codigo_barras: '775012345003',
        nombre_comercial: 'Ibuprofeno 400mg Bayer',
        nombre_generico: 'Ibuprofeno',
        concentracion: '400 mg',
        presentacion: 'Tableta',
        laboratorio: 'Bayer',
        registro_sanitario: 'EN-09911',
        codigo_digemid: 'DIG-003',
        tipo_controlado: 'No_Controlado',
        requiere_receta: false,
        fraccionable: true,
        unidades_por_caja: 50,
        unidad_medida: 'Caja',
        unidad_fraccion: 'Pastilla',
        precio_compra: 12.00,
        precio_venta: 28.00,
        precio_fraccion: 0.70,
        stock_cajas: 60.00,
        stock_fraccion: 15,
        stock_minimo: 12,
        ubicacion: 'Anaquel A-2',
        id_categoria: catAnalgesicos.id,
        activo: true,
      });

      const medOmeprazol = await MedicamentoBotica.create({
        empresa_id: empresa.id,
        codigo_barras: '775012345004',
        nombre_comercial: 'Omeprazol 20mg Farmindustria',
        nombre_generico: 'Omeprazol',
        concentracion: '20 mg',
        presentacion: 'Cápsula',
        laboratorio: 'Farmindustria',
        registro_sanitario: 'EN-04321',
        codigo_digemid: 'DIG-004',
        tipo_controlado: 'No_Controlado',
        requiere_receta: false,
        fraccionable: true,
        unidades_por_caja: 30,
        unidad_medida: 'Caja',
        unidad_fraccion: 'Pastilla',
        precio_compra: 10.00,
        precio_venta: 24.00,
        precio_fraccion: 1.00,
        stock_cajas: 40.00,
        stock_fraccion: 10,
        stock_minimo: 10,
        ubicacion: 'Anaquel C-1',
        id_categoria: catGastro.id,
        activo: true,
      });

      const medCetirizina = await MedicamentoBotica.create({
        empresa_id: empresa.id,
        codigo_barras: '775012345005',
        nombre_comercial: 'Cetirizina 10mg Portugal',
        nombre_generico: 'Cetirizina',
        concentracion: '10 mg',
        presentacion: 'Tableta',
        laboratorio: 'Laboratorios Portugal',
        registro_sanitario: 'EN-07788',
        codigo_digemid: 'DIG-005',
        tipo_controlado: 'No_Controlado',
        requiere_receta: false,
        fraccionable: true,
        unidades_por_caja: 100,
        unidad_medida: 'Caja',
        unidad_fraccion: 'Pastilla',
        precio_compra: 14.00,
        precio_venta: 32.00,
        precio_fraccion: 0.40,
        stock_cajas: 25.00,
        stock_fraccion: 0,
        stock_minimo: 6,
        ubicacion: 'Anaquel D-2',
        id_categoria: catResp.id,
        activo: true,
      });

      // Lotes con control FEFO
      await LoteBotica.create({
        empresa_id: empresa.id,
        id_medicamento: medParacetamol.id,
        numero_lote: 'LT-2026-A1',
        fecha_vencimiento: '2027-11-30',
        stock_cajas: 45.00,
        stock_fraccion: 20,
        costo_compra: 8.00,
        activo: true,
      });

      await LoteBotica.create({
        empresa_id: empresa.id,
        id_medicamento: medAmoxicilina.id,
        numero_lote: 'LT-2026-B2',
        fecha_vencimiento: '2027-08-15',
        stock_cajas: 30.00,
        stock_fraccion: 0,
        costo_compra: 15.00,
        activo: true,
      });

      await LoteBotica.create({
        empresa_id: empresa.id,
        id_medicamento: medIbuprofeno.id,
        numero_lote: 'LT-2025-C3',
        fecha_vencimiento: '2026-12-10', // Próximo a vencer para alerta en FEFO
        stock_cajas: 60.00,
        stock_fraccion: 15,
        costo_compra: 12.00,
        activo: true,
      });

      // Droguería Proveedora
      await ProveedorBotica.create({
        empresa_id: empresa.id,
        ruc: '20509876543',
        razon_social: 'Droguería Farmacéutica del Perú S.A.C.',
        nombre_contacto: 'Lic. Q.F. Andrea Vargas',
        telefono: '01 619-7000',
        email: 'ventas@drogueriafarmaceutica.pe',
        direccion: 'Av. Elmer Faucett 1850, Callao',
        activo: true,
      });

      // Clientes Farmacéuticos
      await ClienteBotica.create({
        empresa_id: empresa.id,
        tipo_documento: 'DNI',
        numero_documento: '10293847',
        nombre: 'María Fernández Silva',
        direccion: 'Calle Los Jazmines 340, Miraflores',
        telefono: '987-654-321',
        email: 'mfernandez@gmail.com',
        puntos: 65,
        activo: true,
      });

      await ClienteBotica.create({
        empresa_id: empresa.id,
        tipo_documento: 'DNI',
        numero_documento: '72635418',
        nombre: 'Carlos Mendoza Ríos',
        direccion: 'Jr. Huancavelica 512, Lima Cercado',
        telefono: '991-882-773',
        email: 'cmendoza@hotmail.com',
        puntos: 120,
        activo: true,
      });

      // Caja de Botica Abierta
      await CajaBotica.findOrCreate({
        where: {
          empresa_id: empresa.id,
          id_usuario: usuarioAdmin.id,
          estado: 'Abierta',
        },
        defaults: {
          empresa_id: empresa.id,
          id_sucursal: sedePrincipal.id,
          id_usuario: usuarioAdmin.id,
          monto_inicial: 200.00,
          total_ventas: 0,
          total_ingresos: 0,
          total_egresos: 0,
          estado: 'Abierta',
          observaciones: 'Apertura de turno mañana dispensación',
          fecha_apertura: new Date(),
        },
      });

      // Registro BPA Inicial de Temperatura y Humedad DIGEMID
      await RegistroTemperaturaBotica.create({
        empresa_id: empresa.id,
        id_sucursal: sedePrincipal.id,
        id_usuario: usuarioAdmin.id,
        fecha: new Date().toISOString().split('T')[0],
        turno: 'Mañana',
        hora: '09:00',
        temp_ambiente: 22.4,
        humedad_relativa: 56.5,
        temp_refrigeracion: 4.5,
        alerta_generada: false,
        observaciones: 'Condiciones óptimas según manual de BPA DIGEMID R.M. 132-2015',
      });

      // Movimientos de Kardex Iniciales
      await KardexFarmaciaBotica.create({
        empresa_id: empresa.id,
        id_sucursal: sedePrincipal.id,
        id_medicamento: medParacetamol.id,
        tipo_movimiento: 'ENTRADA',
        cantidad_cajas: 45.00,
        saldo_cajas: 45.00,
        motivo: 'Inventario Inicial de Apertura',
        referencia_documento: 'APERTURA',
        id_usuario: usuarioAdmin.id,
      });

      console.log('💊 Medicamentos, Lotes FEFO, Droguería, Registro BPA y Caja de Botica sembrados.');
    }

    // ==========================================
    // 8. SEMBRADO MÓDULO HOSPEDAJE / HOTELERÍA
    // ==========================================
    const totalHabitaciones = await HabitacionHospedaje.count({ where: { empresa_id: empresa.id } });
    if (totalHabitaciones === 0) {
      console.log('🏨 Sembrando habitaciones, tipos, tarifas y huéspedes de Hospedaje...');

      // Tipos de habitación
      const tipoSimple = await TipoHabitacionHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Simple Estándar',
        descripcion: 'Cama individual de 1.5 plazas, baño privado, WiFi y TV Smart 43"',
        capacidad: 1,
        precio_base: 80.00,
        precio_por_hora: 25.00,
      });

      const tipoMatrimonial = await TipoHabitacionHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Matrimonial Deluxe',
        descripcion: 'Cama Queen Size de 2 plazas, aire acondicionado, minibar y balcón',
        capacidad: 2,
        precio_base: 130.00,
        precio_por_hora: 40.00,
      });

      const tipoDoble = await TipoHabitacionHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Doble Superior',
        descripcion: 'Dos camas individuales de 1.5 plazas, escritorio de trabajo y frigobar',
        capacidad: 2,
        precio_base: 150.00,
        precio_por_hora: 45.00,
      });

      const tipoSuite = await TipoHabitacionHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Suite Ejecutiva',
        descripcion: 'Cama King Size, sala de estar independiente, vista panorámica y cafetera',
        capacidad: 3,
        precio_base: 220.00,
        precio_por_hora: 60.00,
      });

      const tipoPresidencial = await TipoHabitacionHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Suite Presidencial con Jacuzzi',
        descripcion: 'Jacuzzi de hidromasaje, cama King, terraza privada y amenities premium',
        capacidad: 4,
        precio_base: 380.00,
        precio_por_hora: 100.00,
      });

      // Habitaciones
      const hab101 = await HabitacionHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        numero: '101',
        piso: '1',
        tipo_habitacion_id: tipoSimple.id,
        estado: 'disponible',
        estado_limpieza: 'limpia',
        descripcion: 'Habitación simple piso 1 cercana a recepción',
      });

      const hab102 = await HabitacionHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        numero: '102',
        piso: '1',
        tipo_habitacion_id: tipoMatrimonial.id,
        estado: 'disponible',
        estado_limpieza: 'limpia',
        descripcion: 'Matrimonial acogedora con vista al jardín interior',
      });

      const hab201 = await HabitacionHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        numero: '201',
        piso: '2',
        tipo_habitacion_id: tipoDoble.id,
        estado: 'ocupada',
        estado_limpieza: 'limpia',
        descripcion: 'Doble superior con balcón exterior',
      });

      const hab202 = await HabitacionHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        numero: '202',
        piso: '2',
        tipo_habitacion_id: tipoSuite.id,
        estado: 'disponible',
        estado_limpieza: 'limpia',
        descripcion: 'Suite piso 2 con vista a la avenida',
      });

      const hab301 = await HabitacionHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        numero: '301',
        piso: '3',
        tipo_habitacion_id: tipoPresidencial.id,
        estado: 'disponible',
        estado_limpieza: 'limpia',
        descripcion: 'Ático presidencial con jacuzzi privado',
      });

      // Huéspedes
      const huespedRoberto = await HuespedHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Roberto',
        apellido: 'Valencia Ramos',
        tipo_documento: 'DNI',
        num_documento: '09871234',
        nacionalidad: 'Peruana',
        telefono: '984-555-123',
        email: 'rvalencia@corporacion.com',
        ciudad_origen: 'Arequipa',
        ocupacion: 'Ingeniero Consultor',
        clasificacion: 'vip',
      });

      const huespedSarah = await HuespedHospedaje.create({
        empresa_id: empresa.id,
        nombre: 'Sarah',
        apellido: 'Jenkins',
        tipo_documento: 'Pasaporte',
        num_documento: 'USA-88992211',
        nacionalidad: 'Estadounidense',
        telefono: '+1 415 555 2671',
        email: 'sjenkins.travel@gmail.com',
        ciudad_origen: 'San Francisco, CA',
        ocupacion: 'Fotógrafa Documentalista',
        clasificacion: 'vip',
      });

      // Reserva activa en Check-in para Roberto en Habitación 201
      const hoyStr = new Date().toISOString().split('T')[0];
      const mananaStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

      await ReservaHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        codigo: 'RES-000001',
        huesped_id: huespedRoberto.id,
        habitacion_id: hab201.id,
        user_id: usuarioAdmin.id,
        fecha_entrada: hoyStr,
        fecha_salida: mananaStr,
        fecha_checkin: new Date(),
        num_personas: 2,
        modalidad: 'noches',
        precio_noche: 150.00,
        num_noches: 2,
        subtotal: 300.00,
        total: 300.00,
        adelanto: 150.00,
        saldo: 150.00,
        estado: 'checkin',
        origen: 'presencial',
        observaciones: 'Huésped corporativo frecuente',
        tarjeta_llave_codigo: 'RFID-201-B',
      });

      // Productos de Frigobar / Minibar
      await ProductoHotelHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        nombre: 'Agua Mineral San Mateo 600ml',
        categoria: 'Minibar',
        precio_compra: 1.80,
        precio_venta: 5.00,
        stock: 50,
      });

      await ProductoHotelHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        nombre: 'Cerveza Cusqueña Trigo 330ml',
        categoria: 'Minibar',
        precio_compra: 4.50,
        precio_venta: 12.00,
        stock: 40,
      });

      await ProductoHotelHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        nombre: 'Pringles Original 40g',
        categoria: 'Snacks',
        precio_compra: 4.00,
        precio_venta: 10.00,
        stock: 30,
      });

      await ProductoHotelHospedaje.create({
        empresa_id: empresa.id,
        sucursal_id: sedePrincipal.id,
        nombre: 'Kit Dental & Afeitado Hotel',
        categoria: 'Amenities',
        precio_compra: 2.50,
        precio_venta: 8.00,
        stock: 25,
      });

      // Caja de Recepción Hotelera Abierta
      await TurnoCajaHospedaje.findOrCreate({
        where: {
          empresa_id: empresa.id,
          user_id: usuarioAdmin.id,
          estado: 'abierto',
        },
        defaults: {
          empresa_id: empresa.id,
          sucursal_id: sedePrincipal.id,
          user_id: usuarioAdmin.id,
          monto_apertura: 300.00,
          estado: 'abierto',
          observaciones: 'Apertura turno mañana recepción hotel',
          fecha_apertura: new Date(),
        },
      });

      console.log('🏨 Habitaciones, Tipos, Huéspedes, Reserva Check-In y Minibar de Hospedaje sembrados.');
    }

    console.log('\n🎉 ¡HEIS Suite sembrado con éxito total!');
  } catch (error) {
    console.error('❌ Error en seeder:', error);
  }
}

// Si se ejecuta directamente vía CLI: node src/utils/seeder.js
if (process.argv[1]?.includes('seeder.js')) {
  runSeeder().then(() => process.exit(0)).catch(() => process.exit(1));
}
