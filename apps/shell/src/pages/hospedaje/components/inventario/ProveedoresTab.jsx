import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Trash2,
  Receipt,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../../api';
import ModalProveedor from './ModalProveedor';
import { notificarExito, notificarError } from '../../utils/notificaciones';

export default function ProveedoresTab({ esAdmin }) {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      setCargando(true);
      const res = await api.get('/proveedores');
      setProveedores(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      notificarError('Error', 'No se pudieron cargar los proveedores.');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (p) => {
    if (!window.confirm(`¿Deseas desactivar al proveedor ${p.razon_social}?`)) return;
    try {
      await api.delete(`/proveedores/${p.id}`);
      notificarExito('Proveedor desactivado', p.razon_social);
      cargarProveedores();
    } catch (err) {
      notificarError('Error al desactivar proveedor');
    }
  };

  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      (p.razon_social && p.razon_social.toLowerCase().includes(q)) ||
      (p.ruc && p.ruc.includes(q)) ||
      (p.contacto_nombre && p.contacto_nombre.toLowerCase().includes(q)) ||
      (p.categoria_suministros && p.categoria_suministros.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4 font-sora">
      {/* Barra Superior con Métricas y Buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar proveedor por RUC, razón social o categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="button"
            onClick={cargarProveedores}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Recargar directorio"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {esAdmin && (
          <button
            type="button"
            onClick={() => {
              setProveedorEditando(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
        )}
      </div>

      {/* Grid de Proveedores */}
      {cargando ? (
        <div className="py-12 text-center text-xs text-slate-400">
          Cargando directorio de proveedores...
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-2">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No se encontraron proveedores
          </h3>
          <p className="text-xs text-slate-400">
            {busqueda ? 'Ningún proveedor coincide con tu búsqueda.' : 'Aún no tienes proveedores registrados en el sistema.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {proveedoresFiltrados.map((p) => {
            const comprasCount = p.compras?.length || 0;
            const totalComprado = (p.compras || []).reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs hover:border-blue-200 dark:hover:border-blue-800/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-block mb-1">
                        RUC {p.ruc}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={p.razon_social}>
                        {p.razon_social}
                      </h4>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {p.categoria_suministros || 'General'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {p.contacto_nombre && (
                      <p className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-400 font-medium">Contacto:</span>
                        <strong className="text-slate-700 dark:text-slate-200">{p.contacto_nombre}</strong>
                      </p>
                    )}
                    {p.telefono && (
                      <p className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{p.telefono}</span>
                      </p>
                    )}
                    {p.email && (
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-blue-500" />
                        <span>{p.email}</span>
                      </p>
                    )}
                    {p.direccion && (
                      <p className="flex items-center gap-1.5 truncate text-[10.5px]">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{p.direccion}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[10px]">
                    <span className="text-slate-400 block font-medium">Historial compras</span>
                    <strong className="font-mono text-slate-800 dark:text-white font-bold">
                      {comprasCount} {comprasCount === 1 ? 'factura' : 'facturas'} (S/ {totalComprado.toFixed(2)})
                    </strong>
                  </div>

                  {esAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProveedorEditando(p);
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                        title="Editar proveedor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminar(p)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Desactivar proveedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <ModalProveedor
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setProveedorEditando(null);
          }}
          proveedor={proveedorEditando}
          onSuccess={cargarProveedores}
        />
      )}
    </div>
  );
}

