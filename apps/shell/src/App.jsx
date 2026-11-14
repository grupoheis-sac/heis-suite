import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout, UnifiedToastItem, SubscriptionStatusBanner } from '@heis/ui';
import {
  EmpresaProvider,
  useAuthStore,
  useModulos,
  useRealtime,
  AdministracionHub,
  api,
  isSuperAdminUser,
  canUserAccessModule,
  getUserPermissions,
  getRoleLandingRoute,
} from '@heis/core';

// Páginas Shell
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SuperAdminHub from './pages/SuperAdminHub';
import ConfiguracionView from './pages/ConfiguracionView';
const FacturacionSunatHub = lazy(() => import('./pages/FacturacionSunatHub'));

// Módulo Restaurante (Lazy loaded)
const Mesas = lazy(() => import('./pages/restaurante/Mesas'));
const Cocina = lazy(() => import('./pages/restaurante/Cocina'));
const Menu = lazy(() => import('./pages/restaurante/Menu'));
const Ordenes = lazy(() => import('./pages/restaurante/Ordenes'));
const Reservas = lazy(() => import('./pages/restaurante/Reservas'));
const Gastos = lazy(() => import('./pages/restaurante/Gastos'));

// Módulo Ferretería / Comercial Retail (Lazy loaded)
const POS = lazy(() => import('./pages/ferreteria/POS'));
const InventarioHub = lazy(() => import('./pages/ferreteria/InventarioHub'));
const ProductosFerreteria = lazy(() => import('./pages/ferreteria/Productos'));
const KardexInventario = lazy(() => import('./pages/ferreteria/KardexInventario'));
const Ventas = lazy(() => import('./pages/ferreteria/Ventas'));
const CajaFinanzasHub = lazy(() => import('./pages/ferreteria/CajaFinanzasHub'));
const Clientes = lazy(() => import('./pages/ferreteria/Clientes'));
const Cotizaciones = lazy(() => import('./pages/ferreteria/Cotizaciones'));
const ComprasProveedoresHub = lazy(() => import('./pages/ferreteria/ComprasProveedoresHub'));

// Módulo Botica / Farmacéutica (Lazy loaded)
const POSBotica = lazy(() => import('./pages/botica/POS'));
const MedicamentosBotica = lazy(() => import('./pages/botica/Medicamentos'));
const LotesBotica = lazy(() => import('./pages/botica/Lotes'));
const InventarioBoticaHub = lazy(() => import('./pages/botica/InventarioHub'));
const KardexSunatBotica = lazy(() => import('./pages/botica/KardexSunat'));
const BajasCuarentenaBotica = lazy(() => import('./pages/botica/BajasCuarentena'));
const TemperaturaHumedadBotica = lazy(() => import('./pages/botica/TemperaturaHumedad'));
const ObservatorioDigemidBotica = lazy(() => import('./pages/botica/ObservatorioDigemid'));
const DeliveryBotica = lazy(() => import('./pages/botica/DeliveryFarmacia'));
const DevolucionesBotica = lazy(() => import('./pages/botica/DevolucionesProveedor'));
const VentasBotica = lazy(() => import('./pages/botica/Ventas'));
const CajaBoticaHub = lazy(() => import('./pages/botica/CajaFinanzasHub'));
const ClientesBotica = lazy(() => import('./pages/botica/Clientes'));
const ComprasBoticaHub = lazy(() => import('./pages/botica/ComprasProveedoresHub'));
const CreditosBotica = lazy(() => import('./pages/botica/Creditos'));
const TrasladosBotica = lazy(() => import('./pages/botica/Traslados'));

// Módulo Hospedaje / Hotelería (Lazy loaded)
const RackHabitaciones = lazy(() => import('./pages/hospedaje/RackHabitaciones'));
const ReservasHotel = lazy(() => import('./pages/hospedaje/Reservas'));
const HuespedesHotel = lazy(() => import('./pages/hospedaje/Huespedes'));
const LimpiezaHotel = lazy(() => import('./pages/hospedaje/Limpieza'));
const TarifasHotel = lazy(() => import('./pages/hospedaje/TarifasTemporadas'));
const PisosHotel = lazy(() => import('./pages/hospedaje/PisosEstructura'));
const CajaHotel = lazy(() => import('./pages/hospedaje/CajaFinanzas'));
const FacturacionHotel = lazy(() => import('./pages/hospedaje/Facturacion'));
const POSHotel = lazy(() => import('./pages/hospedaje/POS'));
const InventarioHotel = lazy(() => import('./pages/hospedaje/Inventario'));
const ReportesHotel = lazy(() => import('./pages/hospedaje/Reportes'));

// Loader visual durante transiciones
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 font-heading uppercase tracking-wider">
          Cargando HEIS Suite...
        </span>
      </div>
    </div>
  );
}

// Guard de Autenticación
function RequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

// Guard de SuperAdmin
function RequireSuperAdmin({ children }) {
  const { user } = useAuthStore();
  if (user?.rol !== 'superadmin' && user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// Guard de Módulo y Submódulo con Aislamiento RBAC Estricto
function RequireModuloRoute({ modulo, submodulo = null, children }) {
  const { user, empresa } = useAuthStore();
  const modulos = useModulos();
  const isSuperAdmin = isSuperAdminUser(user);

  if (isSuperAdmin && !empresa) return children;

  const landingRoute = getRoleLandingRoute(user, modulos?.lista);

  // 1. Validar acceso vertical al módulo según la empresa y el rol del usuario
  if (!canUserAccessModule(user, modulo, modulos?.lista)) {
    return <Navigate to={landingRoute} replace />;
  }

  // 2. Validar submódulo activo en la empresa
  if (submodulo && modulos?.submodulos && modulos.submodulos[submodulo] === false) {
    return <Navigate to={landingRoute} replace />;
  }

  // 3. Validar permisos granulares del rol para la pantalla solicitada
  const userPerms = getUserPermissions(user);
  if (!userPerms.isGeneralAdmin) {
    if (submodulo === 'cocina' && !userPerms.canViewCocina) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'mesas' && !userPerms.canViewMesas) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'menu' && !userPerms.canViewMenu) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'reservas' && !userPerms.canViewReservas) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'gastos' && !userPerms.canViewGastos) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'pos_ferreteria' && !userPerms.canViewPOS) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'inventario_ferreteria' && !userPerms.canViewInventario) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'ventas_ferreteria' && !userPerms.canViewVentas) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'cotizaciones' && !userPerms.canViewCotizaciones) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'compras_proveedores' && !userPerms.canViewCompras) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'clientes_obras' && !userPerms.canViewClientes) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'dispensacion' && !userPerms.canViewDispensacion) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'medicamentos' && !userPerms.canViewMedicamentos) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'lotes_fefo' && !userPerms.canViewLotes) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'inventario_botica' && !userPerms.canViewInventario) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'temperatura' && !userPerms.canViewTemperatura) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'digemid_opm' && !userPerms.canViewDigemid) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'bajas_cuarentena' && !userPerms.canViewBajas) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'rack' && !userPerms.canViewRack) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'reservas_hotel' && !userPerms.canViewReservasHotel) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'huespedes' && !userPerms.canViewHuespedes) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'limpieza' && !userPerms.canViewLimpieza) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'tarifas' && !userPerms.canViewTarifas) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'pisos' && !userPerms.canViewPisos) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'caja_hotel' && !userPerms.canViewCaja) return <Navigate to={landingRoute} replace />;
    if (submodulo === 'pos_hotel' && !userPerms.canViewPosHotel) return <Navigate to={landingRoute} replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, empresa } = useAuthStore();
  const modulos = useModulos();
  const isSuperAdmin = isSuperAdminUser(user);
  if (isSuperAdmin && !empresa) {
    return <Navigate to="/superadmin" replace />;
  }
  return <Navigate to={getRoleLandingRoute(user, modulos?.lista)} replace />;
}

function DashboardGuardRoute() {
  const { user, empresa } = useAuthStore();
  const modulos = useModulos();
  const isSuperAdmin = isSuperAdminUser(user);
  if (isSuperAdmin && !empresa) {
    return <Navigate to="/superadmin" replace />;
  }
  const userPerms = getUserPermissions(user);
  if (!userPerms.canViewDashboard) {
    return <Navigate to={getRoleLandingRoute(user, modulos?.lista)} replace />;
  }
  return <Dashboard />;
}

function MainAppShell() {
  useRealtime();
  const { user, empresa, sucursalActual, isDark, toggleTheme, logout } = useAuthStore();
  const modulos = useModulos();
  const location = useLocation();

  const [comunicado, setComunicado] = useState(null);

  useEffect(() => {
    api.get(`/comunicados/activo${empresa?.id ? `?empresa_id=${empresa.id}` : ''}`)
      .then((res) => {
        if (res.data?.data) {
          const item = res.data.data;
          const yaDescartado = sessionStorage.getItem(`heis_dismiss_comunicado_${item.id}`);
          if (!yaDescartado) {
            setComunicado(item);
          }
        }
      })
      .catch(() => {});
  }, [empresa?.id]);

  const handleDismissComunicado = () => {
    if (comunicado?.id) {
      sessionStorage.setItem(`heis_dismiss_comunicado_${comunicado.id}`, 'true');
    }
    setComunicado(null);
  };

  const isSuperAdmin = user?.rol === 'superadmin' || user?.role === 'superadmin';

  let moduloActual = 'restaurante';
  const path = location.pathname;
  if (isSuperAdmin && !empresa) {
    moduloActual = 'superadmin';
  } else if (
    path.startsWith('/caja') ||
    path.startsWith('/facturacion-sunat') ||
    path.startsWith('/administracion')
  ) {
    moduloActual = 'core';
  } else if (
    path.includes('-botica') ||
    path.startsWith('/dispensacion') ||
    path.startsWith('/medicamentos') ||
    path.startsWith('/lotes') ||
    path.startsWith('/bajas-sanitarias') ||
    path.startsWith('/temperatura') ||
    path.startsWith('/digemid')
  ) {
    moduloActual = 'botica';
  } else if (
    path.includes('-hotel') ||
    path.startsWith('/habitaciones') ||
    path.startsWith('/rack') ||
    path.startsWith('/huespedes')
  ) {
    moduloActual = 'hospedaje';
  } else if (
    path.startsWith('/pos') ||
    path.startsWith('/inventario') ||
    path.startsWith('/productos-ferreteria') ||
    path.startsWith('/kardex') ||
    path.startsWith('/ventas') ||
    path.startsWith('/clientes') ||
    path.startsWith('/cotizaciones') ||
    path.startsWith('/compras') ||
    path.startsWith('/proveedores')
  ) {
    moduloActual = 'ferreteria';
  } else if (
    path.startsWith('/mesas') ||
    path.startsWith('/cocina') ||
    path.startsWith('/ordenes') ||
    path.startsWith('/menu') ||
    path.startsWith('/gastos')
  ) {
    moduloActual = 'restaurante';
  }

  return (
    <Layout
      user={user}
      empresa={empresa}
      modulosActivos={modulos.lista}
      sucursalActual={sucursalActual}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      onLogout={logout}
      moduloActual={moduloActual}
      comunicado={comunicado}
      onDismissComunicado={handleDismissComunicado}
      quickSearchActions={[
        { id: 'mesas-quick', title: 'Salón y Mesas (F1)', desc: 'Plano interactivo de mesas', path: '/mesas', category: 'Restaurante', badge: 'F1' },
        { id: 'cocina-quick', title: 'Cocina KDS', desc: 'Despacho de comandas en vivo', path: '/cocina', category: 'Restaurante', badge: 'En Vivo' },
        { id: 'sunat-quick', title: 'Facturación SUNAT UBL 2.1', desc: 'Boletas, Facturas, Notas de Crédito y XML', path: '/facturacion-sunat', category: 'Core Fiscal', badge: 'UBL 2.1' },
      ]}
    >
      <SubscriptionStatusBanner empresa={empresa} user={user} />
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
}

export default function App() {
  const { isDark } = useAuthStore();

  return (
    <EmpresaProvider>
      <Toaster
        position="bottom-right"
        containerClassName="!z-[9999]"
        gutter={8}
        toastOptions={{
          duration: 3500,
        }}
        containerStyle={{
          bottom: 24,
          right: 24,
        }}
      >
        {(t) => <UnifiedToastItem t={t} isDark={isDark} />}
      </Toaster>

      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas bajo el Guard y MainAppShell */}
        <Route element={<RequireAuth />}>
          <Route element={<MainAppShell />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<DashboardGuardRoute />} />

            {/* Core Compartido: Administración & Sedes (Sedes, Equipo, Roles, Auditoría) */}
            <Route path="/administracion" element={<AdministracionHub />} />
            <Route path="/sucursales" element={<Navigate to="/administracion?tab=sedes" replace />} />
            <Route path="/usuarios" element={<Navigate to="/administracion?tab=equipo" replace />} />
            <Route path="/roles" element={<Navigate to="/administracion?tab=roles" replace />} />
            <Route path="/roles-usuarios" element={<Navigate to="/administracion?tab=roles" replace />} />
            <Route path="/auditoria" element={<Navigate to="/administracion?tab=auditoria" replace />} />

            {/* Configuración */}
            <Route path="/configuracion" element={<ConfiguracionView />} />

            {/* Módulo Restaurante */}
            <Route path="/mesas" element={<RequireModuloRoute modulo="restaurante" submodulo="mesas"><Mesas /></RequireModuloRoute>} />
            <Route path="/cocina" element={<RequireModuloRoute modulo="restaurante" submodulo="cocina"><Cocina /></RequireModuloRoute>} />
            <Route path="/ordenes" element={<RequireModuloRoute modulo="restaurante"><Ordenes /></RequireModuloRoute>} />
            <Route path="/menu" element={<RequireModuloRoute modulo="restaurante" submodulo="menu"><Menu /></RequireModuloRoute>} />
            <Route path="/reservas" element={<RequireModuloRoute modulo="restaurante" submodulo="reservas"><Reservas /></RequireModuloRoute>} />
            <Route path="/gastos" element={<RequireModuloRoute modulo="restaurante" submodulo="gastos"><Gastos /></RequireModuloRoute>} />

            {/* Módulo Ferretería / Comercial Retail */}
            <Route path="/pos" element={<RequireModuloRoute modulo="ferreteria" submodulo="pos_ferreteria"><POS /></RequireModuloRoute>} />
            <Route path="/inventario" element={<RequireModuloRoute modulo="ferreteria" submodulo="inventario_ferreteria"><InventarioHub /></RequireModuloRoute>} />
            <Route path="/productos-ferreteria" element={<RequireModuloRoute modulo="ferreteria" submodulo="inventario_ferreteria"><ProductosFerreteria /></RequireModuloRoute>} />
            <Route path="/kardex" element={<RequireModuloRoute modulo="ferreteria" submodulo="inventario_ferreteria"><KardexInventario /></RequireModuloRoute>} />
            <Route path="/ventas" element={<RequireModuloRoute modulo="ferreteria" submodulo="ventas_ferreteria"><Ventas /></RequireModuloRoute>} />
            <Route path="/cotizaciones" element={<RequireModuloRoute modulo="ferreteria" submodulo="cotizaciones"><Cotizaciones /></RequireModuloRoute>} />
            <Route path="/compras" element={<RequireModuloRoute modulo="ferreteria" submodulo="compras_proveedores"><ComprasProveedoresHub /></RequireModuloRoute>} />
            <Route path="/proveedores" element={<RequireModuloRoute modulo="ferreteria" submodulo="compras_proveedores"><ComprasProveedoresHub /></RequireModuloRoute>} />
            <Route path="/clientes" element={<RequireModuloRoute modulo="ferreteria" submodulo="clientes_obras"><Clientes /></RequireModuloRoute>} />

            {/* Core Transversal: Caja, Facturación e Historial (Accesibles para todos los giros activos) */}
            <Route path="/caja" element={<RequireModuloRoute modulo="core"><CajaFinanzasHub /></RequireModuloRoute>} />
            <Route path="/cajas" element={<Navigate to="/caja" replace />} />
            <Route path="/historial-cajas" element={<Navigate to="/caja?tab=turnos" replace />} />
            <Route path="/facturacion-sunat" element={<RequireModuloRoute modulo="core"><FacturacionSunatHub /></RequireModuloRoute>} />

            {/* Módulo Botica / Farmacéutica */}
            <Route path="/dispensacion" element={<RequireModuloRoute modulo="botica" submodulo="dispensacion"><POSBotica /></RequireModuloRoute>} />
            <Route path="/medicamentos" element={<RequireModuloRoute modulo="botica" submodulo="medicamentos"><MedicamentosBotica /></RequireModuloRoute>} />
            <Route path="/lotes" element={<RequireModuloRoute modulo="botica" submodulo="lotes_fefo"><LotesBotica /></RequireModuloRoute>} />
            <Route path="/inventario-botica" element={<RequireModuloRoute modulo="botica" submodulo="inventario_botica"><InventarioBoticaHub /></RequireModuloRoute>} />
            <Route path="/kardex-botica" element={<RequireModuloRoute modulo="botica" submodulo="inventario_botica"><KardexSunatBotica /></RequireModuloRoute>} />
            <Route path="/bajas-sanitarias" element={<RequireModuloRoute modulo="botica" submodulo="bajas_cuarentena"><BajasCuarentenaBotica /></RequireModuloRoute>} />
            <Route path="/temperatura" element={<RequireModuloRoute modulo="botica" submodulo="temperatura"><TemperaturaHumedadBotica /></RequireModuloRoute>} />
            <Route path="/digemid" element={<RequireModuloRoute modulo="botica" submodulo="digemid_opm"><ObservatorioDigemidBotica /></RequireModuloRoute>} />
            <Route path="/delivery-botica" element={<RequireModuloRoute modulo="botica"><DeliveryBotica /></RequireModuloRoute>} />
            <Route path="/devoluciones-botica" element={<RequireModuloRoute modulo="botica"><DevolucionesBotica /></RequireModuloRoute>} />
            <Route path="/ventas-botica" element={<RequireModuloRoute modulo="botica"><VentasBotica /></RequireModuloRoute>} />
            <Route path="/caja-botica" element={<RequireModuloRoute modulo="botica"><CajaBoticaHub /></RequireModuloRoute>} />
            <Route path="/clientes-botica" element={<RequireModuloRoute modulo="botica"><ClientesBotica /></RequireModuloRoute>} />
            <Route path="/compras-botica" element={<RequireModuloRoute modulo="botica"><ComprasBoticaHub /></RequireModuloRoute>} />
            <Route path="/creditos-botica" element={<RequireModuloRoute modulo="botica"><CreditosBotica /></RequireModuloRoute>} />
            <Route path="/traslados-botica" element={<RequireModuloRoute modulo="botica"><TrasladosBotica /></RequireModuloRoute>} />

            {/* Módulo Hospedaje / Hotelería */}
            <Route path="/habitaciones" element={<RequireModuloRoute modulo="hospedaje" submodulo="rack"><RackHabitaciones /></RequireModuloRoute>} />
            <Route path="/rack" element={<RequireModuloRoute modulo="hospedaje" submodulo="rack"><RackHabitaciones /></RequireModuloRoute>} />
            <Route path="/reservas-hotel" element={<RequireModuloRoute modulo="hospedaje" submodulo="reservas_hotel"><ReservasHotel /></RequireModuloRoute>} />
            <Route path="/huespedes" element={<RequireModuloRoute modulo="hospedaje" submodulo="huespedes"><HuespedesHotel /></RequireModuloRoute>} />
            <Route path="/limpieza-hotel" element={<RequireModuloRoute modulo="hospedaje" submodulo="limpieza"><LimpiezaHotel /></RequireModuloRoute>} />
            <Route path="/tarifas-hotel" element={<RequireModuloRoute modulo="hospedaje" submodulo="tarifas"><TarifasHotel /></RequireModuloRoute>} />
            <Route path="/pisos-hotel" element={<RequireModuloRoute modulo="hospedaje" submodulo="pisos"><PisosHotel /></RequireModuloRoute>} />
            <Route path="/caja-hotel" element={<RequireModuloRoute modulo="hospedaje" submodulo="caja_hotel"><CajaHotel /></RequireModuloRoute>} />
            <Route path="/facturacion-hotel" element={<RequireModuloRoute modulo="hospedaje"><FacturacionHotel /></RequireModuloRoute>} />
            <Route path="/pos-hotel" element={<RequireModuloRoute modulo="hospedaje" submodulo="pos_hotel"><POSHotel /></RequireModuloRoute>} />
            <Route path="/inventario-hotel" element={<RequireModuloRoute modulo="hospedaje"><InventarioHotel /></RequireModuloRoute>} />
            <Route path="/reportes-hotel" element={<RequireModuloRoute modulo="hospedaje"><ReportesHotel /></RequireModuloRoute>} />

            {/* SuperAdmin SaaS (Solo plataforma) */}
            <Route
              path="/superadmin"
              element={
                <RequireSuperAdmin>
                  <SuperAdminHub />
                </RequireSuperAdmin>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </EmpresaProvider>
  );
}
