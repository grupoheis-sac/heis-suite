import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FileText,
  Printer,
  X,
  User,
  Calendar,
  Users
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

export default function ModalFichaMincetur({ isOpen, onClose, reservaId }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (isOpen && reservaId) {
      cargarFicha();
    }
  }, [isOpen, reservaId]);

  const cargarFicha = async () => {
    try {
      setCargando(true);
      const res = await api.get(`/reservas/${reservaId}/mincetur`);
      if (res.data?.success) {
        setDatos(res.data.data);
      }
    } catch (e) {
      toast.error('Error al cargar la ficha oficial del huésped.');
    } finally {
      setCargando(false);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  if (!isOpen) return null;

  const reserva = datos?.reserva;
  const huesped = reserva?.huesped;
  const acompanantes = reserva?.acompanantes || [];
  const habitacion = reserva?.habitacion;
  const sede = datos?.sede;
  const config = datos?.config || {};

  const nombreHotel = config.nombre_hotel || sede?.nombre || 'HOTEL & HOSPEDAJE';
  const rucHotel = config.ruc_hotel || sede?.codigo_establecimiento || '20000000001';
  const direccionHotel = config.direccion_hotel || sede?.direccion || 'Av. Principal 123';
  const telefonoHotel = config.telefono_hotel || sede?.telefono || '(01) 234-5678';

  const fechaEntrada = reserva?.fecha_entrada || '---';
  const fechaSalida = reserva?.fecha_salida || '---';
  const horaEntrada = reserva?.fecha_hora_entrada
    ? new Date(reserva.fecha_hora_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '14:00';
  const horaSalida = reserva?.fecha_hora_salida
    ? new Date(reserva.fecha_hora_salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '12:00';

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-150 overflow-y-auto"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >

        {/* Barra superior de herramientas (no imprimible) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/40 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-sora">
                Ficha Oficial de Registro de Huéspedes
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Reglamento de Establecimientos de Hospedaje • D.S. Nº 001-2015-MINCETUR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleImprimir}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold font-sora flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenedor del documento (Imprimible) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 dark:text-slate-100 print:p-0 print:m-0 print:overflow-visible">
          {cargando ? (
            <div className="py-20 text-center text-slate-400 text-xs">Cargando datos de la ficha...</div>
          ) : (
            <div className="border border-slate-300 dark:border-slate-700 print:border-black rounded-2xl p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 print:bg-white print:text-black">

              {/* Encabezado Institucional */}
              <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-black font-sora tracking-tight uppercase text-blue-900 dark:text-blue-400 print:text-black">
                    {nombreHotel}
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 print:text-black">
                    RUC: <strong className="font-mono">{rucHotel}</strong> • {direccionHotel}
                  </p>
                  <p className="text-[11px] text-slate-500 print:text-black">
                    Teléfono: {telefonoHotel}
                  </p>
                </div>
                <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-2 border-blue-600 pr-3 pl-3 sm:pl-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 print:text-black">
                    Registro de Pasajeros
                  </div>
                  <div className="text-base font-extrabold font-mono text-slate-900 dark:text-white print:text-black">
                    N° {reserva?.codigo}
                  </div>
                  <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 print:text-black">
                    HABITACIÓN #{habitacion?.numero}
                  </div>
                </div>
              </div>

              {/* Sección 1: Datos del Huésped Titular */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                  <User className="w-3.5 h-3.5 text-blue-600 print:text-black" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black font-sora">
                    1. Datos del Huésped Titular
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Apellidos y Nombres</span>
                    <strong className="text-xs uppercase">{huesped?.apellido}, {huesped?.nombre}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">{huesped?.tipo_documento || 'Documento'}</span>
                    <strong className="font-mono text-xs">{huesped?.num_documento}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Nacionalidad</span>
                    <span>{huesped?.nacionalidad || 'Peruana'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Ocupación / Profesión</span>
                    <span>{huesped?.ocupacion || 'Particular'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Ciudad de Origen (Procedencia)</span>
                    <span>{huesped?.ciudad_origen || 'No especificada'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Ciudad de Destino</span>
                    <span>{reserva?.ciudad_destino || 'Misma ciudad'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300 sm:col-span-2">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Motivo de Viaje</span>
                    <span>{reserva?.motivo_viaje || 'Turismo / Descanso'}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 print:bg-transparent print:border print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Teléfono / Celular</span>
                    <span className="font-mono">{huesped?.telefono || '---'}</span>
                  </div>
                </div>
              </div>

              {/* Sección 2: Acompañantes en la Habitación */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-blue-600 print:text-black" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black font-sora">
                      2. Acompañantes en la Misma Habitación ({acompanantes.length})
                    </h2>
                  </div>
                </div>

                {acompanantes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    El huésped no registró acompañantes en esta estancia.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 print:border-black">
                      <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-200 text-[10px] uppercase font-black">
                        <tr>
                          <th className="p-2 border">#</th>
                          <th className="p-2 border">Nombres y Apellidos</th>
                          <th className="p-2 border">Doc. Identidad</th>
                          <th className="p-2 border">Nacionalidad</th>
                          <th className="p-2 border">Parentesco</th>
                          <th className="p-2 border">Edad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acompanantes.map((ac, idx) => (
                          <tr key={ac.id || idx} className="border-b">
                            <td className="p-2 border font-mono">{idx + 1}</td>
                            <td className="p-2 border font-bold uppercase">{ac.nombre} {ac.apellido}</td>
                            <td className="p-2 border font-mono">{ac.tipo_documento}: {ac.num_documento}</td>
                            <td className="p-2 border">{ac.nacionalidad || 'Peruana'}</td>
                            <td className="p-2 border">{ac.parentesco || 'Acompañante'}</td>
                            <td className="p-2 border font-mono">{ac.edad ? `${ac.edad} años` : '---'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sección 3: Datos de la Estancia y Habitación */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 print:text-black" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black font-sora">
                    3. Datos de la Estancia y Habitación
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Habitación</span>
                    <strong className="text-sm font-mono text-blue-600 dark:text-blue-400 print:text-black">
                      N° {habitacion?.numero}
                    </strong>
                    <span className="block text-[10px] text-slate-500">Piso {habitacion?.piso} • {habitacion?.tipo?.nombre}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Modalidad</span>
                    <strong className="text-xs uppercase">
                      {reserva?.modalidad === 'horas' ? `Por Horas (${reserva.num_horas}h)` : `Por Noches (${reserva?.num_noches}n)`}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Fecha y Hora Ingreso</span>
                    <strong className="text-xs font-mono">{fechaEntrada}</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">{horaEntrada}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-300">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 print:text-black">Fecha y Hora Salida</span>
                    <strong className="text-xs font-mono">{fechaSalida}</strong>
                    <span className="block text-[10px] text-slate-500 font-mono">{horaSalida}</span>
                  </div>
                </div>
              </div>

              {/* Declaración Jurada */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 print:bg-transparent border border-slate-200 dark:border-slate-800 print:border-slate-400 text-[10px] text-slate-600 dark:text-slate-400 print:text-black space-y-1">
                <p className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-black">
                  Declaración Jurada y Aceptación del Reglamento Interno:
                </p>
                <p>
                  Declaro bajo juramento que los datos consignados en la presente ficha corresponden exactamente con mi documento de identidad y que asumo plena responsabilidad civil por cualquier daño ocasionado a las instalaciones del establecimiento durante mi estancia, sometiéndome al reglamento interno de hospedaje y a la normativa legal vigente del MINCETUR.
                </p>
              </div>

              {/* Bloque de Firmas */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-2">
                  <div className="border-b border-slate-800 print:border-black mx-auto w-48 sm:w-60 h-12" />
                  <p className="font-bold uppercase text-[11px] text-slate-800 dark:text-slate-200 print:text-black">
                    Firma del Huésped Titular
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 print:text-black">
                    DOC: {huesped?.num_documento}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="border-b border-slate-800 print:border-black mx-auto w-48 sm:w-60 h-12" />
                  <p className="font-bold uppercase text-[11px] text-slate-800 dark:text-slate-200 print:text-black">
                    Recepción del Establecimiento
                  </p>
                  <p className="text-[10px] font-mono text-slate-400 print:text-black">
                    {reserva?.usuario?.nombre || 'Recepcionista en Turno'}
                  </p>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
