import React, { useState, useEffect } from 'react';
import api from './api';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  Layers,
  BookOpen,
  Filter,
  CheckCircle2,
  Printer,
  FileText,
  UserCheck,
  Stethoscope,
  Pill,
  Sparkles,
  RefreshCw,
  Building2,
  ShieldAlert,
  Users,
  X
} from 'lucide-react';
import DropdownPill from './components/DropdownPill';

export default function KardexSunat() {
  const [tabActiva, setTabActiva] = useState('kardex'); // 'kardex' | 'recetas'

  // Estados para el Kardex Valorizado
  const [medicamentos, setMedicamentos] = useState([]);
  const [medSeleccionado, setMedSeleccionado] = useState('');
  const [busquedaMed, setBusquedaMed] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [kardexData, setKardexData] = useState(null);
  const [cargandoKardex, setCargandoKardex] = useState(false);

  // Estados para el Libro de Recetas Retenidas
  const [recetas, setRecetas] = useState([]);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);
  const [filtroTipoControlado, setFiltroTipoControlado] = useState('todos');
  const [fechaInicioRecetas, setFechaInicioRecetas] = useState('');
  const [fechaFinRecetas, setFechaFinRecetas] = useState('');
  const [busquedaReceta, setBusquedaReceta] = useState('');

  // Estados para el Balance Trimestral DIGEMID (D.S. 023-2001-SA)
  const [anioBalance, setAnioBalance] = useState(new Date().getFullYear());
  const [trimestreBalance, setTrimestreBalance] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [balanceData, setBalanceData] = useState(null);
  const [cargandoBalance, setCargandoBalance] = useState(false);
  const [filtroSustancia, setFiltroSustancia] = useState('');

  // Cargar catálogo de medicamentos para el selector del Kardex
  useEffect(() => {
    const fetchMedicamentos = async () => {
      try {
        const res = await api.get('/medicamentos', { params: { limit: 100 } });
        const list = res?.medicamentos || res?.data || [];
        if (Array.isArray(list)) {
          setMedicamentos(list);
          if (list.length > 0 && !medSeleccionado) {
            setMedSeleccionado(list[0].id);
          }
        }
      } catch (err) {
        // Ignorar
      }
    };
    fetchMedicamentos();
  }, []);

  // Consultar Kardex Valorizado cuando cambia el medicamento o fechas
  const consultarKardex = async () => {
    if (!medSeleccionado) return;
    try {
      setCargandoKardex(true);
      const params = { id_medicamento: medSeleccionado };
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await api.get('/kardex/valorizado', { params });
      if (res && res.success) {
        setKardexData(res);
      }
    } catch (err) {
      toast.error('Error al cargar datos del Kardex Valorizado.');
    } finally {
      setCargandoKardex(false);
    }
  };

  useEffect(() => {
    if (medSeleccionado && tabActiva === 'kardex') {
      consultarKardex();
    }
  }, [medSeleccionado, tabActiva]);

  // Cargar Libro de Recetas Retenidas
  const consultarRecetas = async () => {
    try {
      setCargandoRecetas(true);
      const params = {};
      if (fechaInicioRecetas) params.fecha_inicio = fechaInicioRecetas;
      if (fechaFinRecetas) params.fecha_fin = fechaFinRecetas;

      const res = await api.get('/kardex/libro-recetas', { params });
      if (res && res.success) {
        setRecetas(res.registros || []);
      }
    } catch (err) {
      toast.error('Error al consultar el libro de recetas.');
    } finally {
      setCargandoRecetas(false);
    }
  };

  useEffect(() => {
    if (tabActiva === 'recetas') {
      consultarRecetas();
    }
  }, [tabActiva]);

  // Filtrado de recetas en memoria (búsqueda y tipo controlado)
  const recetasFiltradas = (recetas || []).filter((r) => {
    if (busquedaReceta && busquedaReceta.trim()) {
      const q = busquedaReceta.toLowerCase().trim();
      const match =
        r.pacienteNombre?.toLowerCase().includes(q) ||
        r.pacienteDni?.toLowerCase().includes(q) ||
        r.medicoNombre?.toLowerCase().includes(q) ||
        r.medicoCmp?.toLowerCase().includes(q) ||
        r.numeroReceta?.toLowerCase().includes(q) ||
        r.medicamento?.toLowerCase().includes(q) ||
        r.dci?.toLowerCase().includes(q) ||
        r.comprobante?.toLowerCase().includes(q) ||
        r.lote?.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filtroTipoControlado && filtroTipoControlado !== 'todos') {
      if (r.tipoControlado !== filtroTipoControlado) return false;
    }

    return true;
  });

  // Descargar CSV oficial Formato SUNAT 13.1
  const descargarKardexSunat = () => {
    if (!medSeleccionado) {
      toast.error('Selecciona un medicamento primero.');
      return;
    }
    let url = `${api.defaults.baseURL || '/api'}/kardex/exportar-sunat?id_medicamento=${medSeleccionado}`;
    if (fechaInicio) url += `&fecha_inicio=${fechaInicio}`;
    if (fechaFin) url += `&fecha_fin=${fechaFin}`;

    window.open(url, '_blank');
    toast.success('Descargando Formato Oficial SUNAT 13.1 (.csv)...');
  };

  // Imprimir Libro Oficial de Recetas
  const imprimirLibroRecetas = () => {
    if (!recetasFiltradas || recetasFiltradas.length === 0) {
      toast.error('No hay recetas para imprimir con los filtros seleccionados.');
      return;
    }
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Libro Oficial de Recetas Retenidas y Psicotrópicos - DIGEMID</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 8.5px; color: #0f172a; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 6px; margin-bottom: 10px; }
          .title { font-size: 13px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 9px; color: #64748b; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 5px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; text-align: center; font-size: 8px; }
          .footer-firmas { margin-top: 35px; display: flex; justify-content: space-around; text-align: center; }
          .firma-box { width: 220px; border-top: 1px solid #334155; padding-top: 5px; font-size: 8.5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">LIBRO OFICIAL DE CONTROL DE RECETAS MÉDICAS RETENIDAS Y PSICOTRÓPICOS</p>
          <p class="subtitle">D.S. N° 023-2001-SA (SUSTANCIAS FISCALIZADAS) Y ART. 38 DEL D.S. N° 014-2011-SA / DIGEMID ${fechaInicioRecetas || fechaFinRecetas ? `• PERIODO: ${fechaInicioRecetas || 'Inicio'} al ${fechaFinRecetas || 'Corte'}` : ''}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 20px;">#</th>
              <th>FECHA</th>
              <th>COMPROBANTE</th>
              <th>N° RECETA</th>
              <th>PACIENTE</th>
              <th>DNI</th>
              <th>MÉDICO PRESCRIPTOR</th>
              <th>C.M.P.</th>
              <th>MEDICAMENTO & CONCENTRACIÓN</th>
              <th>LOTE</th>
              <th>VENCE</th>
              <th>CANT.</th>
              <th>DISPENSADO POR</th>
            </tr>
          </thead>
          <tbody>
            ${recetasFiltradas.map((r, i) => `
              <tr>
                <td style="text-align: center;">${i + 1}</td>
                <td>${r.fecha}</td>
                <td>${r.comprobante}</td>
                <td style="font-weight: bold; font-family: monospace;">${r.numeroReceta}</td>
                <td>${r.pacienteNombre}</td>
                <td>${r.pacienteDni}</td>
                <td>${r.medicoNombre}</td>
                <td style="font-family: monospace;">${r.medicoCmp}</td>
                <td><strong>${r.medicamento}</strong> ${r.concentracion}</td>
                <td style="font-family: monospace;">${r.lote}</td>
                <td>${r.vencimiento}</td>
                <td style="font-weight: bold; text-align: right;">${r.cantidad} ${r.formato}</td>
                <td>${r.dispensadoPor}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-firmas">
          <div class="firma-box">
            <br><br>
            <strong>QUÍMICO FARMACÉUTICO</strong><br>
            Director Técnico / Reg. CQFP
          </div>
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    setTimeout(() => ventana.print(), 500);
  };

  // Exportar Libro de Recetas Retenidas a CSV Oficial
  const exportarRecetasCSV = () => {
    if (!recetasFiltradas || recetasFiltradas.length === 0) {
      toast.error('No hay recetas para exportar con los filtros seleccionados.');
      return;
    }
    const cabecera = [
      'LIBRO OFICIAL DE CONTROL DE RECETAS MÉDICAS RETENIDAS Y PSICOTRÓPICOS',
      'NORMATIVA: D.S. N° 023-2001-SA Y ART. 38 DEL D.S. N° 014-2011-SA / DIGEMID',
      `FECHA DE EMISIÓN: ${new Date().toLocaleDateString('es-PE')}`,
      `PERIODO: ${fechaInicioRecetas || 'Histórico'} al ${fechaFinRecetas || 'Hoy'}`,
      ''
    ];
    const columnas = [
      'FECHA',
      'COMPROBANTE',
      'NUMERO_RECETA',
      'PACIENTE_NOMBRE',
      'PACIENTE_DNI',
      'MEDICO_PRESCRIPTOR',
      'MEDICO_CMP',
      'MEDICAMENTO',
      'DCI',
      'CONCENTRACION',
      'LOTE',
      'VENCIMIENTO',
      'CANTIDAD',
      'FORMATO',
      'DISPENSADO_POR'
    ].join(';');

    const filas = recetasFiltradas.map((r) => [
      `"${r.fecha || ''}"`,
      `"${r.comprobante || ''}"`,
      `"${r.numeroReceta || ''}"`,
      `"${r.pacienteNombre || ''}"`,
      `"${r.pacienteDni || ''}"`,
      `"${r.medicoNombre || ''}"`,
      `"${r.medicoCmp || ''}"`,
      `"${r.medicamento || ''}"`,
      `"${r.dci || ''}"`,
      `"${r.concentracion || ''}"`,
      `"${r.lote || ''}"`,
      `"${r.vencimiento || ''}"`,
      `"${r.cantidad || 0}"`,
      `"${r.formato || ''}"`,
      `"${r.dispensadoPor || ''}"`
    ].join(';'));

    const csvContent = '\uFEFF' + [...cabecera, columnas, ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Libro_Recetas_Retenidas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Libro de recetas exportado a CSV exitosamente.');
  };

  // Cargar Balance Trimestral de Psicotrópicos y Estupefacientes
  const consultarBalance = async () => {
    try {
      setCargandoBalance(true);
      const res = await api.get('/kardex/balance-trimestral', {
        params: { anio: anioBalance, trimestre: trimestreBalance }
      });
      if (res && res.success) {
        setBalanceData(res);
      }
    } catch (err) {
      toast.error('Error al consultar Balance Trimestral de Psicotrópicos.');
    } finally {
      setCargandoBalance(false);
    }
  };

  useEffect(() => {
    if (tabActiva === 'balance') {
      consultarBalance();
    }
  }, [tabActiva, anioBalance, trimestreBalance]);

  // Exportar Excel oficial DIGEMID
  const exportarBalanceExcel = async () => {
    try {
      toast.loading('Generando archivo oficial Excel DIGEMID...', { id: 'export-balance' });
      const res = await api.get('/kardex/balance-trimestral/exportar-excel', {
        params: { anio: anioBalance, trimestre: trimestreBalance },
        responseType: 'blob'
      });
      const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Balance_Trimestral_DIGEMID_Q${trimestreBalance}_${anioBalance}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Excel DIGEMID descargado exitosamente', { id: 'export-balance' });
    } catch (e) {
      toast.error('Error al descargar Excel de Balance', { id: 'export-balance' });
    }
  };

  // Imprimir Balance Oficial Foliado
  const imprimirBalance = () => {
    if (!balanceData || !balanceData.items) {
      toast.error('No hay datos para imprimir en el periodo seleccionado.');
      return;
    }

    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
      <head>
        <title>Balance Trimestral de Psicotrópicos y Estupefacientes - DIGEMID</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          body { font-family: Arial, sans-serif; font-size: 8px; color: #0f172a; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #0f766e; padding-bottom: 5px; margin-bottom: 8px; text-align: center; }
          .title { font-size: 11px; font-weight: bold; color: #0f766e; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 9px; color: #334155; font-weight: bold; margin-top: 2px; }
          table.data { width: 100%; border-collapse: collapse; margin-top: 6px; }
          table.data th, table.data td { border: 1px solid #cbd5e1; padding: 3px 4px; text-align: left; }
          table.data th { background: #0f766e; color: #ffffff; font-weight: bold; text-align: center; font-size: 7.5px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer-firmas { margin-top: 30px; display: flex; justify-content: space-around; text-align: center; }
          .firma-box { width: 220px; border-top: 1px solid #334155; padding-top: 4px; font-size: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-weight: bold; font-size: 9px; color: #64748b;">MINISTERIO DE SALUD • DIRECCIÓN GENERAL DE MEDICAMENTOS, INSUMOS Y DROGAS (DIGEMID)</div>
          <p class="title">BALANCE TRIMESTRAL DE SUSTANCIAS ESTUPEFACIENTES Y PSICOTRÓPICAS</p>
          <p class="subtitle">CONFORME AL D.S. N° 023-2001-SA • PERIODO: ${balanceData.periodo?.nombre || ''} - AÑO ${balanceData.periodo?.anio || ''}</p>
        </div>

        <table class="data">
          <thead>
            <tr>
              <th style="width: 15px;">#</th>
              <th>CÓD. DIGEMID</th>
              <th>NOMBRE COMERCIAL</th>
              <th>D.C.I. / PRINCIPIO ACTIVO</th>
              <th>CONCENTRACIÓN & FORMA</th>
              <th>LISTA FISCALIZADA</th>
              <th>SALDO INICIAL</th>
              <th>INGRESOS (+)</th>
              <th>EGRESOS (-)</th>
              <th>SALDO FINAL</th>
              <th>STOCK FÍSICO</th>
            </tr>
          </thead>
          <tbody>
            ${balanceData.items.map((b, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td style="font-family: monospace;">${b.codigo_digemid}</td>
                <td><strong>${b.nombre_comercial}</strong></td>
                <td>${b.nombre_generico}</td>
                <td>${b.concentracion} - ${b.presentacion}</td>
                <td class="text-center">${b.tipo_controlado.replace(/_/g, ' ')}</td>
                <td class="text-right" style="font-family: monospace;">${b.saldo_inicial.toFixed(2)}</td>
                <td class="text-right" style="font-family: monospace; color: #047857;">+${b.ingresos.toFixed(2)}</td>
                <td class="text-right" style="font-family: monospace; color: #b91c1c;">-${b.total_egresos.toFixed(2)}</td>
                <td class="text-right" style="font-family: monospace; font-weight: bold;">${b.saldo_final_teorico.toFixed(2)}</td>
                <td class="text-right" style="font-family: monospace; font-weight: bold;">${b.saldo_fisico.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer-firmas">
          <div class="firma-box">
            <br><br>
            <strong>DIRECTOR TÉCNICO (Q.F. REGENTE)</strong><br>
            Colegio Químico Farmacéutico del Perú (CQFP)
          </div>
          <div class="firma-box">
            <br><br>
            <strong>REPRESENTANTE LEGAL / ADMINISTRADOR</strong><br>
            Establecimiento Farmacéutico
          </div>
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    setTimeout(() => ventana.print(), 500);
  };

  return (
    <div className="space-y-4 font-sora">
      {/* ─── ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 space-y-3 font-sora">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                  Kardex Valorizado & Control de Recetas
                </h2>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                  SUNAT 13.1 • DIGEMID
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
                Valuación por Costo Promedio Ponderado oficial SUNAT y Libro de Sustancias Fiscalizadas.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de 3 Opciones Interactivas Claramente Seleccionables */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 font-sora">
              Módulos Disponibles:
            </span>
            <span className="text-[10px] font-bold text-[#00855E] dark:text-[#5EEBB8] bg-[#EBFDF6] dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-[#A6F6D8] dark:border-emerald-800/60 font-sora">
              {tabActiva === 'kardex' && '● Opción 1: Kardex SUNAT 13.1 Seleccionado'}
              {tabActiva === 'recetas' && '● Opción 2: Libro de Recetas Seleccionado'}
              {tabActiva === 'balance' && '● Opción 3: Balance DIGEMID Seleccionado'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Opción 1: Kardex SUNAT 13.1 */}
            <button
              type="button"
              onClick={() => setTabActiva('kardex')}
              className={`group relative flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.98] font-sora ${
                tabActiva === 'kardex'
                  ? 'border-[#00855E] bg-[#EBFDF6]/70 dark:bg-emerald-950/40 shadow-xs ring-2 ring-[#00855E]/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#A6F6D8] hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-2xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  tabActiva === 'kardex'
                    ? 'bg-[#00855E] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#EBFDF6] group-hover:text-[#00855E]'
                }`}
              >
                <Layers className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-black truncate ${
                      tabActiva === 'kardex' ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    1. Kardex SUNAT 13.1
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      tabActiva === 'kardex'
                        ? 'border-[#00855E] bg-[#00855E] text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-[#00855E]'
                    }`}
                  >
                    {tabActiva === 'kardex' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Valuación y costo promedio formal
                </p>
              </div>
            </button>

            {/* Opción 2: Libro Oficial de Recetas */}
            <button
              type="button"
              onClick={() => setTabActiva('recetas')}
              className={`group relative flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.98] font-sora ${
                tabActiva === 'recetas'
                  ? 'border-[#00855E] bg-[#EBFDF6]/70 dark:bg-emerald-950/40 shadow-xs ring-2 ring-[#00855E]/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#A6F6D8] hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-2xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  tabActiva === 'recetas'
                    ? 'bg-[#00855E] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#EBFDF6] group-hover:text-[#00855E]'
                }`}
              >
                <BookOpen className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-black truncate ${
                      tabActiva === 'recetas' ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    2. Libro de Recetas
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      tabActiva === 'recetas'
                        ? 'border-[#00855E] bg-[#00855E] text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-[#00855E]'
                    }`}
                  >
                    {tabActiva === 'recetas' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Recetas retenidas y médico CMP
                </p>
              </div>
            </button>

            {/* Opción 3: Balance DIGEMID */}
            <button
              type="button"
              onClick={() => setTabActiva('balance')}
              className={`group relative flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer select-none active:scale-[0.98] font-sora ${
                tabActiva === 'balance'
                  ? 'border-[#00855E] bg-[#EBFDF6]/70 dark:bg-emerald-950/40 shadow-xs ring-2 ring-[#00855E]/20'
                  : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#A6F6D8] hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-2xs'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  tabActiva === 'balance'
                    ? 'bg-[#00855E] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-[#EBFDF6] group-hover:text-[#00855E]'
                }`}
              >
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-xs font-black truncate ${
                      tabActiva === 'balance' ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    3. Balance DIGEMID
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      tabActiva === 'balance'
                        ? 'border-[#00855E] bg-[#00855E] text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-[#00855E]'
                    }`}
                  >
                    {tabActiva === 'balance' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  Psicotrópicos y fiscalizados
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TAB 1: KARDEX VALORIZADO FORMAL SUNAT 13.1 ─── */}
      {tabActiva === 'kardex' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Selector de Medicamento y Rango de Fechas */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div className="w-full lg:w-1/2">
                <DropdownPill
                  label="Seleccionar Fármaco a Valuar"
                  value={medSeleccionado}
                  onChange={(val) => setMedSeleccionado(val)}
                  options={medicamentos.map((m) => ({
                    value: m.id,
                    label: `${m.nombre_comercial} ${m.concentracion || ''}`,
                    subtitle: `${m.presentacion || 'Caja'} • Laboratorio: ${m.laboratorio || 'N/A'}`,
                    badge: `Stock: ${m.stock_cajas}`
                  }))}
                  icon={Pill}
                  searchable
                  placeholder="Buscar medicamento en Kardex..."
                  searchPlaceholder="Escribir nombre o principio activo..."
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 w-full lg:w-auto">
                <div className="flex-1 sm:flex-none">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Desde</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="flex-1 sm:flex-none">
                  <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Hasta</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <button
                  onClick={consultarKardex}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Filtrar
                </button>
              </div>
            </div>

            {/* Resumen del Medicamento Valuado */}
            {kardexData && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Existencia SUNAT</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5 truncate">{kardexData.cabeceraSunat.codigoExistencia}</p>
                  <p className="text-[10px] text-slate-400">Tipo 01 - Mercadería</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Saldo Físico Final</span>
                  <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{kardexData.resumen.saldoActualCantidad} u.</p>
                  <p className="text-[10px] text-slate-400">Unidades vendibles</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Costo Promedio Ponderado</span>
                  <p className="font-mono font-black text-emerald-600 text-sm mt-0.5">S/ {kardexData.resumen.costoPromedioActual}</p>
                  <p className="text-[10px] text-slate-400">Por unidad contable</p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase block">Inventario Valorizado Total</span>
                  <p className="font-mono font-black text-emerald-950 text-sm mt-0.5">S/ {kardexData.resumen.valorTotalInventario}</p>
                  <p className="text-[10px] text-emerald-700">Saldo monetario SUNAT</p>
                </div>
              </div>
            )}
          </div>

          {/* Botón de Exportación SUNAT */}
          <div className="flex justify-end">
            <button
              onClick={descargarKardexSunat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Registro 13.1 (.csv Oficial SUNAT)</span>
            </button>
          </div>

          {/* Tabla Formato SUNAT 13.1 */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">
                Formato 13.1 - Detalle de Entradas, Salidas y Saldos Valorizados
              </span>
              <span className="text-[11px] text-slate-400 font-semibold font-mono">
                {kardexData?.movimientos?.length || 0} movimientos registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-[11px] text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 border-b border-slate-200">
                  <tr>
                    <th rowSpan="2" className="py-2.5 px-3 border-r border-slate-200">Fecha</th>
                    <th colSpan="3" className="py-1 px-2 border-r border-slate-200 bg-slate-100/70">Comprobante / Documento</th>
                    <th rowSpan="2" className="py-2.5 px-2 border-r border-slate-200">Lote</th>
                    <th colSpan="3" className="py-1 px-2 border-r border-slate-200 bg-emerald-50 text-emerald-800">Entradas (Compras/Ajustes)</th>
                    <th colSpan="3" className="py-1 px-2 border-r border-slate-200 bg-rose-50 text-rose-800">Salidas (Ventas/Bajas)</th>
                    <th colSpan="3" className="py-1 px-2 bg-indigo-50 text-indigo-800">Saldo Final Valorizado</th>
                  </tr>
                  <tr className="text-[9px] bg-slate-50 text-slate-500">
                    <th className="py-1 px-1.5 border-r border-slate-200">Tipo</th>
                    <th className="py-1 px-1.5 border-r border-slate-200">Serie-N°</th>
                    <th className="py-1 px-1.5 border-r border-slate-200">Op.</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-emerald-700">Cant.</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-emerald-700">C. Unit</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-emerald-700">C. Total</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-rose-700">Cant.</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-rose-700">C. Unit</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-rose-700">C. Total</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-indigo-700">Cant.</th>
                    <th className="py-1 px-1.5 border-r border-slate-200 text-indigo-700">C. Prom</th>
                    <th className="py-1 px-1.5 text-indigo-700">Saldo S/</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {cargandoKardex ? (
                    <tr>
                      <td colSpan="14" className="py-8 text-center text-slate-400 font-sans">
                        Calculando costeo promedio del Kardex...
                      </td>
                    </tr>
                  ) : !kardexData || kardexData.movimientos.length === 0 ? (
                    <tr>
                      <td colSpan="14" className="py-10 text-center text-slate-400 font-sans">
                        No hay movimientos registrados para este medicamento en el periodo seleccionado.
                      </td>
                    </tr>
                  ) : (
                    kardexData.movimientos.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-2 text-slate-800 font-sans font-bold border-r border-slate-100">{m.fechaStr}</td>
                        <td className="py-2 px-1 text-slate-500 border-r border-slate-100">{m.tipoComprobante}</td>
                        <td className="py-2 px-1 text-slate-700 font-bold border-r border-slate-100">{m.serie}-{m.numero}</td>
                        <td className="py-2 px-1 text-slate-500 border-r border-slate-100">{m.tipoOperacion}</td>
                        <td className="py-2 px-1 text-slate-600 font-sans border-r border-slate-100 text-[10px]">{m.lote}</td>

                        {/* Entradas */}
                        <td className="py-2 px-1 text-emerald-700 font-bold border-r border-slate-100">{m.entradas.cantidad > 0 ? m.entradas.cantidad.toFixed(2) : '-'}</td>
                        <td className="py-2 px-1 text-emerald-700 border-r border-slate-100">{m.entradas.costoUnitario > 0 ? m.entradas.costoUnitario.toFixed(4) : '-'}</td>
                        <td className="py-2 px-1 text-emerald-800 font-black border-r border-slate-100">{m.entradas.costoTotal > 0 ? m.entradas.costoTotal.toFixed(2) : '-'}</td>

                        {/* Salidas */}
                        <td className="py-2 px-1 text-rose-700 font-bold border-r border-slate-100">{m.salidas.cantidad > 0 ? m.salidas.cantidad.toFixed(2) : '-'}</td>
                        <td className="py-2 px-1 text-rose-700 border-r border-slate-100">{m.salidas.costoUnitario > 0 ? m.salidas.costoUnitario.toFixed(4) : '-'}</td>
                        <td className="py-2 px-1 text-rose-800 font-black border-r border-slate-100">{m.salidas.costoTotal > 0 ? m.salidas.costoTotal.toFixed(2) : '-'}</td>

                        {/* Saldo Final */}
                        <td className="py-2 px-1 text-indigo-900 font-bold border-r border-slate-100">{m.saldoFinal.cantidad.toFixed(2)}</td>
                        <td className="py-2 px-1 text-indigo-800 border-r border-slate-100">{m.saldoFinal.costoPromedio.toFixed(4)}</td>
                        <td className="py-2 px-2 text-indigo-950 font-black bg-indigo-50/50">S/ {m.saldoFinal.costoTotal.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LIBRO OFICIAL DE RECETAS RETENIDAS & CONTROLADOS ─── */}
      {tabActiva === 'recetas' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Tarjetas KPI de Resumen del Libro de Recetas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
                  Total Recetas
                </span>
                <p className="font-mono font-black text-slate-900 text-base leading-tight mt-0.5">
                  {recetasFiltradas.length}
                </p>
                <span className="text-[10px] text-teal-700 font-bold">
                  {recetasFiltradas.length === recetas.length ? 'Registradas' : `De ${recetas.length} totales`}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
                  Médicos C.M.P.
                </span>
                <p className="font-mono font-black text-slate-900 text-base leading-tight mt-0.5">
                  {new Set(recetasFiltradas.map((r) => r.medicoCmp || r.medicoNombre).filter(Boolean)).size}
                </p>
                <span className="text-[10px] text-indigo-600 font-bold">Prescriptores únicos</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
                  Pacientes
                </span>
                <p className="font-mono font-black text-slate-900 text-base leading-tight mt-0.5">
                  {new Set(recetasFiltradas.map((r) => r.pacienteDni || r.pacienteNombre).filter(Boolean)).size}
                </p>
                <span className="text-[10px] text-blue-600 font-bold">Identificados con DNI</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
                  Fármacos
                </span>
                <p className="font-mono font-black text-slate-900 text-base leading-tight mt-0.5">
                  {new Set(recetasFiltradas.map((r) => r.medicamento).filter(Boolean)).size}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold">Lotes trazados</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros, Búsqueda y Acciones Oficiales */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Padrón de Dispensación con Receta Médica y Sustancias Controladas
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  D.S. N° 023-2001-SA (Estupefacientes y Psicotrópicos) • Resguardo de CMP, médico y serie de receta
                </p>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={consultarRecetas}
                  className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Actualizar datos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cargandoRecetas ? 'animate-spin' : ''}`} />
                  <span>Recargar</span>
                </button>

                <button
                  type="button"
                  onClick={exportarRecetasCSV}
                  className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Exportar archivo CSV oficial"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={imprimirLibroRecetas}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Imprimir formato A4 oficial para firma del Director Técnico"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Libro Oficial</span>
                </button>
              </div>
            </div>

            {/* Fila de Filtros Interactivos */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-end gap-3">
              {/* Buscador de texto predictivo */}
              <div className="flex-1 min-w-[240px]">
                <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                  Búsqueda Rápida en Recetas:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por paciente, DNI, médico, C.M.P., N° receta, medicamento o lote..."
                    value={busquedaReceta}
                    onChange={(e) => setBusquedaReceta(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-teal-500"
                  />
                  {busquedaReceta && (
                    <button
                      type="button"
                      onClick={() => setBusquedaReceta('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro por Clasificación Sanitaria */}
              <div className="w-full md:w-52">
                <label className="text-[10px] font-bold text-slate-400 mb-1 block">
                  Clasificación Sanitaria:
                </label>
                <select
                  value={filtroTipoControlado}
                  onChange={(e) => setFiltroTipoControlado(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="todos">Todos los controlados</option>
                  <option value="Psicotropico_Lista_IVB">Psicotrópicos (Lista IVB)</option>
                  <option value="Estupefaciente_Lista_II">Estupefacientes (Lista II)</option>
                  <option value="Estupefaciente_Lista_III">Estupefacientes (Lista III)</option>
                  <option value="Receta_Retenida">Receta Retenida Común</option>
                </select>
              </div>

              {/* Rango de Fechas */}
              <div className="flex items-end gap-2 w-full md:w-auto">
                <div className="flex-1 md:flex-none">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Desde</label>
                  <input
                    type="date"
                    value={fechaInicioRecetas}
                    onChange={(e) => setFechaInicioRecetas(e.target.value)}
                    className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="flex-1 md:flex-none">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={fechaFinRecetas}
                    onChange={(e) => setFechaFinRecetas(e.target.value)}
                    className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={consultarRecetas}
                  className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  title="Consultar fechas"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtrar</span>
                </button>
                {(fechaInicioRecetas || fechaFinRecetas || busquedaReceta || filtroTipoControlado !== 'todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFechaInicioRecetas('');
                      setFechaFinRecetas('');
                      setBusquedaReceta('');
                      setFiltroTipoControlado('todos');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer shrink-0"
                    title="Restablecer todos los filtros"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabla Oficial de Registros con Filtros Aplicados */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Detalle de Dispensaciones Registradas
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {recetasFiltradas.length} registro(s) {recetasFiltradas.length !== recetas.length && `(de ${recetas.length})`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 text-[10.5px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4">N° de Receta</th>
                    <th className="py-3 px-4">Paciente</th>
                    <th className="py-3 px-4">Médico / CMP</th>
                    <th className="py-3 px-4">Medicamento</th>
                    <th className="py-3 px-4">Lote / Vence</th>
                    <th className="py-3 px-4">Cantidad</th>
                    <th className="py-3 px-4">Dispensador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargandoRecetas ? (
                    <tr>
                      <td colSpan="9" className="py-10 text-center text-slate-400 font-medium">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                        Cargando libro de recetas retenidas...
                      </td>
                    </tr>
                  ) : recetasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center">
                        <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-600 font-bold text-sm">
                          {recetas.length === 0
                            ? 'No hay registros de recetas retenidas'
                            : 'No se encontraron recetas con los filtros aplicados'}
                        </p>
                        <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                          {recetas.length === 0
                            ? 'Las ventas con medicamentos que exigen receta médica y datos de médico quedarán catalogadas aquí.'
                            : 'Prueba cambiando los términos de búsqueda o limpiando el rango de fechas.'}
                        </p>
                        {recetas.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusquedaReceta('');
                              setFiltroTipoControlado('todos');
                              setFechaInicioRecetas('');
                              setFechaFinRecetas('');
                            }}
                            className="mt-3 px-3.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold hover:bg-teal-100 transition-all cursor-pointer"
                          >
                            Restablecer Filtros
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    recetasFiltradas.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{r.fecha}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{r.comprobante}</td>
                        <td className="py-3 px-4 font-mono font-black text-teal-700 bg-teal-50/60 px-2 py-0.5 rounded-lg whitespace-nowrap">
                          {r.numeroReceta}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900">{r.pacienteNombre}</p>
                          <p className="text-[10px] text-slate-400 font-mono">DNI: {r.pacienteDni}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900">{r.medicoNombre}</p>
                          <p className="text-[10px] text-indigo-600 font-mono font-bold">CMP: {r.medicoCmp}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-extrabold text-slate-900">{r.medicamento}</p>
                          <p className="text-[10.5px] text-slate-400">{r.concentracion}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          <span className="font-bold text-slate-800">{r.lote}</span>
                          <span className="text-slate-400 block text-[10px]">{r.vencimiento}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                          {r.cantidad} {r.formato}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {r.dispensadoPor}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: BALANCE TRIMESTRAL OFICIAL DE CONTROLADOS (DIGEMID D.S. 023-2001-SA) ─── */}
      {tabActiva === 'balance' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Barra de Filtros de Periodo Oficial y Acciones */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-full sm:w-44">
                <DropdownPill
                  label="Año de Balance"
                  value={anioBalance}
                  onChange={(val) => setAnioBalance(val)}
                  options={[2026, 2025, 2024].map((y) => ({
                    value: y,
                    label: `Año ${y}`
                  }))}
                  icon={Calendar}
                />
              </div>

              <div className="w-full sm:w-60">
                <DropdownPill
                  label="Periodo Trimestral"
                  value={trimestreBalance}
                  onChange={(val) => setTrimestreBalance(val)}
                  options={[
                    { value: 1, label: 'I Trimestre', subtitle: 'Enero - Marzo' },
                    { value: 2, label: 'II Trimestre', subtitle: 'Abril - Junio' },
                    { value: 3, label: 'III Trimestre', subtitle: 'Julio - Septiembre' },
                    { value: 4, label: 'IV Trimestre', subtitle: 'Octubre - Diciembre' }
                  ]}
                  icon={Layers}
                />
              </div>

              <div className="w-full sm:w-auto">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Buscar Sustancia:</label>
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar fármaco o DCI..."
                    value={filtroSustancia}
                    onChange={(e) => setFiltroSustancia(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Botones de Exportación e Impresión Oficial */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={consultarBalance}
                className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Actualizar datos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${cargandoBalance ? 'animate-spin' : ''}`} />
                <span>Recargar</span>
              </button>

              <button
                type="button"
                onClick={exportarBalanceExcel}
                className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Descargar archivo Excel oficial"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel DIGEMID</span>
              </button>

              <button
                type="button"
                onClick={imprimirBalance}
                className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Imprimir formato oficial foliado para firma"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Balance</span>
              </button>
            </div>
          </div>

          {/* Tabla Oficial de Balance */}
          <div className="bg-white rounded-[28px] border border-slate-100 shadow-xs overflow-hidden">
            <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Padrón de Sustancias Estupefacientes y Psicotrópicas Fiscalizadas
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Periodo: {balanceData?.periodo?.nombre || 'Trimestre'} {anioBalance}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-[10.5px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-2 text-center w-10 whitespace-nowrap">#</th>
                    <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">Cód. DIGEMID</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Medicamento / Fármaco</th>
                    <th className="py-2.5 px-2.5 max-w-[140px] truncate">DCI / Concentración</th>
                    <th className="py-2.5 px-2 text-center w-28 whitespace-nowrap">Clasificación</th>
                    <th className="py-2.5 px-2 text-right w-20 whitespace-nowrap">Saldo Inicial</th>
                    <th className="py-2.5 px-2 text-right w-22 whitespace-nowrap text-emerald-700">Ingresos (+)</th>
                    <th className="py-2.5 px-2 text-right w-22 whitespace-nowrap text-rose-700">Egresos (-)</th>
                    <th className="py-2.5 px-2 text-right w-22 whitespace-nowrap font-black">Saldo Final</th>
                    <th className="py-2.5 px-2 text-right w-22 whitespace-nowrap">Stock Físico</th>
                    <th className="py-2.5 px-2 text-center w-24 whitespace-nowrap">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cargandoBalance ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Calculando balance trimestral de sustancias controladas...
                      </td>
                    </tr>
                  ) : !balanceData?.items || balanceData.items.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                        No se registraron movimientos de sustancias fiscalizadas en este periodo trimestral.
                      </td>
                    </tr>
                  ) : (
                    balanceData.items
                      .filter((b) => {
                        if (!filtroSustancia) return true;
                        const q = filtroSustancia.toLowerCase();
                        return (
                          b.nombre_comercial?.toLowerCase().includes(q) ||
                          b.nombre_generico?.toLowerCase().includes(q) ||
                          b.codigo_digemid?.toLowerCase().includes(q)
                        );
                      })
                      .map((b, i) => {
                        const tieneDiscrepancia = Math.abs(b.discrepancia) > 0.01;
                        return (
                          <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-400">
                              {i + 1}
                            </td>
                            <td className="py-2.5 px-2 text-center font-mono text-[11px] font-bold text-slate-700 whitespace-nowrap">
                              {b.codigo_digemid}
                            </td>
                            <td className="py-2.5 px-3 font-black text-slate-900 min-w-[160px]">
                              {b.nombre_comercial}
                            </td>
                            <td className="py-2.5 px-2.5 text-slate-600 max-w-[140px] truncate" title={`${b.nombre_generico} • ${b.concentracion} - ${b.presentacion}`}>
                              <span className="font-semibold">{b.nombre_generico}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{b.concentracion} - {b.presentacion}</span>
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
                                {b.tipo_controlado.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-700 whitespace-nowrap">
                              {b.saldo_inicial.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-extrabold text-emerald-600 whitespace-nowrap">
                              +{b.ingresos.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-extrabold text-rose-600 whitespace-nowrap">
                              -{b.total_egresos.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                              {b.saldo_final_teorico.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-right font-mono font-extrabold text-slate-800 whitespace-nowrap">
                              {b.saldo_fisico.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                              {tieneDiscrepancia ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                                  Diferencia ({b.discrepancia > 0 ? `+${b.discrepancia}` : b.discrepancia})
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center gap-1 shadow-2xs">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Cuadrado
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

