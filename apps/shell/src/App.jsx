import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout, UnifiedToastItem } from '@heis/ui';
import {
  EmpresaProvider,
  useAuthStore,
  useModulos,
  AdministracionHub,
  api,
} from '@heis/core';

// Páginas Shell
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SuperAdminHub from './pages/SuperAdminHub';
import ConfiguracionView from './pages/ConfiguracionView';

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

function RootRedirect() {
  const { user, empresa } = useAuthStore();
  const isSuperAdmin = user?.rol === 'superadmin' || user?.role === 'superadmin';
  if (isSuperAdmin && !empresa) {
    return <Navigate to="/superadmin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function DashboardGuardRoute() {
  const { user, empresa } = useAuthStore();
  const isSuperAdmin = user?.rol === 'superadmin' || user?.role === 'superadmin';
  if (isSuperAdmin && !empresa) {
    return <Navigate to="/superadmin" replace />;
  }
  return <Dashboard />;
}

function MainAppShell() {
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
    path.startsWith('/caja') ||
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
        { id: 'carta-quick', title: 'Carta & Menú', desc: 'Precios y platos del restaurante', path: '/menu', category: 'Restaurante' },
      ]}
    >
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
        position="top-right"
        containerClassName="!z-[9999]"
        gutter={8}
        toastOptions={{
          duration: 3500,
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
            <Route path="/mesas" element={<Mesas />} />
            <Route path="/cocina" element={<Cocina />} />
            <Route path="/ordenes" element={<Ordenes />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/gastos" element={<Gastos />} />

            {/* Módulo Ferretería / Comercial Retail */}
            <Route path="/pos" element={<POS />} />
            <Route path="/inventario" element={<InventarioHub />} />
            <Route path="/productos-ferreteria" element={<ProductosFerreteria />} />
            <Route path="/kardex" element={<KardexInventario />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/caja" element={<CajaFinanzasHub />} />
            <Route path="/cajas" element={<CajaFinanzasHub />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/cotizaciones" element={<Cotizaciones />} />
            <Route path="/compras" element={<ComprasProveedoresHub />} />
            <Route path="/proveedores" element={<ComprasProveedoresHub />} />

            {/* Módulo Botica / Farmacéutica */}
            <Route path="/dispensacion" element={<POSBotica />} />
            <Route path="/medicamentos" element={<MedicamentosBotica />} />
            <Route path="/lotes" element={<LotesBotica />} />
            <Route path="/inventario-botica" element={<InventarioBoticaHub />} />
            <Route path="/kardex-botica" element={<KardexSunatBotica />} />
            <Route path="/bajas-sanitarias" element={<BajasCuarentenaBotica />} />
            <Route path="/temperatura" element={<TemperaturaHumedadBotica />} />
            <Route path="/digemid" element={<ObservatorioDigemidBotica />} />
            <Route path="/delivery-botica" element={<DeliveryBotica />} />
            <Route path="/devoluciones-botica" element={<DevolucionesBotica />} />
            <Route path="/ventas-botica" element={<VentasBotica />} />
            <Route path="/caja-botica" element={<CajaBoticaHub />} />
            <Route path="/clientes-botica" element={<ClientesBotica />} />
            <Route path="/compras-botica" element={<ComprasBoticaHub />} />
            <Route path="/creditos-botica" element={<CreditosBotica />} />
            <Route path="/traslados-botica" element={<TrasladosBotica />} />

            {/* Módulo Hospedaje / Hotelería */}
            <Route path="/habitaciones" element={<RackHabitaciones />} />
            <Route path="/rack" element={<RackHabitaciones />} />
            <Route path="/reservas-hotel" element={<ReservasHotel />} />
            <Route path="/huespedes" element={<HuespedesHotel />} />
            <Route path="/limpieza-hotel" element={<LimpiezaHotel />} />
            <Route path="/tarifas-hotel" element={<TarifasHotel />} />
            <Route path="/pisos-hotel" element={<PisosHotel />} />
            <Route path="/caja-hotel" element={<CajaHotel />} />
            <Route path="/facturacion-hotel" element={<FacturacionHotel />} />
            <Route path="/pos-hotel" element={<POSHotel />} />
            <Route path="/inventario-hotel" element={<InventarioHotel />} />
            <Route path="/reportes-hotel" element={<ReportesHotel />} />

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
