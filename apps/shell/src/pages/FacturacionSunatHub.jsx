import React, { useState, useEffect, useMemo } from 'react';
import { api, consultarDocumento, useAuthStore } from '@heis/core';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  QrCode,
  Building2,
  Receipt,
  Code2,
  Sparkles,
  X
} from 'lucide-react';

export default function FacturacionSunatHub() {
  const { empresa } = useAuthStore();
  const [comprobantes, setComprobantes] = useState([]);
  const [resumen, setResumen] = useState({
    total_comprobantes: 0,
    total_facturado: 0,
    total_igv: 0,
    total_gravadas: 0,
    aceptados: 0,
    notas_credito: 0,
  });
  const [loading, setLoading] = useState(true);

  const [filtroModulo, setFiltroModulo] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  const [modalEmitir, setModalEmitir] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [buscandoDoc, setBuscandoDoc] = useState(false);
  const [nuevoCpe, setNuevoCpe] = useState({
    tipo_comprobante: 'Factura',
    origen_modulo: empresa?.modulos_activos?.[0] || 'general',
    cliente_documento: '',
    cliente_nombre: '',
    cliente_direccion: '',
    concepto: 'SERVICIO / VENTA COMERCIAL',
    cantidad: 1,
    precio_unitario: '',
  });

  const cargarComprobantes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/core/facturacion/comprobantes', {
        params: {
          origen_modulo: filtroModulo,
          tipo_comprobante: filtroTipo,
          search: busqueda || undefined,
        },
      });
      if (res.data?.success) {
        setComprobantes(res.data.data || []);
        if (res.data.resumen) setResumen(res.data.resumen);
      }
    } catch (error) {
      toast.error('Error al cargar comprobantes electrónicos SUNAT');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarComprobantes();
  }, [filtroModulo, filtroTipo]);

  const comprobantesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return comprobantes;
    const q = busqueda.toLowerCase().trim();
    return comprobantes.filter(
      (c) =>
        c.numero_formato?.toLowerCase().includes(q) ||
        c.cliente_razon_social?.toLowerCase().includes(q) ||
        c.cliente_num_doc?.toLowerCase().includes(q)
    );
  }, [comprobantes, busqueda]);

  const handleBuscarRucDni = async () => {
    const doc = nuevoCpe.cliente_documento.trim();
    if (doc.length !== 8 && doc.length !== 11) {
      toast.error('Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido');
      return;
    }
    try {
      setBuscandoDoc(true);
      const tipo = doc.length === 11 ? 'ruc' : 'dni';
      const res = await consultarDocumento(tipo, doc);
      const info = res?.data || res;
      if (info) {
        setNuevoCpe((prev) => ({
          ...prev,
          cliente_nombre: info.razon_social || info.nombre_completo || info.nombres || prev.cliente_nombre,
          cliente_direccion: info.direccion || prev.cliente_direccion,
        }));
        toast.success('Datos obtenidos desde padrón SUNAT/RENIEC');
      }
    } catch (err) {
      toast.error('No se encontró el documento, puede ingresar el nombre manualmente');
    } finally {
      setBuscandoDoc(false);
    }
  };

  const handleEmitirDirecto = async (e) => {
    e.preventDefault();
    const precio = parseFloat(nuevoCpe.precio_unitario);
    if (!precio || precio <= 0) {
      toast.error('Ingrese un importe válido mayor a S/ 0.00');
      return;
    }
    if (nuevoCpe.tipo_comprobante === 'Factura' && nuevoCpe.cliente_documento.trim().length !== 11) {
      toast.error('Para emitir Factura Electrónica el RUC debe tener 11 dígitos');
      return;
    }

    try {
      setEmitiendo(true);
      const res = await api.post('/core/facturacion/emitir', {
        tipo_comprobante: nuevoCpe.tipo_comprobante,
        origen_modulo: nuevoCpe.origen_modulo,
        cliente_documento: nuevoCpe.cliente_documento.trim() || '00000000',
        cliente_nombre: nuevoCpe.cliente_nombre.trim() || 'CLIENTE VARIOS',
        cliente_direccion: nuevoCpe.cliente_direccion.trim(),
        items: [
          {
            descripcion: nuevoCpe.concepto.trim() || 'VENTA COMERCIAL',
            cantidad: Number(nuevoCpe.cantidad) || 1,
            precio_unitario: precio,
          },
        ],
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Comprobante UBL 2.1 emitido y aceptado');
        setModalEmitir(false);
        setNuevoCpe((prev) => ({
          ...prev,
          cliente_documento: '',
          cliente_nombre: '',
          cliente_direccion: '',
          precio_unitario: '',
        }));
        cargarComprobantes();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al emitir comprobante electrónico');
    } finally {
      setEmitiendo(false);
    }
  };

  const handleEmitirNotaCredito = async (cpe) => {
    const motivo = window.prompt(
      `Emitir Nota de Crédito Electrónica (07) para anular ${cpe.numero_formato}.\nIngrese el motivo de sustento SUNAT:`,
      'Anulación de la operación'
    );
    if (!motivo) return;

    try {
      const res = await api.post(`/core/facturacion/comprobantes/${cpe.id}/nota-credito`, {
        motivo,
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        cargarComprobantes();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al emitir Nota de Crédito');
    }
  };

  const handleDescargarArchivo = async (id, tipo, numeroFormato) => {
    try {
      const res = await api.get(`/core/facturacion/comprobantes/${id}/${tipo}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/xml' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo === 'cdr' ? 'R-' : ''}${numeroFormato}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Archivo ${tipo.toUpperCase()} descargado`);
    } catch (error) {
      toast.error(`No se pudo descargar el ${tipo.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-5 max-w-[1440px] mx-auto pb-8">
      {/* Cabecera */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <FileText className="w-5 h-5"/>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-heading">
                Facturación Electrónica SUNAT (UBL 2.1)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Entorno {(empresa?.entorno_sunat || 'beta').toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Central unificada de Facturas (01), Boletas (03), Notas de Crédito (07), XML Firmado y CDR para todos tus módulos activos
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalEmitir(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
        >
          <PlusCircle className="w-4 h-4"/>
          <span>Emitir Comprobante CPE</span>
        </button>
      </div>

      {/* KPIs Tributarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Facturado Válido</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            S/ {Number(resumen.total_facturado).toFixed(2)}
          </div>
          <span className="text-[11px] text-emerald-500 font-semibold">
            Gravadas: S/ {Number(resumen.total_gravadas).toFixed(2)}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">IGV (18%) Acumulado</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
            S/ {Number(resumen.total_igv).toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">Impuesto General a las Ventas</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CPE Aceptados SUNAT</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {resumen.aceptados} / {resumen.total_comprobantes}
          </div>
          <span className="text-[11px] text-slate-400">Con CDR código 0 y Hash SHA-256</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notas de Crédito (07)</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {resumen.notas_credito}
          </div>
          <span className="text-[11px] text-slate-400">Anulaciones electrónicas vinculadas</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar serie F001/B001, RUC, DNI o cliente..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select
            value={filtroModulo}
            onChange={(e) => setFiltroModulo(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Módulos</option>
            <option value="restaurante">Restaurante</option>
            <option value="ferreteria">Ferretería</option>
            <option value="botica">Botica</option>
            <option value="hospedaje">Hospedaje</option>
            <option value="general">Emisión Directa</option>
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="Factura">Facturas (01)</option>
            <option value="Boleta">Boletas (03)</option>
            <option value="NotaCredito">Notas de Crédito (07)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Comprobantes */}
      <div className="rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/70 dark:border-white/10 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/60 dark:bg-white/[0.02]">
                <th className="py-3.5 px-4">Comprobante</th>
                <th className="py-3.5 px-4">Módulo Origen</th>
                <th className="py-3.5 px-4">Cliente / Receptor</th>
                <th className="py-3.5 px-4 text-right">Gravada</th>
                <th className="py-3.5 px-4 text-right">IGV</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Estado SUNAT</th>
                <th className="py-3.5 px-4 text-right">Descargas & Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-white/5 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    Cargando comprobantes electrónicos UBL 2.1...
                  </td>
                </tr>
              ) : comprobantesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold">
                    No se encontraron comprobantes electrónicos registrados.
                  </td>
                </tr>
              ) : (
                comprobantesFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900 dark:text-white font-mono">
                        {c.numero_formato}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.tipo_comprobante} ({c.tipo_documento_codigo}) • {new Date(c.fecha_emision).toLocaleString()}
                      </div>
                      {c.doc_referencia_serie_num && (
                        <div className="text-[10px] text-amber-500 font-bold">
                          Ref: {c.doc_referencia_serie_num}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                        {c.origen_modulo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                        {c.cliente_razon_social}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Doc: {c.cliente_num_doc}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      S/ {Number(c.op_gravadas).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      S/ {Number(c.igv).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      S/ {Number(c.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.sunat_estado === 'ACEPTADO'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {c.sunat_estado === 'ACEPTADO' ? (
                          <CheckCircle2 className="w-3 h-3"/>
                        ) : (
                          <XCircle className="w-3 h-3"/>
                        )}
                        {c.sunat_estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleDescargarArchivo(c.id, 'xml', c.numero_formato)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                          title="Descargar XML UBL 2.1 Firmado"
                        >
                          <Code2 className="w-3.5 h-3.5 text-indigo-500"/>
                          <span>XML</span>
                        </button>
                        <button
                          onClick={() => handleDescargarArchivo(c.id, 'cdr', c.numero_formato)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                          title="Descargar Constancia de Recepción CDR SUNAT"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500"/>
                          <span>CDR</span>
                        </button>
                        {c.sunat_estado === 'ACEPTADO' && c.tipo_comprobante !== 'NotaCredito' && (
                          <button
                            onClick={() => handleEmitirNotaCredito(c)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 cursor-pointer"
                            title="Emitir Nota de Crédito Electrónica (07)"
                          >
                            <RotateCcw className="w-3.5 h-3.5"/>
                            <span>NC</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Emisión Rápida CPE */}
      {modalEmitir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500"/>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Emitir Comprobante Electrónico UBL 2.1
                </h2>
              </div>
              <button
                onClick={() => setModalEmitir(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <form onSubmit={handleEmitirDirecto} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tipo de Comprobante
                  </label>
                  <select
                    value={nuevoCpe.tipo_comprobante}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, tipo_comprobante: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold"
                  >
                    <option value="Factura">Factura Electrónica (F001)</option>
                    <option value="Boleta">Boleta de Venta (B001)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Módulo de Origen
                  </label>
                  <select
                    value={nuevoCpe.origen_modulo}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, origen_modulo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-bold"
                  >
                    <option value="general">General / Corporativo</option>
                    <option value="restaurante">Restaurante</option>
                    <option value="ferreteria">Ferretería</option>
                    <option value="botica">Botica</option>
                    <option value="hospedaje">Hospedaje</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {nuevoCpe.tipo_comprobante === 'Factura' ? 'Número de RUC (11 dígitos)' : 'DNI / Documento Cliente'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoCpe.cliente_documento}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, cliente_documento: e.target.value })}
                    placeholder={nuevoCpe.tipo_comprobante === 'Factura' ? '20601234567' : '70123456'}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleBuscarRucDni}
                    disabled={buscandoDoc}
                    className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer"
                  >
                    {buscandoDoc ? 'Consultando...' : 'Consultar SUNAT'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Razón Social o Nombre Completo
                </label>
                <input
                  type="text"
                  value={nuevoCpe.cliente_nombre}
                  onChange={(e) => setNuevoCpe({ ...nuevoCpe, cliente_nombre: e.target.value })}
                  placeholder="CLIENTE VARIOS"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Descripción del Concepto / Ítem
                  </label>
                  <input
                    type="text"
                    value={nuevoCpe.concepto}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, concepto: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Importe Total (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={nuevoCpe.precio_unitario}
                    onChange={(e) => setNuevoCpe({ ...nuevoCpe, precio_unitario: e.target.value })}
                    placeholder="100.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEmitir(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emitiendo}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  {emitiendo ? 'Firmando XML...' : 'Firmar y Emitir a SUNAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
