import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Empresa, Usuario, Sucursal, Rol } from '../core/models/index.js';

dotenv.config();

export async function sembrarTodasLasCredenciales() {
  console.log('🌱 Sembrando credenciales y roles para todos los sistemas...');

  // 1. Obtener Empresa Demo (id: 1 o por ruc)
  let empresa = await Empresa.findOne({ where: { id: 1 }, skipTenant: true });
  if (!empresa) {
    empresa = await Empresa.findOne({ where: { ruc: '20601234567' }, skipTenant: true });
  }
  if (!empresa) {
    console.error('❌ No se encontró la empresa demo. Asegúrate de ejecutar el seeder inicial primero.');
    return;
  }

  // 2. Obtener Sede Principal
  let sucursal = await Sucursal.findOne({
    where: { empresa_id: empresa.id, es_principal: true },
    skipTenant: true,
  });
  if (!sucursal) {
    sucursal = await Sucursal.findOne({ where: { empresa_id: empresa.id }, skipTenant: true });
  }

  const passGeneral = await bcrypt.hash('admin123', 10);

  // 3. Definición de Roles a crear o verificar
  const rolesDef = [
    {
      nombre: 'Administrador General',
      descripcion: 'Control y supervisión ejecutiva total de la empresa',
      permisos: { all: true },
    },
    {
      nombre: 'Admin Restaurante',
      descripcion: 'Administración de salón, comandas, KDS, cartas y reservas gastronómicas',
      permisos: { restaurante: true, mesas: true, cocina: true, menu: true, ordenes: true },
    },
    {
      nombre: 'Mozo',
      descripcion: 'Toma de pedidos en salón, notas de comanda y asignación de mesas',
      permisos: { mesas: true, pedidos: true, comanda: true },
    },
    {
      nombre: 'Cocinero / Chef',
      descripcion: 'Pantalla de Cocina KDS y preparación de platos',
      permisos: { cocina: true, kds: true },
    },
    {
      nombre: 'Bartender',
      descripcion: 'Despacho de bebidas y comandas de Bar en KDS',
      permisos: { cocina: true, bar: true },
    },
    {
      nombre: 'Admin Ferretería',
      descripcion: 'Administración comercial retail, cotizaciones y almacén',
      permisos: { ferreteria: true, inventario: true, ventas: true, cotizaciones: true, compras: true },
    },
    {
      nombre: 'Cajero',
      descripcion: 'Cobros, facturación electrónica y turnos de caja',
      permisos: { ventas: true, caja: true, pos: true },
    },
    {
      nombre: 'Vendedor',
      descripcion: 'Atención comercial, cotizaciones y cartera de clientes',
      permisos: { cotizaciones: true, ventas: true, clientes: true },
    },
    {
      nombre: 'Almacenero',
      descripcion: 'Gestión física de inventario, kardex y compras',
      permisos: { inventario: true, compras: true, traslados: true },
    },
    {
      nombre: 'Admin Botica',
      descripcion: 'Dirección técnica y regencia farmacéutica',
      permisos: { botica: true, medicamentos: true, lotes: true, digemid: true, dispensacion: true },
    },
    {
      nombre: 'Farmacéutico',
      descripcion: 'Dispensación en mostrador y control de recetas',
      permisos: { dispensacion: true, medicamentos: true, lotes: true },
    },
    {
      nombre: 'Admin Hospedaje',
      descripcion: 'Gerencia y administración de hotel y alojamientos',
      permisos: { hospedaje: true, rack: true, reservas: true, huespedes: true, tarifas: true },
    },
    {
      nombre: 'Recepcionista Hotel',
      descripcion: 'Recepción, TapeChart, Check-In, Check-Out y Room Service',
      permisos: { rack: true, reservas: true, huespedes: true, checkout: true },
    },
    {
      nombre: 'Limpieza Hotel',
      descripcion: 'Housekeeping, estado de habitaciones y reporte de mantenimiento',
      permisos: { limpieza: true, habitaciones: true },
    },
  ];

  const rolesMap = {};
  for (const r of rolesDef) {
    const [rolInst] = await Rol.findOrCreate({
      where: { empresa_id: empresa.id, nombre: r.nombre },
      defaults: {
        empresa_id: empresa.id,
        nombre: r.nombre,
        descripcion: r.descripcion,
        permisos: r.permisos,
        es_sistema: true,
      },
      skipTenant: true,
    });
    rolesMap[r.nombre] = rolInst.id;
  }

  // 4. Definición de Usuarios a crear o actualizar
  const usuariosDef = [
    // SuperAdmin de Plataforma
    {
      nombre: 'SuperAdmin HEIS',
      email: 'superadmin@heissuite.com',
      rol: 'superadmin',
      empresa_id: null,
      sucursal_id: null,
      rol_id: null,
    },
    // Admin General de la Empresa
    {
      nombre: 'Administrador General',
      email: 'admin@admin.com',
      rol: 'Administrador',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Administrador General'],
    },
    {
      nombre: 'Gerencia General HEIS',
      email: 'admin@heis.pe',
      rol: 'Administrador',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Administrador General'],
    },
    // Restaurante
    {
      nombre: 'Admin Restaurante',
      email: 'admin.restaurante@heis.pe',
      rol: 'Admin Restaurante',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Admin Restaurante'],
    },
    {
      nombre: 'Carlos Mozo (Principal)',
      email: 'mozo@admin.com',
      rol: 'Mozo',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Mozo'],
    },
    {
      nombre: 'Juan Mesero (Salón 2)',
      email: 'mesero@heis.pe',
      rol: 'Mozo',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Mozo'],
    },
    {
      nombre: 'Chef Mario (Cocina KDS)',
      email: 'cocina@heis.pe',
      rol: 'Cocinero / Chef',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Cocinero / Chef'],
    },
    {
      nombre: 'Lucas Barman (Bar KDS)',
      email: 'bar@heis.pe',
      rol: 'Bartender',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Bartender'],
    },
    // Ferretería
    {
      nombre: 'Admin Ferretería',
      email: 'admin.ferreteria@heis.pe',
      rol: 'Admin Ferretería',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Admin Ferretería'],
    },
    {
      nombre: 'Cajero POS Retail',
      email: 'caja@admin.com',
      rol: 'Cajero',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Cajero'],
    },
    {
      nombre: 'Cajero Ferretería 2',
      email: 'cajero@heis.pe',
      rol: 'Cajero',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Cajero'],
    },
    {
      nombre: 'Pedro Vendedor (Cotizaciones)',
      email: 'vendedor@heis.pe',
      rol: 'Vendedor',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Vendedor'],
    },
    {
      nombre: 'Roberto Almacenero',
      email: 'almacen@heis.pe',
      rol: 'Almacenero',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Almacenero'],
    },
    // Botica
    {
      nombre: 'Dra. Elena (Regente Botica)',
      email: 'admin.botica@heis.pe',
      rol: 'Admin Botica',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Admin Botica'],
    },
    {
      nombre: 'Dispensador Farmacéutico',
      email: 'farmaceutico@heis.pe',
      rol: 'Farmacéutico',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Farmacéutico'],
    },
    {
      nombre: 'Cajero Botica',
      email: 'cajero.botica@heis.pe',
      rol: 'Cajero',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Cajero'],
    },
    // Hotel
    {
      nombre: 'Gerente Operaciones Hotel',
      email: 'admin.hotel@heis.pe',
      rol: 'Admin Hospedaje',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Admin Hospedaje'],
    },
    {
      nombre: 'Recepción Hotel (Turno Día)',
      email: 'recepcion@heis.pe',
      rol: 'Recepcionista Hotel',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Recepcionista Hotel'],
    },
    {
      nombre: 'Ana Limpieza (Housekeeping)',
      email: 'limpieza@heis.pe',
      rol: 'Limpieza Hotel',
      empresa_id: empresa.id,
      sucursal_id: sucursal?.id || null,
      rol_id: rolesMap['Limpieza Hotel'],
    },
  ];

  for (const u of usuariosDef) {
    const existing = await Usuario.findOne({ where: { email: u.email }, skipTenant: true });
    if (existing) {
      existing.password_hash = passGeneral;
      existing.nombre = u.nombre;
      existing.rol = u.rol;
      existing.empresa_id = u.empresa_id;
      existing.sucursal_id = u.sucursal_id;
      existing.rol_id = u.rol_id;
      existing.activo = true;
      await existing.save({ skipTenant: true });
      console.log(`  ↻ Usuario actualizado: ${u.email} (${u.rol})`);
    } else {
      await Usuario.create({
        nombre: u.nombre,
        email: u.email,
        password_hash: passGeneral,
        rol: u.rol,
        empresa_id: u.empresa_id,
        sucursal_id: u.sucursal_id,
        rol_id: u.rol_id,
        tipo_documento: 'DNI',
        numero_documento: '1000000' + Math.floor(Math.random() * 90),
        telefono: '999-000-111',
        activo: true,
      }, { skipTenant: true });
      console.log(`  + Usuario creado: ${u.email} (${u.rol})`);
    }
  }

  console.log('✅ Todas las credenciales por sistema fueron sembradas con éxito (Contraseña estándar: admin123).');
}

// Si se ejecuta directo por node
if (process.argv[1]?.endsWith('seed_credenciales.js')) {
  sembrarTodasLasCredenciales()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error sembrando credenciales:', err);
      process.exit(1);
    });
}
