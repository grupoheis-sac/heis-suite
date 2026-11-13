import React, { useState, useEffect, useRef } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Plus,
  Minus,
  Check,
  Search,
  RefreshCw,
  X,
  FileText,
  User,
  Package,
  Layers,
  ArrowRight,
  ShieldAlert,
  Trash2,
  ChevronDown
} from 'lucide-react';

export default function AjustesMermas() {
  const [productos, setProductos] = useState([]);
  const [ajustesRecientes, setAjustesRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [busqProd, setBusqProd] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const MOTIVOS_FERRETERIA = [
    'Rotura de bolsa en manipulación o despacho (Cemento/Yeso)',
    'Merma por corte de cables eléctricos / mallas / alambre',
    'Material oxidado, humedecido o deteriorado en almacén',
    'Diferencia detectada tras conteo / inventario físico',
    'Pieza defectuosa o rajada devuelta por el cliente',
    'Retiro para uso interno / mantenimiento de la ferretería',
    'Ingreso por sobrante de obra devuelto en buen estado',
    'Otro motivo (especificar)'
  ];

  const [tipoAjuste, setTipoAjuste] = useState('Salida'); // 'Salida' (Merma) | 'Entrada' (Sobrante) | 'Ajuste' (Fijar)
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState(MOTIVOS_FERRETERIA[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [desplegableMotivoAbierto, setDesplegableMotivoAbierto] = useState(false);
  const [busquedaMotivo, setBusquedaMotivo] = useState('');
  const refSelectorMotivo = useRef(null);

  // Cerrar selector al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickAfuera = (e) => {
      if (refSelectorMotivo.current && !refSelectorMotivo.current.contains(e.target)) {
        setDesplegableMotivoAbierto(false);
      }
    };
    const handleTecla = (e) => {
      if (e.key === 'Escape') {
        setDesplegableMotivoAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    document.addEventListener('keydown', handleTecla);
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('keydown', handleTecla);
    };
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [resProd, resKardex] = await Promise.all([
        api.get('/productos?limit=200'),
        api.get('/inventario/kardex?tipo=Ajuste&limit=30')
      ]);

      if (resProd.success) setProductos(resProd.productos || []);
      if (resKardex.success) setAjustesRecientes(resKardex.movimientos || []);
    } catch (e) {
      toast.error('Error al cargar datos de ajustes y mermas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSeleccionarProducto = (prod) => {
    setProductoSeleccionado(prod);
    setBusqProd(prod.nombre);
    setMostrarDropdown(false);
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado) {
      return toast.error('Selecciona un material o producto');
    }

    const cantNum = parseFloat(cantidad);
    if (!cantNum || cantNum <= 0) {
      return toast.error('Ingresa una cantidad válida mayor a cero');
    }

    const motivoFinal = motivo === 'Otro motivo (especificar)'
      ? motivoPersonalizado.trim()
      : motivo;

    if (!motivoFinal) {
      return toast.error('Especifica el motivo de la merma o ajuste');
    }

    setGuardando(true);
    try {
      const res = await api.post('/inventario/ajuste', {
        id_producto: productoSeleccionado.id,
        tipo: tipoAjuste,
        cantidad: cantNum,
        motivo: motivoFinal
      });

      if (res.success) {
        toast.success(res.message || 'Ajuste de inventario registrado');
        setProductoSeleccionado(null);
        setBusqProd('');
        setCantidad('1');
        setMotivoPersonalizado('');
        setDesplegableMotivoAbierto(false);
        setBusquedaMotivo('');
        cargarDatos();
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar ajuste');
    } finally {
      setGuardando(false);
    }
  };

  // Métricas rápidas de subfamilias / auditoría
  const totalAjustes = ajustesRecientes.length;
  const countMermas = ajustesRecientes.filter(a => a.tipo_movimiento === 'Salida' || a.tipo === 'Salida' || (a.motivo && !a.motivo.toLowerCase().includes('sobrante'))).length;
  const countSobrantes = ajustesRecientes.filter(a => a.tipo_movimiento === 'Entrada' || a.tipo === 'Entrada' || (a.motivo && a.motivo.toLowerCase().includes('sobrante'))).length;
  const countCemento = ajustesRecientes.filter(a => {
    const prod = (a.producto?.nombre || '').toLowerCase();
    const mot = (a.motivo || '').toLowerCase();
    return prod.includes('cemento') || mot.includes('cemento') || mot.includes('bolsa') || prod.includes('yeso');
  }).length;
  const countFierro = ajustesRecientes.filter(a => {
    const prod = (a.producto?.nombre || '').toLowerCase();
    const mot = (a.motivo || '').toLowerCase();
    return prod.includes('fierro') || prod.includes('cable') || prod.includes('alambre') || mot.includes('corte');
  }).length;

  const ajustesFiltrados = ajustesRecientes.filter(a => {
    if (filtroTipo === 'mermas') {
      return a.tipo_movimiento === 'Salida' || a.tipo === 'Salida' || (a.motivo && !a.motivo.toLowerCase().includes('sobrante'));
    }
    if (filtroTipo === 'sobrantes') {
      return a.tipo_movimiento === 'Entrada' || a.tipo === 'Entrada' || (a.motivo && a.motivo.toLowerCase().includes('sobrante'));
    }
    if (filtroTipo === 'cemento') {
      const prod = (a.producto?.nombre || '').toLowerCase();
      const mot = (a.motivo || '').toLowerCase();
      return prod.includes('cemento') || mot.includes('cemento') || mot.includes('bolsa') || prod.includes('yeso');
    }
    if (filtroTipo === 'fierro') {
      const prod = (a.producto?.nombre || '').toLowerCase();
      const mot = (a.motivo || '').toLowerCase();
      return prod.includes('fierro') || prod.includes('cable') || prod.includes('alambre') || mot.includes('corte');
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ─── PÍLDORAS DE FILTRO POR SUBFAMILIAS (ESTILO SLIM PRODUCTOS) ─── */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Subfamilias:
          </span>
          <button
            type="button"
            onClick={() => setFiltroTipo('todos')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filtroTipo === 'todos'
                ? 'bg-indigo-600 text-white shadow-2xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
          >
            <span>Todas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                filtroTipo === 'todos'
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {totalAjustes}
            </span>
          </button>

          {[
            { id: 'mermas', label: 'Mermas (- Salida)', count: countMermas },
            { id: 'sobrantes', label: 'Sobrantes (+ Entrada)', count: countSobrantes },
            { id: 'cemento', label: 'Cemento & Yeso', count: countCemento },
            { id: 'fierro', label: 'Fierro & Cables', count: countFierro }
          ].map(f => {
            const isSelected = filtroTipo === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFiltroTipo(f.id);
                  if (f.id === 'mermas') setTipoAjuste('Salida');
                  if (f.id === 'sobrantes') setTipoAjuste('Entrada');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-2xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
          {ajustesFiltrados.length} {ajustesFiltrados.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ─── FORMULARIO DE REGISTRO RÁPIDO (5 COLS) ─── */}
        <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Ajuste / Merma</h3>
              <p className="text-[11px] text-slate-400 font-medium">Impacta el stock y deja constancia en Kardex</p>
            </div>
          </div>

          <form onSubmit={handleRegistrar} className="space-y-3.5">
            {/* Buscador de Material */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Material / Producto a Ajustar <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cemento, fierro, pintura, tornillos..."
                  value={busqProd}
                  onChange={(e) => {
                    setBusqProd(e.target.value);
                    setMostrarDropdown(true);
                  }}
                  onFocus={() => setMostrarDropdown(true)}
                  className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                />
                {busqProd && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqProd('');
                      setProductoSeleccionado(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {mostrarDropdown && busqProd && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-slate-200 shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                  {productos
                    .filter(p => p.nombre.toLowerCase().includes(busqProd.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqProd)))
                    .slice(0, 7)
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSeleccionarProducto(p)}
                        className="p-2.5 hover:bg-amber-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{p.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Stock: {p.stock} {p.unidad_medida} • Ubic: {p.ubicacion || 'Almacén'}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold">
                          Elegir
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Ficha Resumen si ya está seleccionado */}
            {productoSeleccionado && (
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Stock Actual en Sistema:</span>
                  <span className="font-mono font-black text-amber-900 text-sm">
                    {productoSeleccionado.stock} {productoSeleccionado.unidad_medida}
                  </span>
                </div>
              </div>
            )}

            {/* Tipo de Ajuste */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Efecto en el Inventario
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTipoAjuste('Salida')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    tipoAjuste === 'Salida'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Minus className="w-3 h-3 shrink-0" />
                  <span>Merma (- Baja)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoAjuste('Entrada')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    tipoAjuste === 'Entrada'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Plus className="w-3 h-3 shrink-0" />
                  <span>Sobrante (+ Ingreso)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoAjuste('Ajuste')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                    tipoAjuste === 'Ajuste'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Conteo Físico</span>
                </button>
              </div>
            </div>

            {/* Cantidad y Calculadora de Discrepancia en Conteo Físico */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                {tipoAjuste === 'Ajuste'
                  ? `Conteo Físico Total en Estante (${productoSeleccionado?.unidad_medida || 'Unidad'})`
                  : `Cantidad a Operar (${productoSeleccionado?.unidad_medida || 'Unidad'})`}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />

              {/* Indicador de discrepancia en tiempo real para Conteo Físico */}
              {tipoAjuste === 'Ajuste' && productoSeleccionado && (
                <div className="mt-2 p-2.5 rounded-xl border text-xs">
                  {(() => {
                    const stockSys = parseFloat(productoSeleccionado.stock) || 0;
                    const stockReal = parseFloat(cantidad) || 0;
                    const diff = stockReal - stockSys;
                    if (diff < 0) {
                      return (
                        <div className="text-rose-700 bg-rose-50 border-rose-200/80 p-2 rounded-lg flex items-center justify-between">
                          <span className="font-semibold">Faltante detectado (Merma):</span>
                          <span className="font-mono font-black text-sm">{diff.toFixed(2)} {productoSeleccionado.unidad_medida}</span>
                        </div>
                      );
                    } else if (diff > 0) {
                      return (
                        <div className="text-emerald-700 bg-emerald-50 border-emerald-200/80 p-2 rounded-lg flex items-center justify-between">
                          <span className="font-semibold">Sobrante detectado:</span>
                          <span className="font-mono font-black text-sm">+{diff.toFixed(2)} {productoSeleccionado.unidad_medida}</span>
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-blue-700 bg-blue-50 border-blue-200/80 p-2 rounded-lg flex items-center justify-between">
                          <span className="font-semibold">Sin discrepancia:</span>
                          <span className="font-mono font-black text-sm">Coincide con sistema ({stockSys})</span>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>

            {/* Motivo Predefinido / Píldora Desplegable con Rediseño */}
            <div ref={refSelectorMotivo} className={`relative ${desplegableMotivoAbierto ? 'z-40' : 'z-10'}`}>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Causa / Motivo del Ajuste
              </label>

              {/* Botón Píldora Desplegable */}
              <button
                type="button"
                onClick={() => {
                  setDesplegableMotivoAbierto(!desplegableMotivoAbierto);
                  setBusquedaMotivo('');
                }}
                className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
                  desplegableMotivoAbierto
                    ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20 dark:bg-slate-800'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                }`}
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {motivo || '-- Seleccionar Motivo --'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    desplegableMotivoAbierto ? 'rotate-180 text-amber-600 dark:text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
              {desplegableMotivoAbierto && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  {MOTIVOS_FERRETERIA.length > 4 && (
                    <div className="relative p-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Buscar o filtrar motivo..."
                        value={busquedaMotivo}
                        onChange={(e) => setBusquedaMotivo(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
                    {(() => {
                      const filtrados = MOTIVOS_FERRETERIA.filter((m) => {
                        if (!busquedaMotivo.trim()) return true;
                        return m.toLowerCase().includes(busquedaMotivo.toLowerCase().trim());
                      });

                      if (filtrados.length === 0) {
                        return (
                          <div className="px-3 py-3 text-center text-xs text-slate-400">
                            No se encontraron motivos coincidentes
                          </div>
                        );
                      }

                      return filtrados.map((m) => {
                        const esSeleccionado = motivo === m;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setMotivo(m);
                              setDesplegableMotivoAbierto(false);
                              setBusquedaMotivo('');
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                              esSeleccionado
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className="truncate pr-2">{m}</span>
                            {esSeleccionado && (
                              <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {motivo === 'Otro motivo (especificar)' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Especificar Motivo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Detalla el motivo del ajuste..."
                  value={motivoPersonalizado}
                  onChange={(e) => setMotivoPersonalizado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={guardando || !productoSeleccionado}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <Check className="w-4 h-4" />
              <span>{guardando ? 'Procesando...' : 'Confirmar y Actualizar Kardex'}</span>
            </button>
          </form>
        </div>

        {/* ─── HISTORIAL RECIENTE DE AJUSTES & MERMAS (7 COLS) ─── */}
        <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Historial Reciente de Mermas</h3>
                <p className="text-[11px] text-slate-400 font-medium">Últimos movimientos de auditoría y desmedro</p>
              </div>
            </div>
            <button
              type="button"
              onClick={cargarDatos}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {cargando ? (
            <div className="p-8 text-center text-xs font-bold text-slate-400">
              Cargando historial de mermas...
            </div>
          ) : ajustesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No se han registrado mermas o ajustes manuales recientemente.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {ajustesFiltrados.map(a => (
                <div key={a.id} className="py-3 px-1 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-extrabold text-slate-900 truncate">
                      {a.producto?.nombre || 'Producto'}
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {a.motivo}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>{new Date(a.fecha).toLocaleDateString('es-PE')}</span>
                      <span>•</span>
                      <span>{a.usuario?.nombre || 'Sistema'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {parseFloat(a.cantidad)} {a.producto?.unidad_medida || 'UND'}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {a.stock_antes} → {a.stock_despues}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
