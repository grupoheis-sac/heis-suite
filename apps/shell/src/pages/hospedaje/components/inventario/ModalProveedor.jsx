import React, { useState, useEffect } from 'react';
import { Modal } from '@heis/ui';
import { Building2, Search, Loader2, Save, X, Phone, Mail, MapPin, Tag } from 'lucide-react';
import api from '../../api';
import { notificarExito, notificarError } from '../../utils/notificaciones';

const CATEGORIAS_PROVEEDOR = [
  'Minibar & Bebidas',
  'Alimentos & Cocina',
  'Lencería, Sábanas & Toallas',
  'Aseo, Químicos & Limpieza',
  'Amenidades & Aseo Huéspedes',
  'Mantenimiento & Ferretería',
  'Papelería & Oficina',
  'Varios / General'
];

export default function ModalProveedor({ isOpen, onClose, proveedor, onSuccess }) {
  const [ruc, setRuc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [categoria, setCategoria] = useState('Minibar & Bebidas');
  const [consultandoSunat, setConsultandoSunat] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (proveedor) {
        setRuc(proveedor.ruc || '');
        setRazonSocial(proveedor.razon_social || '');
        setContactoNombre(proveedor.contacto_nombre || '');
        setTelefono(proveedor.telefono || '');
        setEmail(proveedor.email || '');
        setDireccion(proveedor.direccion || '');
        setCategoria(proveedor.categoria_suministros || 'Minibar & Bebidas');
      } else {
        setRuc('');
        setRazonSocial('');
        setContactoNombre('');
        setTelefono('');
        setEmail('');
        setDireccion('');
        setCategoria('Minibar & Bebidas');
      }
    }
  }, [isOpen, proveedor]);

  const handleConsultarSunat = async () => {
    const doc = ruc.trim();
    if (doc.length !== 11) {
      notificarError('RUC inválido', 'El RUC debe contener exactamente 11 dígitos.');
      return;
    }

    try {
      setConsultandoSunat(true);
      const res = await api.get(`/consultas/ruc/${doc}`);
      const d = res.data?.data || res.data;
      if (d && (d.razon_social || d.nombre_o_razon_social)) {
        setRazonSocial(d.razon_social || d.nombre_o_razon_social);
        if (d.direccion_completa || d.direccion) {
          setDireccion(d.direccion_completa || d.direccion);
        }
        notificarExito('Consulta SUNAT Conforme', d.razon_social || d.nombre_o_razon_social);
      }
    } catch (err) {
      notificarError('Error SUNAT', err.response?.data?.message || 'No se pudo consultar el RUC en SUNAT.');
    } finally {
      setConsultandoSunat(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ruc.trim() || !razonSocial.trim()) {
      notificarError('Campos obligatorios', 'Por favor complete RUC y Razón Social.');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        ruc: ruc.trim(),
        razon_social: razonSocial.trim(),
        contacto_nombre: contactoNombre.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        direccion: direccion.trim() || null,
        categoria_suministros: categoria
      };

      if (proveedor?.id) {
        await api.put(`/proveedores/${proveedor.id}`, payload);
        notificarExito('Proveedor actualizado', 'Los datos del proveedor fueron actualizados.');
      } else {
        await api.post('/proveedores', payload);
        notificarExito('Proveedor registrado', 'Nuevo proveedor registrado con éxito.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      notificarError('Error al guardar', err.response?.data?.message || 'No se pudo guardar el proveedor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
      title={proveedor ? 'Editar Proveedor de Suministros' : 'Registrar Nuevo Proveedor'}
      subtitle="Datos comerciales y contacto para compras e ingresos de stock"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 font-sora">
        {/* RUC con Consulta Rápida SUNAT */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            RUC del Proveedor (SUNAT) *
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={11}
              required
              placeholder="Ej: 20100070970"
              value={ruc}
              onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              disabled={consultandoSunat || ruc.length !== 11}
              onClick={handleConsultarSunat}
              className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              title="Autocompletar razón social desde SUNAT"
            >
              {consultandoSunat ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Consultar SUNAT</span>
            </button>
          </div>
        </div>

        {/* Razón Social */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Razón Social / Empresa *
          </label>
          <input
            type="text"
            required
            placeholder="Ej: DISTRIBUIDORA DE BEBIDAS Y ALIMENTOS SAC"
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Contacto & Teléfono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nombre de Contacto / Vendedor
            </label>
            <input
              type="text"
              placeholder="Ej: Lic. Carlos Mendoza"
              value={contactoNombre}
              onChange={(e) => setContactoNombre(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="text"
              placeholder="Ej: 987654321"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Email & Categoría */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="ventas@proveedor.pe"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Categoría de Suministros
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
            >
              {CATEGORIAS_PROVEEDOR.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dirección Fiscal / Despacho */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Dirección Fiscal o Almacén
          </label>
          <input
            type="text"
            placeholder="Ej: Av. Industrial 450, Lima"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{guardando ? 'Guardando...' : proveedor ? 'Guardar Cambios' : 'Registrar Proveedor'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

