// apps/shell/src/pages/ConfiguracionView.jsx
import React, { useState } from 'react';
import {
  Printer,
  Server,
  Usb,
  CheckCircle2,
  AlertTriangle,
  Play,
  KeyRound,
  Save,
  Wifi,
  FileCode2,
  Layers,
  Building2,
  FileText,
  Sliders,
} from 'lucide-react';
import {
  imprimirTicketTermico,
  EscPosBuilder,
  useEmpresa,
  useAuthStore,
  useSettingsStore,
  getTerminalPrintSettings,
  saveTerminalPrintSettings,
} from '@heis/core';
import { UnifiedToast } from '@heis/ui';

export default function ConfiguracionView() {
  const { empresa, empresaActiva } = useEmpresa?.() || {};
  const { empresa: authEmpresa } = useAuthStore?.() || {};
  const activeEmpresa = empresaActiva || empresa || authEmpresa || {};

  const {
    businessName,
    businessRuc,
    address,
    phone,
    serieBoleta,
    serieFactura,
    updateSettings: updateGeneralSettings,
  } = useSettingsStore?.() || {};

  // Formulario de Terminal POS (Hardware Local de la Caja)
  const [form, setForm] = useState(() => getTerminalPrintSettings());

  // Formulario de Datos Comerciales y SUNAT
  const [fiscalForm, setFiscalForm] = useState({
    nombre: activeEmpresa?.nombre_comercial || activeEmpresa?.razon_social || businessName || 'HEIS SAC',
    ruc: activeEmpresa?.ruc || businessRuc || '20601234567',
    direccion: activeEmpresa?.direccion || address || 'Av. Principal 123 - Lima, Perú',
    telefono: activeEmpresa?.telefono || phone || '(01) 456-7890 / 998-765-432',
    serie_boleta: serieBoleta || 'B001',
    serie_factura: serieFactura || 'F001',
    igv_porcentaje: 18,
  });

  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'fiscal'
  const [probandoTicket, setProbandoTicket] = useState(false);
  const [probandoGaveta, setProbandoGaveta] = useState(false);
  const [verificandoBridge, setVerificandoBridge] = useState(false);
  const [estadoBridge, setEstadoBridge] = useState(null); // { ok: boolean, msg: string }
  const [toast, setToast] = useState(null);

  const handleGuardar = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    saveTerminalPrintSettings(form);

    if (updateGeneralSettings) {
      updateGeneralSettings({
        businessName: fiscalForm.nombre,
        businessRuc: fiscalForm.ruc,
        address: fiscalForm.direccion,
        phone: fiscalForm.telefono,
        serieBoleta: fiscalForm.serie_boleta,
        serieFactura: fiscalForm.serie_factura,
      });
    }

    setToast({
      type: 'success',
      message: 'Configuración guardada exitosamente para esta terminal POS.',
    });
  };

  // Verifica que el servidor XAMPP / PrintDoc.php local responda y permita Private Network Access (PNA)
  const handleVerificarBridgeLocal = async () => {
    setVerificandoBridge(true);
    setEstadoBridge(null);
    try {
      const response = await fetch(form.bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        targetAddressSpace: 'local',
        body: JSON.stringify({
          action: 'PING',
          printerName: form.printerName,
        }),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        setEstadoBridge({
          ok: true,
          msg: `Conectado correctamente a ${form.bridgeUrl} (Impresora: ${data.printer || form.printerName})`,
        });
      } else {
        setEstadoBridge({
          ok: false,
          msg: `El servidor respondió HTTP ${response.status}. Verifica PrintDoc.php.`,
        });
      }
    } catch (err) {
      setEstadoBridge({
        ok: false,
        msg: `Sin conexión con ${form.bridgeUrl}. Verifica que Apache/XAMPP esté activo y tenga cabeceras CORS/PNA.`,
      });
    } finally {
      setVerificandoBridge(false);
    }
  };

  // Ejecuta un Ticket de Prueba con QR Nativo ESC/POS y formato 58mm u 80mm
  const handleImprimirTicketPrueba = async () => {
    setProbandoTicket(true);
    try {
      saveTerminalPrintSettings(form);

      const ticketDemo = {
        formato: form.paperFormat,
        titulo_comprobante: 'TICKET DE PRUEBA - AUDITORIA POS',
        tipo_comprobante: '03',
        serie: fiscalForm.serie_boleta || 'B001',
        correlativo: 1,
        fecha_emision: new Date().toLocaleString('es-PE'),
        empresa: {
          nombre_comercial: fiscalForm.nombre,
          razon_social: activeEmpresa?.razon_social || fiscalForm.nombre,
          ruc: fiscalForm.ruc,
          direccion: fiscalForm.direccion,
          telefono: fiscalForm.telefono,
        },
        cliente: {
          nombre: 'CLIENTE DE PRUEBA TERMICA',
          documento: '00000000',
        },
        items: [
          {
            cantidad: 1,
            nombre: `TEST ANCHO ${form.paperFormat.toUpperCase()} (${
              form.paperFormat === '58mm' ? '32 COL' : '48 COL'
            })`,
            precio_unitario: 10.0,
            subtotal: 10.0,
          },
          {
            cantidad: 2,
            nombre: 'VALIDACION CODIGO QR ESC/POS NATIVO',
            precio_unitario: 5.9,
            subtotal: 11.8,
          },
        ],
        op_gravadas: 18.47,
        igv: 3.33,
        total: 21.8,
        monto_letras: 'VEINTIUNO CON 80/100 SOLES',
        metodo_pago: 'EFECTIVO / PRUEBA',
        hash_cpe: 'x8Km9P2vQ7L1wZ4rT6yU0nB3cV5=',
      };

      const res = await imprimirTicketTermico(ticketDemo, {
        formato: form.paperFormat,
        metodo: form.printMethod,
        bridgeUrl: form.bridgeUrl,
        printerName: form.printerName,
        abrirGaveta: form.openCashDrawer,
      });

      setToast({
        type: 'success',
        message: `Ticket de prueba (${form.paperFormat}) enviado vía ${res?.mode || 'SISTEMA'}.`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: `Error al imprimir prueba: ${err.message}`,
      });
    } finally {
      setProbandoTicket(false);
    }
  };

  // Envía únicamente el pulso eléctrico RJ11 (ESC p 0 25 250) para abrir la gaveta sin gastar papel
  const handleProbarSoloGaveta = async () => {
    setProbandoGaveta(true);
    try {
      const builder = new EscPosBuilder(form.paperFormat).init().openCashDrawer();
      const response = await fetch(form.bridgeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        targetAddressSpace: 'local',
        body: JSON.stringify({
          printerName: form.printerName,
          rawEscPosBase64: builder.toBase64(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setToast({
        type: 'success',
        message: 'Pulso RJ11 enviado a la gaveta de dinero correctamente.',
      });
    } catch (err) {
      setToast({
        type: 'error',
        message: `No se pudo disparar la gaveta vía puente local: ${err.message}`,
      });
    } finally {
      setProbandoGaveta(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 text-slate-100">
      {toast && (
        <UnifiedToast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Printer className="w-6 h-6 text-indigo-400" />
            <span>Configuración de Terminal POS & Sistema</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ajusta el hardware de caja (58mm/80mm, PrintDoc.php, gaveta RJ11) y parámetros fiscales de la empresa.
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === 'pos'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Hardware POS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              activeTab === 'fiscal'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Datos Fiscales</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleGuardar} className="space-y-6">
        {activeTab === 'pos' ? (
          <>
            {/* 1. Selección de Formato de Papel (58mm vs 80mm) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>1. Formato de Papel de la Ticketera</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: '80mm',
                    title: 'Estándar 80mm (48 Columnas / 576 dots)',
                    desc: 'Ideal para cajas principales, restaurantes (comandas KDS) y facturación detallada con QR tamaño 5.',
                  },
                  {
                    id: '58mm',
                    title: 'Compacto 58mm (32 Columnas / 384 dots)',
                    desc: 'Ideal para ticketeras portátiles Bluetooth/USB o puntos de venta rápidos con QR compacto tamaño 4.',
                  },
                ].map((option) => (
                  <label
                    key={option.id}
                    onClick={() => setForm({ ...form, paperFormat: option.id })}
                    className={`cursor-pointer p-4 rounded-xl border transition flex items-start gap-3.5 ${
                      form.paperFormat === option.id
                        ? 'bg-indigo-600/15 border-indigo-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paperFormat"
                      value={option.id}
                      checked={form.paperFormat === option.id}
                      onChange={() => {}}
                      className="mt-1 accent-indigo-500"
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-100">{option.title}</div>
                      <p className="text-xs text-slate-400 mt-1">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Método de Transporte e Impresión Silenciosa */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>2. Motor de Despacho (Sin Diálogo Pesado del Navegador)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    id: 'AUTO',
                    label: 'Automático Inteligente',
                    sub: 'Bridge Local ➔ WebSerial ➔ Iframe',
                    icon: Wifi,
                  },
                  {
                    id: 'BRIDGE_LOCAL',
                    label: 'Servidor Local (PrintDoc.php)',
                    sub: 'XAMPP / Agente Local ESC/POS',
                    icon: Server,
                  },
                  {
                    id: 'WEB_SERIAL',
                    label: 'Puerto Directo USB/Serial',
                    sub: 'Hardware WebSerial API',
                    icon: Usb,
                  },
                  {
                    id: 'IFRAME',
                    label: 'Web Print Silencioso',
                    sub: 'Iframe oculto CSS @page',
                    icon: FileCode2,
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setForm({ ...form, printMethod: m.id })}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                        form.printMethod === m.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-indigo-400 mb-1.5" />
                      <div className="text-xs font-semibold text-slate-100">{m.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{m.sub}</div>
                    </button>
                  );
                })}
              </div>

              {/* Parámetros del Puente Local (XAMPP / PrintDoc.php) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    URL del Puente Local de Impresión (<code className="text-indigo-300">SERVER_PRINTPOS / PrintDoc.php</code>)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={form.bridgeUrl}
                      onChange={(e) => setForm({ ...form, bridgeUrl: e.target.value })}
                      placeholder="http://127.0.0.1/SERVER_PRINTPOS/PrintDoc.php"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerificarBridgeLocal}
                      disabled={verificandoBridge}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium whitespace-nowrap transition cursor-pointer disabled:opacity-50"
                    >
                      {verificandoBridge ? 'Probando...' : 'Probar Ping'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre de Impresora Compartida (SO)
                  </label>
                  <input
                    type="text"
                    value={form.printerName}
                    onChange={(e) => setForm({ ...form, printerName: e.target.value })}
                    placeholder="POS-80"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {estadoBridge && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    estadoBridge.ok
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {estadoBridge.ok ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{estadoBridge.msg}</span>
                </div>
              )}

              {/* Switch de Gaveta de Dinero */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                <div>
                  <div className="text-sm font-medium text-slate-200">
                    Enviar pulso automático de apertura de gaveta (RJ11 - Pin 2) al cobrar
                  </div>
                  <p className="text-xs text-slate-400">
                    Inyecta la secuencia binaria <code className="text-indigo-300">ESC p 0 25 250</code> al inicio del ticket.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.openCashDrawer}
                  onChange={(e) => setForm({ ...form, openCashDrawer: e.target.checked })}
                  className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Barra de Acciones y Diagnóstico de Hardware */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleImprimirTicketPrueba}
                  disabled={probandoTicket}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {probandoTicket
                      ? 'Imprimiendo...'
                      : `Imprimir Ticket de Prueba (${form.paperFormat})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleProbarSoloGaveta}
                  disabled={probandoGaveta}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{probandoGaveta ? 'Disparando...' : 'Probar Apertura de Gaveta'}</span>
                </button>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar en esta Terminal</span>
              </button>
            </div>
          </>
        ) : (
          /* Pestaña Fiscal y Comercial */
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Datos Fiscales y Comerciales</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Razón Social / Nombre Comercial
                  </label>
                  <input
                    type="text"
                    value={fiscalForm.nombre}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, nombre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Número de RUC
                  </label>
                  <input
                    type="text"
                    value={fiscalForm.ruc}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, ruc: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Dirección Fiscal
                  </label>
                  <input
                    type="text"
                    value={fiscalForm.direccion}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, direccion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={fiscalForm.telefono}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Facturación Electrónica SUNAT & Comprobantes</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Serie Boleta Electrónica
                  </label>
                  <input
                    type="text"
                    value={fiscalForm.serie_boleta}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, serie_boleta: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Serie Factura Electrónica
                  </label>
                  <input
                    type="text"
                    value={fiscalForm.serie_factura}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, serie_factura: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">
                    Tasa IGV (%)
                  </label>
                  <input
                    type="number"
                    value={fiscalForm.igv_porcentaje}
                    onChange={(e) => setFiscalForm({ ...fiscalForm, igv_porcentaje: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Parámetros Fiscales</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
