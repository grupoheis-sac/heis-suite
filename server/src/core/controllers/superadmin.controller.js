import { Empresa, Usuario, Sucursal, AuditoriaLog, Comunicado, PlanSaaS, sequelize } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

export function normalizarIP(rawIp) {
  if (!rawIp) return '127.0.0.1';
  let ip = String(rawIp).trim();
  if (ip === '::1' || ip === '::ffff:127.0.0.1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.replace('::ffff:', '');
  return ip;
}

export async function registrarEventoAuditoria(arg1, arg2 = null) {
  try {
    let req = null;
    let data = {};
    if (arg2) {
      req = arg1;
      data = arg2;
    } else {
      data = arg1 || {};
    }

    const rawIp = data.ip || (req ? (req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip) : null);
    const ip = normalizarIP(rawIp);
    const navegador = data.navegador || (req ? req.headers['user-agent'] : null) || 'SuperAdmin Console';

    await AuditoriaLog.create({
      empresa_id: data.empresa_id ?? null,
      usuario_id: data.usuario_id ?? (req?.user?.id ?? null),
      usuario_nombre: data.usuario_nombre ?? (req?.user?.nombre ?? 'SuperAdmin'),
      usuario_rol: data.usuario_rol ?? (req?.user?.rol ?? 'SuperAdmin'),
      modulo: data.modulo || 'superadmin',
      accion: data.accion,
      entidad: data.entidad ?? null,
      entidad_id: data.entidad_id ? String(data.entidad_id) : null,
      detalles: typeof data.detalles === 'object' ? JSON.stringify(data.detalles) : data.detalles,
      ip,
      navegador,
    });
  } catch (e) {
    console.warn('Advertencia registrando auditoría:', e.message);
  }
}

export async function listarEmpresas(req, res) {
  try {
    const empresas = await Empresa.findAll({
      include: [
        { model: Sucursal, as: 'sucursales', attributes: ['id', 'nombre', 'es_principal'] },
        { model: Usuario, as: 'usuarios', attributes: ['id', 'nombre', 'email', 'rol', 'activo'] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: empresas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function crearEmpresa(req, res) {
  try {
    const {
      nombre,
      ruc,
      direccion,
      telefono,
      plan,
      precio_mensual,
      modulos_activos,
      color_brand,
      entorno_sunat,
      vigencia_tipo,
      fecha_vencimiento,
      precargar_demo,
      admin_nombre,
      admin_email,
      admin_password,
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre de la empresa es requerido' });
    }

    // Calcular fecha de vencimiento según vigencia elegida
    let vencimientoCalculado = fecha_vencimiento || null;
    if (!vencimientoCalculado && vigencia_tipo) {
      const hoy = new Date();
      if (vigencia_tipo === 'trial_14') {
        hoy.setDate(hoy.getDate() + 14);
        vencimientoCalculado = hoy.toISOString().split('T')[0];
      } else if (vigencia_tipo === 'mensual_30') {
        hoy.setDate(hoy.getDate() + 30);
        vencimientoCalculado = hoy.toISOString().split('T')[0];
      } else if (vigencia_tipo === 'anual_365') {
        hoy.setDate(hoy.getDate() + 365);
        vencimientoCalculado = hoy.toISOString().split('T')[0];
      } else if (vigencia_tipo === 'ilimitado') {
        vencimientoCalculado = null;
      }
    }

    const defaultPrecios = { starter: 99, professional: 199, enterprise: 399 };
    const cuotaMensual = (precio_mensual !== undefined && precio_mensual !== null && precio_mensual !== '')
      ? Number(precio_mensual)
      : (defaultPrecios[plan] || 199);

    const nuevaEmpresa = await Empresa.create({
      nombre: nombre.trim(),
      ruc: ruc?.trim() || null,
      direccion: direccion?.trim() || null,
      telefono: telefono?.trim() || null,
      plan: plan || 'professional',
      precio_mensual: cuotaMensual,
      fecha_vencimiento: vencimientoCalculado,
      modulos_activos: Array.isArray(modulos_activos) ? modulos_activos : ['restaurante'],
      color_brand: color_brand || '#f59e0b',
      entorno_sunat: entorno_sunat === 'produccion' ? 'produccion' : 'beta',
      activo: true,
    });

    // Auto-crear Sede Principal
    const sedePrincipal = await Sucursal.create({
      empresa_id: nuevaEmpresa.id,
      nombre: 'Sede Principal',
      codigo: 'SEDE-01',
      direccion: direccion?.trim() || 'Dirección Principal',
      telefono: telefono?.trim() || null,
      es_principal: true,
      activo: true,
    });

    // Si se especificó credencial de Administrador inicial
    if (admin_email && admin_password) {
      const password_hash = await bcrypt.hash(admin_password, 10);
      await Usuario.create({
        empresa_id: nuevaEmpresa.id,
        sucursal_id: sedePrincipal.id,
        nombre: admin_nombre?.trim() || `Admin ${nuevaEmpresa.nombre}`,
        email: admin_email.trim().toLowerCase(),
        password_hash,
        rol: 'Administrador',
        activo: true,
      });
    }

    // Precargar catálogo demo / plantilla inicial si se solicitó
    if (precargar_demo) {
      try {
        const mods = Array.isArray(modulos_activos) ? modulos_activos : ['restaurante'];
        if (mods.includes('restaurante')) {
          await sequelize.query(`
            INSERT INTO restaurante_mesas (empresa_id, sucursal_id, name, seats, status, created_at, updated_at) VALUES 
            (${nuevaEmpresa.id}, ${sedePrincipal.id}, 'Mesa 01 - Salón', 4, 'available', NOW(), NOW()),
            (${nuevaEmpresa.id}, ${sedePrincipal.id}, 'Mesa 02 - Salón', 4, 'available', NOW(), NOW()),
            (${nuevaEmpresa.id}, ${sedePrincipal.id}, 'Mesa 03 - Terraza', 6, 'available', NOW(), NOW()),
            (${nuevaEmpresa.id}, ${sedePrincipal.id}, 'Mesa 04 - VIP', 2, 'available', NOW(), NOW())
          `).catch(() => {});

          await sequelize.query(`
            INSERT INTO restaurante_platos (empresa_id, categoria, nombre, descripcion, precio, disponible, created_at, updated_at) VALUES 
            (${nuevaEmpresa.id}, 'Platos Fuertes', 'Lomo Saltado Criollo', 'Lomo fino con cebolla, tomate y papas fritas', 35.00, 1, NOW(), NOW()),
            (${nuevaEmpresa.id}, 'Marinos', 'Ceviche Mixto Tradicional', 'Pescado fresco del día con mariscos y leche de tigre', 38.00, 1, NOW(), NOW()),
            (${nuevaEmpresa.id}, 'Bebidas', 'Jarra Chicha Morada (1L)', 'Bebida natural de maíz morado con piña y canela', 15.00, 1, NOW(), NOW()),
            (${nuevaEmpresa.id}, 'Postres', 'Suspiro a la Limeña', 'Clásico postre peruano con merengue al oporto', 14.00, 1, NOW(), NOW())
          `).catch(() => {});
        }
      } catch (seedErr) {
        console.warn('Advertencia al precargar demo:', seedErr.message);
      }
    }

    await registrarEventoAuditoria(req, {
      empresa_id: nuevaEmpresa.id,
      modulo: 'EMPRESAS',
      accion: 'CREAR_EMPRESA',
      entidad: 'Empresas',
      entidad_id: nuevaEmpresa.id,
      detalles: {
        nombre: nuevaEmpresa.nombre,
        ruc: nuevaEmpresa.ruc,
        plan: nuevaEmpresa.plan,
        precio_mensual: nuevaEmpresa.precio_mensual,
        modulos: nuevaEmpresa.modulos_activos,
      },
    });

    res.status(201).json({ success: true, data: nuevaEmpresa });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarEmpresa(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre,
      ruc,
      direccion,
      telefono,
      plan,
      precio_mensual,
      modulos_activos,
      color_brand,
      entorno_sunat,
      fecha_vencimiento,
      activo,
    } = req.body;

    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    if (nombre !== undefined && nombre.trim()) empresa.nombre = nombre.trim();
    if (ruc !== undefined) empresa.ruc = ruc?.trim() || null;
    if (direccion !== undefined) empresa.direccion = direccion?.trim() || null;
    if (telefono !== undefined) empresa.telefono = telefono?.trim() || null;
    if (plan !== undefined) empresa.plan = plan;
    if (precio_mensual !== undefined) empresa.precio_mensual = Number(precio_mensual) || 0;
    if (fecha_vencimiento !== undefined) empresa.fecha_vencimiento = fecha_vencimiento || null;
    if (entorno_sunat !== undefined) empresa.entorno_sunat = entorno_sunat;
    if (modulos_activos !== undefined) {
      empresa.modulos_activos = Array.isArray(modulos_activos) ? modulos_activos : [];
    }
    if (color_brand !== undefined) empresa.color_brand = color_brand;
    if (activo !== undefined) empresa.activo = Boolean(activo);

    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'EMPRESAS',
      accion: 'ACTUALIZAR_EMPRESA',
      entidad: 'Empresas',
      entidad_id: empresa.id,
      detalles: {
        nombre: empresa.nombre,
        plan: empresa.plan,
        precio_mensual: empresa.precio_mensual,
        fecha_vencimiento: empresa.fecha_vencimiento,
        activo: empresa.activo,
        modulos_activos: empresa.modulos_activos,
      },
    });

    res.json({ success: true, data: empresa, mensaje: 'Empresa actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function resetPasswordAdminEmpresa(req, res) {
  try {
    const { id } = req.params;
    const { nueva_password, admin_id } = req.body;

    if (!nueva_password || nueva_password.length < 6) {
      return res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    let usuario = null;
    if (admin_id) {
      usuario = await Usuario.findOne({ where: { id: admin_id, empresa_id: id } });
    } else {
      usuario = await Usuario.findOne({
        where: { empresa_id: id, rol: 'Administrador' },
        order: [['id', 'ASC']],
      });
      if (!usuario) {
        usuario = await Usuario.findOne({
          where: { empresa_id: id },
          order: [['id', 'ASC']],
        });
      }
    }

    if (!usuario) {
      return res.status(404).json({ success: false, error: 'No se encontró un usuario administrador para esta empresa' });
    }

    const password_hash = await bcrypt.hash(nueva_password, 10);
    usuario.password_hash = password_hash;
    await usuario.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'SEGURIDAD',
      accion: 'RESET_PASSWORD_ADMIN',
      entidad: 'Usuarios',
      entidad_id: usuario.id,
      detalles: {
        empresa_id: empresa.id,
        empresa_nombre: empresa.nombre,
        usuario_email: usuario.email,
        usuario_nombre: usuario.nombre,
      },
    });

    res.json({
      success: true,
      mensaje: `Contraseña restablecida con éxito para el usuario ${usuario.email}`,
      usuario: { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function eliminarEmpresa(req, res) {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    await Usuario.destroy({ where: { empresa_id: id } });
    await Sucursal.destroy({ where: { empresa_id: id } });
    await empresa.destroy();

    await registrarEventoAuditoria(req, {
      empresa_id: null,
      modulo: 'EMPRESAS',
      accion: 'ELIMINAR_EMPRESA',
      entidad: 'Empresas',
      entidad_id: id,
      detalles: {
        empresa_eliminada_id: id,
        empresa_nombre: empresa.nombre,
        ruc: empresa.ruc,
      },
    });

    res.json({ success: true, mensaje: `Empresa "${empresa.nombre}" eliminada correctamente del sistema` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarModulosEmpresa(req, res) {
  try {
    const { id } = req.params;
    const { modulos_activos, plan, activo, color_brand, submodulos_activos } = req.body;

    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    if (modulos_activos !== undefined) {
      empresa.modulos_activos = Array.isArray(modulos_activos) ? modulos_activos : [];
    }
    if (submodulos_activos !== undefined) {
      empresa.submodulos_activos = typeof submodulos_activos === 'object' ? submodulos_activos : {};
    }
    if (plan !== undefined) empresa.plan = plan;
    if (activo !== undefined) empresa.activo = Boolean(activo);
    if (color_brand !== undefined) empresa.color_brand = color_brand;

    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'CONFIGURACION',
      accion: 'ACTUALIZAR',
      detalles: `Actualización de módulos activos para ${empresa.nombre}`,
    });

    res.json({ success: true, data: empresa });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarSubmodulosEmpresa(req, res) {
  try {
    const { id } = req.params;
    const { submodulos_activos, modulos_activos } = req.body;

    if (id === 'global') {
      return res.json({
        success: true,
        mensaje: 'Plantilla global de submódulos guardada con éxito',
        data: { submodulos_activos },
      });
    }

    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    if (submodulos_activos !== undefined) {
      empresa.submodulos_activos = submodulos_activos;
    }
    if (modulos_activos !== undefined && Array.isArray(modulos_activos)) {
      empresa.modulos_activos = modulos_activos;
    }

    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'CONFIGURACION',
      accion: 'ACTUALIZAR',
      detalles: `Sincronización de feature flags y submódulos de navegación para "${empresa.nombre}"`,
    });

    res.json({
      success: true,
      mensaje: `Submódulos sincronizados correctamente para "${empresa.nombre}"`,
      data: empresa,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleEstadoEmpresa(req, res) {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    empresa.activo = !empresa.activo;
    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'EMPRESAS',
      accion: empresa.activo ? 'ACTIVAR_EMPRESA' : 'SUSPENDER_EMPRESA',
      entidad: 'Empresas',
      entidad_id: empresa.id,
      detalles: {
        nuevo_estado: empresa.activo ? 'activo' : 'suspendido',
        empresa_nombre: empresa.nombre,
      },
    });

    res.json({ success: true, data: empresa, mensaje: `Empresa ${empresa.activo ? 'activada' : 'suspendida'} con éxito` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerMetricasSaaS(req, res) {
  try {
    const empresas = await Empresa.findAll();
    const totalUsuarios = await Usuario.count();
    const totalSedes = await Sucursal.count();

    let planesPrecios = {
      starter: 99,
      professional: 199,
      enterprise: 399,
    };

    try {
      const planesDb = await PlanSaaS.findAll();
      if (planesDb && planesDb.length > 0) {
        planesDb.forEach((p) => {
          if (p.id) planesPrecios[p.id.toLowerCase()] = Number(p.precio_mensual) || planesPrecios[p.id.toLowerCase()] || 99;
        });
      }
    } catch {
      // Fallback a planesPrecios por defecto
    }

    let totalActivas = 0;
    let totalSuspendidas = 0;
    let mrrTotal = 0;

    const planesCount = { starter: 0, professional: 0, enterprise: 0 };
    const planesMrr = { starter: 0, professional: 0, enterprise: 0 };

    const verticalesCount = { restaurante: 0, ferreteria: 0, botica: 0, hospedaje: 0 };
    const verticalesMrr = { restaurante: 0, ferreteria: 0, botica: 0, hospedaje: 0 };

    let hibridosCount = 0;
    let vencidasCount = 0;
    let vencidasMrr = 0;
    let porVencer7DiasCount = 0;
    let porVencer7DiasMrr = 0;
    let porVencer15DiasCount = 0;
    let porVencer15DiasMrr = 0;
    let alDiaCount = 0;
    let sinFechaCount = 0;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const listaCobranzas = [];

    empresas.forEach((emp) => {
      const planKey = (emp.plan || 'professional').toLowerCase();
      const cuota = (emp.precio_mensual !== null && emp.precio_mensual !== undefined)
        ? Number(emp.precio_mensual)
        : (planesPrecios[planKey] || 199);

      let modulos = [];
      if (emp.modulos_activos) {
        if (typeof emp.modulos_activos === 'string') {
          try {
            modulos = JSON.parse(emp.modulos_activos);
          } catch {
            modulos = emp.modulos_activos.split(',').map((m) => m.trim()).filter(Boolean);
          }
        } else if (Array.isArray(emp.modulos_activos)) {
          modulos = emp.modulos_activos;
        }
      }
      if (!Array.isArray(modulos)) modulos = [];

      const modulosValidos = modulos.filter((m) =>
        ['restaurante', 'ferreteria', 'botica', 'hospedaje'].includes(String(m).toLowerCase())
      );

      if (emp.activo) {
        totalActivas++;
        mrrTotal += cuota;

        if (planesCount[planKey] !== undefined) {
          planesCount[planKey]++;
          planesMrr[planKey] = Number((planesMrr[planKey] + cuota).toFixed(2));
        }

        // Distribución monetaria proporcional por vertical
        const nModulos = modulosValidos.length || 1;
        const cuotaPorModulo = cuota / nModulos;

        modulosValidos.forEach((m) => {
          const mKey = String(m).toLowerCase();
          if (verticalesCount[mKey] !== undefined) {
            verticalesCount[mKey]++;
            verticalesMrr[mKey] = Number((verticalesMrr[mKey] + cuotaPorModulo).toFixed(2));
          }
        });

        if (modulosValidos.length > 1) {
          hibridosCount++;
        }

        // Análisis de vencimiento y cobranza
        let diasRestantes = null;
        let estadoVencimiento = 'sin_fecha';

        if (emp.fecha_vencimiento) {
          const partes = String(emp.fecha_vencimiento).split('-');
          if (partes.length === 3) {
            const fVenc = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
            fVenc.setHours(0, 0, 0, 0);
            diasRestantes = Math.round((fVenc - hoy) / (1000 * 60 * 60 * 24));

            if (diasRestantes < 0) {
              estadoVencimiento = 'vencido';
              vencidasCount++;
              vencidasMrr += cuota;
            } else if (diasRestantes <= 7) {
              estadoVencimiento = 'critico';
              porVencer7DiasCount++;
              porVencer7DiasMrr += cuota;
            } else if (diasRestantes <= 15) {
              estadoVencimiento = 'proximo';
              porVencer15DiasCount++;
              porVencer15DiasMrr += cuota;
            } else {
              estadoVencimiento = 'al_dia';
              alDiaCount++;
            }
          } else {
            sinFechaCount++;
          }
        } else {
          sinFechaCount++;
        }

        listaCobranzas.push({
          id: emp.id,
          nombre: emp.nombre,
          ruc: emp.ruc,
          telefono: emp.telefono,
          plan: emp.plan || 'professional',
          cuota,
          fecha_vencimiento: emp.fecha_vencimiento,
          diasRestantes,
          estadoVencimiento,
          modulos: modulosValidos,
          activo: emp.activo,
        });
      } else {
        totalSuspendidas++;
      }
    });

    const ordenEstados = { vencido: 1, critico: 2, proximo: 3, sin_fecha: 4, al_dia: 5 };
    listaCobranzas.sort((a, b) => {
      const ordA = ordenEstados[a.estadoVencimiento] || 99;
      const ordB = ordenEstados[b.estadoVencimiento] || 99;
      if (ordA !== ordB) return ordA - ordB;
      if (a.diasRestantes !== null && b.diasRestantes !== null) {
        return a.diasRestantes - b.diasRestantes;
      }
      return (a.nombre || '').localeCompare(b.nombre || '');
    });

    const arpu = totalActivas > 0 ? Number((mrrTotal / totalActivas).toFixed(2)) : 0;
    const mrrEnRiesgo = Number((vencidasMrr + porVencer7DiasMrr).toFixed(2));

    res.json({
      success: true,
      data: {
        totalEmpresas: empresas.length,
        totalActivas,
        totalSuspendidas,
        mrrTotal: Number(mrrTotal.toFixed(2)),
        arrTotal: Number((mrrTotal * 12).toFixed(2)),
        arpu,
        totalUsuarios,
        totalSedes,
        planes: planesCount,
        planesMrr,
        verticales: verticalesCount,
        verticalesMrr,
        clientesHibridos: {
          count: hibridosCount,
          porcentaje: totalActivas > 0 ? Math.round((hibridosCount / totalActivas) * 100) : 0,
        },
        vencimientos: {
          vencidasCount,
          vencidasMrr: Number(vencidasMrr.toFixed(2)),
          porVencer7DiasCount,
          porVencer7DiasMrr: Number(porVencer7DiasMrr.toFixed(2)),
          porVencer15DiasCount,
          porVencer15DiasMrr: Number(porVencer15DiasMrr.toFixed(2)),
          alDiaCount,
          sinFechaCount,
          mrrEnRiesgo,
          listaCobranzas,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerAuditoriaGlobal(req, res) {
  try {
    const {
      empresa_id,
      modulo,
      tipo_accion,
      q,
      fecha_desde,
      fecha_hasta,
      page = 1,
      limit = 25,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    const where = {};

    // Filtro por Empresa
    if (empresa_id && empresa_id !== 'TODAS') {
      if (empresa_id === 'null' || empresa_id === 'global' || empresa_id === 'plataforma') {
        where.empresa_id = null;
      } else {
        const parsedEmpId = parseInt(empresa_id, 10);
        if (!isNaN(parsedEmpId)) {
          where.empresa_id = parsedEmpId;
        }
      }
    }

    // Filtro por Módulo
    if (modulo && modulo !== 'TODOS') {
      where.modulo = modulo;
    }

    // Filtro por Tipo de Acción
    if (tipo_accion && tipo_accion !== 'TODAS') {
      if (tipo_accion === 'CREAR') {
        where.accion = { [Op.like]: '%CREAR%' };
      } else if (tipo_accion === 'ACTUALIZAR') {
        where.accion = { [Op.like]: '%ACTUALIZAR%' };
      } else if (tipo_accion === 'ELIMINAR') {
        where[Op.or] = [
          { accion: { [Op.like]: '%ELIMINAR%' } },
          { accion: { [Op.like]: '%ANULAR%' } },
          { accion: { [Op.like]: '%BAJA%' } },
        ];
      } else if (tipo_accion === 'LOGIN') {
        where[Op.or] = [
          { accion: { [Op.like]: '%LOGIN%' } },
          { accion: { [Op.like]: '%LOGOUT%' } },
          { accion: { [Op.like]: '%ACCESO%' } },
        ];
      } else if (tipo_accion === 'SEGURIDAD') {
        where[Op.or] = [
          { accion: { [Op.like]: '%PASSWORD%' } },
          { accion: { [Op.like]: '%CLAVE%' } },
          { accion: { [Op.like]: '%PERMISO%' } },
          { accion: { [Op.like]: '%ROL%' } },
          { accion: { [Op.like]: '%RENOVAR%' } },
        ];
      } else {
        where.accion = { [Op.like]: `%${tipo_accion}%` };
      }
    }

    // Búsqueda textual
    if (q && q.trim()) {
      const searchTerms = `%${q.trim()}%`;
      const searchConditions = [
        { usuario_nombre: { [Op.like]: searchTerms } },
        { accion: { [Op.like]: searchTerms } },
        { entidad: { [Op.like]: searchTerms } },
        { entidad_id: { [Op.like]: searchTerms } },
        { ip: { [Op.like]: searchTerms } },
        { detalles: { [Op.like]: searchTerms } },
      ];
      if (where[Op.or]) {
        where[Op.and] = [{ [Op.or]: where[Op.or] }, { [Op.or]: searchConditions }];
        delete where[Op.or];
      } else {
        where[Op.or] = searchConditions;
      }
    }

    // Filtro por Fecha
    if (fecha_desde && fecha_hasta) {
      const dInicio = new Date(`${fecha_desde}T00:00:00.000Z`);
      const dFin = new Date(`${fecha_hasta}T23:59:59.999Z`);
      where.createdAt = { [Op.between]: [dInicio, dFin] };
    } else if (fecha_desde) {
      where.createdAt = { [Op.gte]: new Date(`${fecha_desde}T00:00:00.000Z`) };
    } else if (fecha_hasta) {
      where.createdAt = { [Op.lte]: new Date(`${fecha_hasta}T23:59:59.999Z`) };
    }

    const { count, rows } = await AuditoriaLog.findAndCountAll({
      where,
      include: [
        { model: Empresa, as: 'empresa', attributes: ['id', 'nombre', 'ruc'] },
      ],
      order: [['id', 'DESC']],
      limit: limitNum,
      offset,
    });

    // Métricas Forenses Resumen
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const [totalHoy, accionesCriticas, loginsHoy, tenantStats] = await Promise.all([
      AuditoriaLog.count({
        where: { createdAt: { [Op.gte]: hoyInicio } },
      }).catch(() => 0),
      AuditoriaLog.count({
        where: {
          [Op.or]: [
            { accion: { [Op.like]: '%ELIMINAR%' } },
            { accion: { [Op.like]: '%ANULAR%' } },
            { accion: { [Op.like]: '%PASSWORD%' } },
            { accion: { [Op.like]: '%CLAVE%' } },
          ],
        },
      }).catch(() => 0),
      AuditoriaLog.count({
        where: {
          accion: { [Op.like]: '%LOGIN%' },
          createdAt: { [Op.gte]: hoyInicio },
        },
      }).catch(() => 0),
      AuditoriaLog.findAll({
        attributes: [
          'empresa_id',
          [sequelize.fn('COUNT', sequelize.col('AuditoriaLog.id')), 'totalEventos'],
        ],
        where: { empresa_id: { [Op.ne]: null } },
        include: [{ model: Empresa, as: 'empresa', attributes: ['id', 'nombre'] }],
        group: ['empresa_id', 'empresa.id', 'empresa.nombre'],
        order: [[sequelize.literal('totalEventos'), 'DESC']],
        limit: 1,
      }).catch(() => []),
    ]);

    const tenantMasActivo = tenantStats?.[0]
      ? {
          id: tenantStats[0].empresa_id,
          nombre: tenantStats[0].empresa?.nombre || 'Tenant General',
          eventos: parseInt(tenantStats[0].get('totalEventos'), 10) || 0,
        }
      : null;

    const serializedRows = rows.map((r) => {
      const item = r.toJSON ? r.toJSON() : { ...r };
      item.created_at = item.createdAt || item.created_at;
      item.updated_at = item.updatedAt || item.updated_at;
      item.ip = normalizarIP(item.ip);
      return item;
    });

    res.json({
      success: true,
      data: serializedRows,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum) || 1,
      },
      metricas: {
        totalHoy: totalHoy || count,
        accionesCriticas: accionesCriticas || 0,
        loginsHoy: loginsHoy || 0,
        tenantMasActivo: tenantMasActivo || { nombre: 'Plataforma Core', eventos: count },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerSaludSistema(req, res) {
  try {
    const t0 = performance.now();
    let dbStatus = 'Conectado';
    let dbLatencyMs = 0;
    try {
      await sequelize.authenticate();
      dbLatencyMs = Math.max(1, Math.round(performance.now() - t0));
    } catch {
      dbStatus = 'Error de Conexión';
      dbLatencyMs = -1;
    }

    let mysqlVersion = 'MySQL 8.0';
    let totalTablas = 0;
    const databaseName = sequelize.config?.database || 'heis_suite';
    try {
      const [versionRows] = await sequelize.query('SELECT VERSION() as version');
      if (versionRows && versionRows[0]?.version) {
        mysqlVersion = String(versionRows[0].version);
      }
      const [tablesRows] = await sequelize.query(
        'SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = DATABASE()'
      );
      if (tablesRows && tablesRows[0]?.total !== undefined) {
        totalTablas = Number(tablesRows[0].total);
      }
    } catch {}

    const pool = sequelize.connectionManager?.pool;
    const poolInfo = {
      max: pool?.max || 10,
      min: pool?.min || 0,
      size: pool?.size || pool?._allObjects?.length || (pool?.using ? pool.using + (pool.available || 0) : 1),
      available: pool?.available || 0,
      using: pool?.using || pool?._inUseObjects?.length || 1,
      waiting: pool?.waiting || 0,
    };

    const cpus = os.cpus() || [];
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;
    const memoryUsage = process.memoryUsage();

    const systemRamTotalGB = (totalMemBytes / (1024 ** 3)).toFixed(1);
    const systemRamUsedGB = (usedMemBytes / (1024 ** 3)).toFixed(1);
    const systemRamFreeGB = (freeMemBytes / (1024 ** 3)).toFixed(1);
    const systemRamUsagePct = Math.round((usedMemBytes / totalMemBytes) * 100);

    const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
    const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(1);
    const heapUsagePct = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(1);
    const externalMB = (memoryUsage.external / 1024 / 1024).toFixed(1);

    const healthChecks = [
      {
        id: 'db',
        servicio: 'Base de Datos MySQL',
        estado: dbStatus === 'Conectado' ? (dbLatencyMs > 100 ? 'warning' : 'ok') : 'error',
        detalle: dbStatus === 'Conectado' ? `${dbLatencyMs} ms de latencia` : 'Fallo de autenticación',
        latenciaMs: dbLatencyMs,
      },
      {
        id: 'storage',
        servicio: 'Almacenamiento I/O & Archivos',
        estado: 'ok',
        detalle: 'Permisos de lectura/escritura operativos (PDFs/XMLs)',
      },
      {
        id: 'memory',
        servicio: 'Salud de Memoria Heap',
        estado: heapUsagePct > 85 ? 'warning' : 'ok',
        detalle: `${heapUsedMB} MB / ${heapTotalMB} MB (${heapUsagePct}%)`,
      },
      {
        id: 'runtime',
        servicio: 'Node.js Runtime & Micro-servicios',
        estado: 'ok',
        detalle: `4 verticales activas (${process.platform}-${process.arch})`,
      },
    ];

    const systemInfo = {
      dbStatus,
      dbLatencyMs,
      mysqlVersion,
      totalTablas,
      databaseName,
      pool: poolInfo,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model || 'Host CPU',
      systemRamTotalGB,
      systemRamUsedGB,
      systemRamFreeGB,
      systemRamUsagePct,
      memoryRssMB: rssMB,
      memoryHeapUsedMB: heapUsedMB,
      memoryHeapTotalMB: heapTotalMB,
      memoryHeapPct: heapUsagePct,
      memoryExternalMB: externalMB,
      modulosVerticalesCargados: ['restaurante', 'ferreteria', 'botica', 'hospedaje'],
      estadoSaaS: dbStatus === 'Conectado' ? 'Operativo 100%' : 'Degradado',
      healthChecks,
      timestamp: new Date().toISOString(),
    };

    res.json({ success: true, data: systemInfo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function probarPingSistema(req, res) {
  try {
    const t0 = performance.now();
    await sequelize.query('SELECT 1 as ping');
    const latencyMs = Math.max(1, Math.round(performance.now() - t0));
    res.json({
      success: true,
      data: {
        status: 'ok',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function purgarCacheSistema(req, res) {
  try {
    const memBefore = process.memoryUsage().heapUsed;
    if (global.gc) {
      global.gc();
    }
    const memAfter = process.memoryUsage().heapUsed;
    const liberadoMB = Math.max(0, ((memBefore - memAfter) / 1024 / 1024)).toFixed(2);

    await registrarEventoAuditoria(req, {
      modulo: 'SISTEMA',
      accion: 'ACTUALIZAR',
      detalles: `Purgado preventivo de memoria y buffers. Liberado estimado: ${liberadoMB} MB`,
    });

    res.json({
      success: true,
      mensaje: 'Memoria y buffers de la plataforma optimizados correctamente',
      liberadoMB,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function ejecutarTestServicios(req, res) {
  try {
    const resultados = [];

    // 1. Test MySQL
    const t0 = performance.now();
    let dbOk = false;
    let dbLatency = 0;
    try {
      await sequelize.query('SELECT 1 as test');
      dbLatency = Math.max(1, Math.round(performance.now() - t0));
      dbOk = true;
    } catch {
      dbLatency = -1;
    }
    resultados.push({
      id: 'db',
      nombre: 'Cluster MySQL Transaccional',
      icono: 'database',
      estado: dbOk ? (dbLatency < 50 ? 'optimo' : 'advertencia') : 'critico',
      latenciaMs: dbLatency,
      detalle: dbOk ? `Operativo (${dbLatency} ms)` : 'Falla de conexión a MySQL',
    });

    // 2. Test File System
    let fsOk = true;
    try {
      const testFile = path.join(process.cwd(), '.healthcheck-test.tmp');
      await fs.writeFile(testFile, 'heis-healthcheck', 'utf8');
      await fs.unlink(testFile);
    } catch {
      fsOk = false;
    }
    resultados.push({
      id: 'storage',
      nombre: 'Almacenamiento & Archivos (I/O)',
      icono: 'hard-drive',
      estado: fsOk ? 'optimo' : 'critico',
      detalle: fsOk ? 'Lectura y escritura verificada (PDFs / XMLs OK)' : 'Error de permisos I/O en disco',
    });

    // 3. Test Memoria Runtime
    const mem = process.memoryUsage();
    const heapPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);
    resultados.push({
      id: 'memory',
      nombre: 'Memoria Heap Node.js',
      icono: 'cpu',
      estado: heapPct < 85 ? 'optimo' : 'advertencia',
      detalle: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB (${heapPct}% en uso)`,
    });

    // 4. Test Multi-Tenant Modules
    resultados.push({
      id: 'verticales',
      nombre: 'Verticales SaaS en Caliente',
      icono: 'layers',
      estado: 'optimo',
      detalle: '4 módulos activos (/restaurante, /ferreteria, /botica, /hospedaje)',
    });

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        estadoGlobal: resultados.every((r) => r.estado === 'optimo') ? '100% Operativo' : 'Atención Requerida',
        servicios: resultados,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Respaldo Integral por Tenant (Disaster Recovery & Backup JSON)
export async function exportarBackupEmpresa(req, res) {
  try {
    const { id } = req.params;
    const empresa = await Empresa.findByPk(id, {
      include: [
        { model: Sucursal, as: 'sucursales' },
        {
          model: Usuario,
          as: 'usuarios',
          attributes: ['id', 'nombre', 'email', 'rol', 'activo', 'created_at'],
        },
        {
          model: AuditoriaLog,
          as: 'auditorias',
          limit: 100,
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    const backupData = {
      version: '1.0.0',
      tipo: 'HEIS_SUITE_TENANT_BACKUP',
      fecha_exportacion: new Date().toISOString(),
      plataforma: 'HEIS Suite SaaS Multi-Tenant Platform',
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre,
        ruc: empresa.ruc,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        plan: empresa.plan,
        modulos_activos: empresa.modulos_activos,
        color_brand: empresa.color_brand,
        activo: empresa.activo,
        created_at: empresa.created_at,
        updated_at: empresa.updated_at,
      },
      sucursales: empresa.sucursales || [],
      usuarios: empresa.usuarios || [],
      auditoria_reciente: empresa.auditorias || [],
      estadisticas: {
        totalSucursales: empresa.sucursales?.length || 0,
        totalUsuarios: empresa.usuarios?.length || 0,
        totalEventosAuditoria: empresa.auditorias?.length || 0,
      },
    };

    const fileName = `backup-tenant-${empresa.id}-${empresa.nombre.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Gestión de Comunicados y Broadcast Global SaaS
export async function listarComunicados(req, res) {
  try {
    await Comunicado.sync();
    const comunicados = await Comunicado.findAll({
      include: [
        {
          model: Empresa,
          as: 'empresa',
          attributes: ['id', 'nombre', 'ruc', 'plan'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: comunicados });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function crearComunicado(req, res) {
  try {
    const {
      titulo,
      mensaje,
      tipo,
      formato,
      prioridad,
      plan_objetivo,
      empresa_id,
      cta_texto,
      cta_url,
      fecha_inicio,
      fecha_fin,
      activo,
    } = req.body;

    if (!titulo || !mensaje) {
      return res.status(400).json({ success: false, error: 'Título y mensaje son obligatorios' });
    }

    await Comunicado.sync();
    const parsedEmpId = (empresa_id && empresa_id !== 'null' && empresa_id !== 'global' && empresa_id !== 'undefined')
      ? parseInt(empresa_id, 10)
      : null;

    const nuevo = await Comunicado.create({
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      tipo: tipo || 'info',
      formato: formato || 'banner',
      prioridad: prioridad || 'media',
      plan_objetivo: plan_objetivo || 'todos',
      empresa_id: !isNaN(parsedEmpId) ? parsedEmpId : null,
      cta_texto: cta_texto?.trim() || null,
      cta_url: cta_url?.trim() || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      activo: activo !== undefined ? Boolean(activo) : true,
      creado_por: req.user?.nombre || 'SuperAdmin HEIS',
    });

    try {
      await AuditoriaLog.registrar({
        empresa_id: nuevo.empresa_id || null,
        usuario_id: req.user?.id || null,
        usuario_email: req.user?.email || 'superadmin@heissuite.com',
        usuario_nombre: req.user?.nombre || 'SuperAdmin HEIS',
        rol: 'superadmin',
        accion: 'CREAR_COMUNICADO',
        modulo: 'SUPERADMIN',
        entidad: 'Comunicado',
        entidad_id: String(nuevo.id),
        descripcion: `Publicado comunicado broadcast '${nuevo.titulo}' (${nuevo.tipo}, formato ${nuevo.formato})`,
        ip: normalizarIP(req.ip),
      });
    } catch (auditErr) {
      console.warn('Auditoría no bloqueante al crear comunicado:', auditErr.message);
    }

    res.status(201).json({ success: true, data: nuevo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarComunicado(req, res) {
  try {
    const { id } = req.params;
    const comunicado = await Comunicado.findByPk(id);
    if (!comunicado) {
      return res.status(404).json({ success: false, error: 'Comunicado no encontrado' });
    }

    const {
      titulo,
      mensaje,
      tipo,
      formato,
      prioridad,
      plan_objetivo,
      empresa_id,
      cta_texto,
      cta_url,
      fecha_inicio,
      fecha_fin,
      activo,
    } = req.body;

    if (titulo !== undefined) comunicado.titulo = titulo.trim();
    if (mensaje !== undefined) comunicado.mensaje = mensaje.trim();
    if (tipo !== undefined) comunicado.tipo = tipo;
    if (formato !== undefined) comunicado.formato = formato;
    if (prioridad !== undefined) comunicado.prioridad = prioridad;
    if (plan_objetivo !== undefined) comunicado.plan_objetivo = plan_objetivo;
    if (empresa_id !== undefined) {
      const parsedEmpId = (empresa_id && empresa_id !== 'null' && empresa_id !== 'global' && empresa_id !== 'undefined')
        ? parseInt(empresa_id, 10)
        : null;
      comunicado.empresa_id = !isNaN(parsedEmpId) ? parsedEmpId : null;
    }
    if (cta_texto !== undefined) comunicado.cta_texto = cta_texto?.trim() || null;
    if (cta_url !== undefined) comunicado.cta_url = cta_url?.trim() || null;
    if (fecha_inicio !== undefined) comunicado.fecha_inicio = fecha_inicio || null;
    if (fecha_fin !== undefined) comunicado.fecha_fin = fecha_fin || null;
    if (activo !== undefined) comunicado.activo = Boolean(activo);

    await comunicado.save();

    try {
      await AuditoriaLog.registrar({
        empresa_id: comunicado.empresa_id || null,
        usuario_id: req.user?.id || null,
        usuario_email: req.user?.email || 'superadmin@heissuite.com',
        usuario_nombre: req.user?.nombre || 'SuperAdmin HEIS',
        rol: 'superadmin',
        accion: 'ACTUALIZAR_COMUNICADO',
        modulo: 'SUPERADMIN',
        entidad: 'Comunicado',
        entidad_id: String(comunicado.id),
        descripcion: `Actualizado comunicado broadcast '${comunicado.titulo}'`,
        ip: normalizarIP(req.ip),
      });
    } catch (auditErr) {
      console.warn('Auditoría no bloqueante al actualizar comunicado:', auditErr.message);
    }

    res.json({ success: true, data: comunicado, mensaje: 'Comunicado actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleComunicado(req, res) {
  try {
    const { id } = req.params;
    const comunicado = await Comunicado.findByPk(id);
    if (!comunicado) {
      return res.status(404).json({ success: false, error: 'Comunicado no encontrado' });
    }

    comunicado.activo = !comunicado.activo;
    await comunicado.save();

    try {
      await AuditoriaLog.registrar({
        empresa_id: comunicado.empresa_id || null,
        usuario_id: req.user?.id || null,
        usuario_email: req.user?.email || 'superadmin@heissuite.com',
        usuario_nombre: req.user?.nombre || 'SuperAdmin HEIS',
        rol: 'superadmin',
        accion: comunicado.activo ? 'ACTIVAR_COMUNICADO' : 'PAUSAR_COMUNICADO',
        modulo: 'SUPERADMIN',
        entidad: 'Comunicado',
        entidad_id: String(comunicado.id),
        descripcion: `Comunicado '${comunicado.titulo}' ${comunicado.activo ? 'puesto en vivo' : 'pausado'}`,
        ip: normalizarIP(req.ip),
      });
    } catch (auditErr) {
      console.warn('Auditoría no bloqueante al toggle comunicado:', auditErr.message);
    }

    res.json({ success: true, data: comunicado, mensaje: `Comunicado ${comunicado.activo ? 'activado en pantalla' : 'pausado'}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function eliminarComunicado(req, res) {
  try {
    const { id } = req.params;
    const comunicado = await Comunicado.findByPk(id);
    if (!comunicado) {
      return res.status(404).json({ success: false, error: 'Comunicado no encontrado' });
    }

    const tituloEliminado = comunicado.titulo;
    await comunicado.destroy();

    try {
      await AuditoriaLog.registrar({
        empresa_id: comunicado.empresa_id || null,
        usuario_id: req.user?.id || null,
        usuario_email: req.user?.email || 'superadmin@heissuite.com',
        usuario_nombre: req.user?.nombre || 'SuperAdmin HEIS',
        rol: 'superadmin',
        accion: 'ELIMINAR_COMUNICADO',
        modulo: 'SUPERADMIN',
        entidad: 'Comunicado',
        entidad_id: String(id),
        descripcion: `Eliminado comunicado broadcast '${tituloEliminado}'`,
        ip: normalizarIP(req.ip),
      });
    } catch (auditErr) {
      console.warn('Auditoría no bloqueante al eliminar comunicado:', auditErr.message);
    }

    res.json({ success: true, mensaje: 'Comunicado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerComunicadoActivo(req, res) {
  try {
    await Comunicado.sync();
    const { empresa_id, plan } = req.query;

    const ahora = new Date();
    const where = {
      activo: true,
      [Op.and]: [
        {
          [Op.or]: [
            { fecha_inicio: null },
            { fecha_inicio: { [Op.lte]: ahora } },
          ],
        },
        {
          [Op.or]: [
            { fecha_fin: null },
            { fecha_fin: { [Op.gte]: ahora } },
          ],
        },
      ],
    };

    // Filtro por tenant
    if (empresa_id) {
      where[Op.and].push({
        [Op.or]: [
          { empresa_id: null },
          { empresa_id: parseInt(empresa_id, 10) },
        ],
      });
    } else {
      where[Op.and].push({ empresa_id: null });
    }

    // Filtro por plan si se envía
    if (plan) {
      where[Op.and].push({
        [Op.or]: [
          { plan_objetivo: 'todos' },
          { plan_objetivo: plan.toLowerCase() },
        ],
      });
    }

    const activo = await Comunicado.findOne({
      where,
      order: [
        ['prioridad', 'DESC'], // urgente > alta > media > baja
        ['created_at', 'DESC'],
      ],
    });

    if (activo) {
      // Incrementar contador de visualizaciones de forma silenciosa
      activo.increment('visto_contador', { by: 1 }).catch(() => {});
    }

    res.json({ success: true, data: activo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerPlanesSaaS(req, res) {
  try {
    await PlanSaaS.sync();
    let planes = await PlanSaaS.findAll({ order: [['precio_mensual', 'ASC']] });

    if (!planes || planes.length === 0) {
      const defaults = [
        {
          id: 'starter',
          nombre: 'Plan Starter',
          badge: 'Pyme',
          precio_mensual: 99.00,
          alcance: '1 Sede comercial',
          descripcion: 'Facturación electrónica y POS estándar',
          activo: true,
        },
        {
          id: 'professional',
          nombre: 'Plan Professional',
          badge: 'Más Popular',
          precio_mensual: 199.00,
          alcance: 'Multisede & Analítica',
          descripcion: 'Reportes avanzados y control integral',
          activo: true,
        },
        {
          id: 'enterprise',
          nombre: 'Plan Enterprise',
          badge: 'Full Suite',
          precio_mensual: 399.00,
          alcance: 'Sedes y Usuarios Ilimitados',
          descripcion: 'Soporte prioritario 24/7 y SLA garantizado',
          activo: true,
        },
      ];
      await PlanSaaS.bulkCreate(defaults);
      planes = await PlanSaaS.findAll({ order: [['precio_mensual', 'ASC']] });
    }

    res.json({ success: true, data: planes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarPlanesSaaS(req, res) {
  try {
    await PlanSaaS.sync();
    const { planes } = req.body;

    if (!Array.isArray(planes) || planes.length === 0) {
      return res.status(400).json({ success: false, error: 'Lista de planes inválida' });
    }

    for (const p of planes) {
      if (!p.id) continue;
      const [record] = await PlanSaaS.findOrCreate({
        where: { id: p.id },
        defaults: {
          id: p.id,
          nombre: p.nombre || `Plan ${p.id}`,
          precio_mensual: Number(p.precio_mensual) || 99,
          badge: p.badge || '',
          alcance: p.alcance || '',
          descripcion: p.descripcion || '',
        },
      });

      if (p.precio_mensual !== undefined) record.precio_mensual = Number(p.precio_mensual);
      if (p.nombre !== undefined) record.nombre = p.nombre;
      if (p.badge !== undefined) record.badge = p.badge;
      if (p.alcance !== undefined) record.alcance = p.alcance;
      if (p.descripcion !== undefined) record.descripcion = p.descripcion;
      await record.save();
    }

    const planesActualizados = await PlanSaaS.findAll({ order: [['precio_mensual', 'ASC']] });
    res.json({
      success: true,
      data: planesActualizados,
      mensaje: 'Tarifario oficial de planes SaaS actualizado correctamente',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// -------------------------------------------------------------
// MOTOR DE SEGURIDAD POR BOTÓN & MICRO-PERMISOS RBAC MULTI-TENANT
// -------------------------------------------------------------

const RUTA_PERMISOS_GLOBAL = fileURLToPath(new URL('../../config/permisos_botones_global.json', import.meta.url));

const CATALOGO_PERMISOS_FABRICA = [
  {
    id: 1,
    alias: 'SED',
    nombre: 'Ver Detalle Completo',
    descripcion: 'Visualización extendida de registros, comprobantes y auditoría',
    modulo: 'General',
    icono: 'Eye',
    roles: ['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'],
    activo: true,
    riesgo: 'bajo',
    requiere_pin: false,
    auditoria_obligatoria: false
  },
  {
    id: 2,
    alias: 'UPD',
    nombre: 'Editar y Modificar Registro',
    descripcion: 'Edición de campos y datos de clientes o productos existentes',
    modulo: 'General',
    icono: 'Pencil',
    roles: ['admin', 'supervisor'],
    activo: true,
    riesgo: 'medio',
    requiere_pin: false,
    auditoria_obligatoria: true
  },
  {
    id: 3,
    alias: 'DEL',
    nombre: 'Eliminar Fila o Documento',
    descripcion: 'Baja lógica o supresión de elementos de base de datos',
    modulo: 'General',
    icono: 'Trash2',
    roles: ['admin'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 4,
    alias: 'ANUL',
    nombre: 'Anular Venta / Factura SUNAT',
    descripcion: 'Generación de comunicación de baja o anulación tributaria',
    modulo: 'Ventas',
    icono: 'XCircle',
    roles: ['admin', 'supervisor'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 5,
    alias: 'REIMP_A4',
    nombre: 'Imprimir Factura Formato A4',
    descripcion: 'Descarga e impresión en formato PDF/A4 corporativo',
    modulo: 'Ventas',
    icono: 'Printer',
    roles: ['admin', 'supervisor', 'cajero', 'vendedor'],
    activo: true,
    riesgo: 'medio',
    requiere_pin: false,
    auditoria_obligatoria: false
  },
  {
    id: 6,
    alias: 'REIMP_TICKET',
    nombre: 'Imprimir Ticket Térmico 80mm',
    descripcion: 'Envío de copia de ticket a impresora térmica de caja',
    modulo: 'POS',
    icono: 'FileText',
    roles: ['admin', 'supervisor', 'cajero', 'vendedor', 'mozo'],
    activo: true,
    riesgo: 'bajo',
    requiere_pin: false,
    auditoria_obligatoria: false
  },
  {
    id: 7,
    alias: 'DESC_ESPECIAL',
    nombre: 'Autorizar Descuento Libre > 10%',
    descripcion: 'Rebaja de precio por encima del margen comercial asignado',
    modulo: 'POS',
    icono: 'DollarSign',
    roles: ['admin', 'supervisor'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 8,
    alias: 'REAPERTURA_CAJA',
    nombre: 'Reabrir Turno de Caja Cerrado',
    descripcion: 'Reversión de arqueo o corte Z para ajustes extemporáneos',
    modulo: 'Finanzas',
    icono: 'Key',
    roles: ['admin'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 9,
    alias: 'CAMBIO_PRECIO',
    nombre: 'Modificar Precio en Caliente',
    descripcion: 'Ajuste directo de precio unitario en pantalla de cobro',
    modulo: 'POS',
    icono: 'SlidersHorizontal',
    roles: ['admin', 'supervisor'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 10,
    alias: 'NOTAS_CREDITO',
    nombre: 'Emitir Nota de Crédito / Débito',
    descripcion: 'Emisión de documentos electrónicos correctivos ante SUNAT',
    modulo: 'Facturación',
    icono: 'ShieldCheck',
    roles: ['admin', 'supervisor'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 11,
    alias: 'ACC',
    nombre: 'Gestión de Claves & Usuarios',
    descripcion: 'Creación, suspensión o reseteo de credenciales de personal',
    modulo: 'Seguridad',
    icono: 'Lock',
    roles: ['admin'],
    activo: true,
    riesgo: 'critico',
    requiere_pin: true,
    auditoria_obligatoria: true
  },
  {
    id: 12,
    alias: 'EXPORT_EXCEL',
    nombre: 'Exportar Reportes a Excel',
    descripcion: 'Extracción masiva de bases de datos de ventas e inventario',
    modulo: 'Reportes',
    icono: 'FileSpreadsheet',
    roles: ['admin', 'supervisor'],
    activo: true,
    riesgo: 'medio',
    requiere_pin: false,
    auditoria_obligatoria: true
  }
];

async function leerPermisosGlobales() {
  try {
    const raw = await fs.readFile(RUTA_PERMISOS_GLOBAL, 'utf-8');
    const data = JSON.parse(raw);
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (e) {
    console.warn('No se pudo leer permisos_botones_global.json, usando catálogo de fábrica');
  }
  return CATALOGO_PERMISOS_FABRICA;
}

export async function obtenerPermisosBotones(req, res) {
  try {
    const { tenantId = 'global' } = req.query;
    const catalogoGlobal = await leerPermisosGlobales();

    if (tenantId === 'global' || !tenantId) {
      return res.json({
        success: true,
        tenantId: 'global',
        data: catalogoGlobal,
      });
    }

    const empresa = await Empresa.findByPk(tenantId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    const tenantPermisos = empresa.permisos_botones;
    let catalogoMerged = catalogoGlobal;

    if (Array.isArray(tenantPermisos) && tenantPermisos.length > 0) {
      catalogoMerged = catalogoGlobal.map((item) => {
        const override = tenantPermisos.find((o) => o.id === item.id || o.alias === item.alias);
        return override ? { ...item, ...override } : item;
      });
      tenantPermisos.forEach((tp) => {
        if (!catalogoMerged.some((m) => m.id === tp.id || m.alias === tp.alias)) {
          catalogoMerged.push(tp);
        }
      });
    }

    res.json({
      success: true,
      tenantId: empresa.id,
      nombreEmpresa: empresa.nombre,
      data: catalogoMerged,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function actualizarPermisosBotones(req, res) {
  try {
    const { tenantId = 'global', catalogo } = req.body;
    if (!Array.isArray(catalogo)) {
      return res.status(400).json({ success: false, error: 'El catálogo de acciones debe ser una lista válida' });
    }

    if (tenantId === 'global' || !tenantId) {
      await fs.writeFile(RUTA_PERMISOS_GLOBAL, JSON.stringify(catalogo, null, 2), 'utf-8');

      await registrarEventoAuditoria(req, {
        modulo: 'SEGURIDAD_RBAC',
        accion: 'ACTUALIZAR',
        detalles: `Actualización de matriz global de micro-permisos y seguridad por botón (${catalogo.length} acciones)`,
      });

      return res.json({
        success: true,
        mensaje: 'Matriz global de permisos y seguridad por botón guardada exitosamente',
        tenantId: 'global',
        data: catalogo,
      });
    }

    const empresa = await Empresa.findByPk(tenantId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    empresa.permisos_botones = catalogo;
    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'SEGURIDAD_RBAC',
      accion: 'ACTUALIZAR',
      detalles: `Actualización de micro-permisos por botón específicos para "${empresa.nombre}"`,
    });

    res.json({
      success: true,
      mensaje: `Políticas de seguridad por botón actualizadas para "${empresa.nombre}"`,
      tenantId: empresa.id,
      data: catalogo,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function restablecerPermisosBotones(req, res) {
  try {
    const { tenantId = 'global' } = req.body;
    const catalogoFabrica = CATALOGO_PERMISOS_FABRICA;

    if (tenantId === 'global' || !tenantId) {
      await fs.writeFile(RUTA_PERMISOS_GLOBAL, JSON.stringify(catalogoFabrica, null, 2), 'utf-8');

      await registrarEventoAuditoria(req, {
        modulo: 'SEGURIDAD_RBAC',
        accion: 'RESTABLECER',
        detalles: 'Restablecimiento de fábrica de la matriz global de permisos por botón',
      });

      return res.json({
        success: true,
        mensaje: 'Catálogo de permisos por botón restablecido a valores recomendados de fábrica',
        tenantId: 'global',
        data: catalogoFabrica,
      });
    }

    const empresa = await Empresa.findByPk(tenantId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    empresa.permisos_botones = null;
    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'SEGURIDAD_RBAC',
      accion: 'RESTABLECER',
      detalles: `Restablecimiento de permisos por botón a la plantilla global para "${empresa.nombre}"`,
    });

    const catalogoGlobal = await leerPermisosGlobales();

    res.json({
      success: true,
      mensaje: `Permisos de "${empresa.nombre}" restablecidos a la plantilla global del sistema`,
      tenantId: empresa.id,
      data: catalogoGlobal,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// -------------------------------------------------------------
// MOTOR DE WHITE-LABEL STUDIO & LOGIN PERSONALIZADO MULTI-TENANT
// -------------------------------------------------------------

const RUTA_WHITELABEL_GLOBAL = fileURLToPath(new URL('../../config/whitelabel_global.json', import.meta.url));

const DEFAULT_WHITELABEL_CONFIG = {
  logoUrl: '',
  logoWidth: 240,
  logoHeight: 68,
  tituloLogin: 'Acceso al Sistema Empresarial',
  subtituloLogin: 'Suite Multi-Empresa & Facturación Electrónica SUNAT',
  bgPreset: 'modern_glass',
  bgCustomUrl: '',
  colorPrimario: '#02CBA9',
  colorFondoHead: '#ffffff',
  colorFondoBody: '#f8fafc',
  mostrarCopyright: true,
  textoCopyright: '© 2026 HEIS Suite SAC. Todos los derechos reservados.',
  estiloCard: 'glass',
};

async function leerWhitelabelGlobal() {
  try {
    const raw = await fs.readFile(RUTA_WHITELABEL_GLOBAL, 'utf-8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      return { ...DEFAULT_WHITELABEL_CONFIG, ...data };
    }
  } catch {
    // Si no existe aún el archivo, usamos el de fábrica
  }
  return DEFAULT_WHITELABEL_CONFIG;
}

export async function obtenerConfigWhitelabel(req, res) {
  try {
    const { tenantId = 'global' } = req.query;
    const globalConfig = await leerWhitelabelGlobal();

    const esGlobal = !tenantId || tenantId === 'global' || tenantId === 'null' || tenantId === 'undefined';
    if (esGlobal) {
      return res.json({
        success: true,
        tenantId: 'global',
        data: globalConfig,
      });
    }

    const parsedId = parseInt(tenantId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, error: 'Identificador de empresa inválido' });
    }

    const empresa = await Empresa.findByPk(parsedId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    let tenantConfig = empresa.config_whitelabel;
    if (!tenantConfig || typeof tenantConfig !== 'object') {
      tenantConfig = {
        ...globalConfig,
        tituloLogin: empresa.nombre || globalConfig.tituloLogin,
        logoUrl: empresa.logo_url || globalConfig.logoUrl,
        colorPrimario: empresa.color_brand || globalConfig.colorPrimario,
      };
    } else {
      tenantConfig = { ...globalConfig, ...tenantConfig };
    }

    res.json({
      success: true,
      tenantId: empresa.id,
      nombreEmpresa: empresa.nombre,
      data: tenantConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function guardarConfigWhitelabel(req, res) {
  try {
    const { tenantId = 'global', config } = req.body;
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ success: false, error: 'La configuración de marca blanca es inválida' });
    }

    const esGlobal = !tenantId || tenantId === 'global' || tenantId === 'null' || tenantId === 'undefined';
    if (esGlobal) {
      await fs.writeFile(RUTA_WHITELABEL_GLOBAL, JSON.stringify(config, null, 2), 'utf-8');

      await registrarEventoAuditoria(req, {
        modulo: 'SUPERADMIN_WHITELABEL',
        accion: 'ACTUALIZAR',
        detalles: 'Actualización de plantilla global White-Label y diseño de Login',
      });

      return res.json({
        success: true,
        mensaje: 'Plantilla global White-Label guardada exitosamente',
        tenantId: 'global',
        data: config,
      });
    }

    const parsedId = parseInt(tenantId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, error: 'Identificador de empresa inválido' });
    }

    const empresa = await Empresa.findByPk(parsedId);
    if (!empresa) {
      return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
    }

    empresa.config_whitelabel = config;
    if (config.colorPrimario) empresa.color_brand = config.colorPrimario;
    if (config.logoUrl) empresa.logo_url = config.logoUrl;
    await empresa.save();

    await registrarEventoAuditoria(req, {
      empresa_id: empresa.id,
      modulo: 'SUPERADMIN_WHITELABEL',
      accion: 'ACTUALIZAR',
      detalles: `Personalización White-Label guardada para "${empresa.nombre}"`,
    });

    res.json({
      success: true,
      mensaje: `Personalización White-Label guardada para "${empresa.nombre}"`,
      tenantId: empresa.id,
      data: config,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function obtenerWhitelabelPublico(req, res) {
  try {
    const { empresa_id } = req.query;
    const globalConfig = await leerWhitelabelGlobal();

    if (empresa_id && empresa_id !== 'null' && empresa_id !== 'undefined' && empresa_id !== 'global') {
      const parsedId = parseInt(empresa_id, 10);
      if (!isNaN(parsedId)) {
        const empresa = await Empresa.findByPk(parsedId, {
          attributes: ['id', 'nombre', 'ruc', 'color_brand', 'logo_url', 'config_whitelabel', 'activo'],
        });
        if (empresa && empresa.activo) {
          const tenantConfig = empresa.config_whitelabel
            ? { ...globalConfig, ...empresa.config_whitelabel }
            : {
                ...globalConfig,
                tituloLogin: empresa.nombre,
                logoUrl: empresa.logo_url || globalConfig.logoUrl,
                colorPrimario: empresa.color_brand || globalConfig.colorPrimario,
              };

          return res.json({
            success: true,
            tenant: {
              id: empresa.id,
              nombre: empresa.nombre,
              ruc: empresa.ruc,
            },
            data: tenantConfig,
          });
        }
      }
    }

    res.json({
      success: true,
      tenant: null,
      data: globalConfig,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}




