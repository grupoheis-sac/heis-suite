import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import api from '../services/api';
import { applyBrandToTab } from '../utils/brand';

export const STORAGE_KEYS = {
  PAPER_FORMAT: 'heis_paper_format',
  PRINT_METHOD: 'heis_print_method',
  BRIDGE_URL: 'heis_print_bridge_url',
  PRINTER_NAME: 'heis_printer_name',
  OPEN_DRAWER: 'heis_open_drawer_default',
};

export function getTerminalPrintSettings() {
  if (typeof window === 'undefined') {
    return {
      paperFormat: '80mm',
      printMethod: 'AUTO',
      bridgeUrl: 'http://127.0.0.1:9101',
      printerName: 'POS-80',
      openCashDrawer: true,
    };
  }

  const storedBridge = localStorage.getItem(STORAGE_KEYS.BRIDGE_URL);
  // Si no está seteado o apunta al legacy PHP, sugerir el agente nativo Node.js 9101
  const bridgeUrl = storedBridge || 'http://127.0.0.1:9101';

  return {
    paperFormat: localStorage.getItem(STORAGE_KEYS.PAPER_FORMAT) || '80mm',
    printMethod: localStorage.getItem(STORAGE_KEYS.PRINT_METHOD) || 'AUTO',
    bridgeUrl,
    printerName: localStorage.getItem(STORAGE_KEYS.PRINTER_NAME) || 'POS-80',
    openCashDrawer: localStorage.getItem(STORAGE_KEYS.OPEN_DRAWER) !== 'false',
  };
}

export function saveTerminalPrintSettings(newSettings) {
  const current = getTerminalPrintSettings();
  const merged = { ...current, ...newSettings };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PAPER_FORMAT, merged.paperFormat);
    localStorage.setItem(STORAGE_KEYS.PRINT_METHOD, merged.printMethod);
    localStorage.setItem(STORAGE_KEYS.BRIDGE_URL, (merged.bridgeUrl || '').trim());
    localStorage.setItem(STORAGE_KEYS.PRINTER_NAME, (merged.printerName || '').trim());
    localStorage.setItem(STORAGE_KEYS.OPEN_DRAWER, String(Boolean(merged.openCashDrawer)));

    window.dispatchEvent(new CustomEvent('heis:print-settings-changed', { detail: merged }));
  }
  return merged;
}

export function useTerminalPrintSettings() {
  const [settings, setSettings] = useState(() => getTerminalPrintSettings());

  useEffect(() => {
    const handler = (e) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('heis:print-settings-changed', handler);
    return () => window.removeEventListener('heis:print-settings-changed', handler);
  }, []);

  const updateSettings = useCallback((partial) => {
    const updated = saveTerminalPrintSettings(partial);
    setSettings(updated);
    return updated;
  }, []);

  return { settings, updateSettings };
}

export const RESTAURANT_LOGIN_PRESETS = [
  {
    id: 'preset-salon-gourmet',
    name: 'Salón Gourmet & Velas',
    desc: 'Ambiente cálido y tenue con copas de vino y mesas vestidas para veladas gourmet',
    tag: 'Elegante',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80',
    category: 'Salón'
  },
  {
    id: 'preset-chef-pass',
    name: 'Alta Cocina & Chef Pass',
    desc: 'Pase de cocina impecable con chefs preparando platos al momento y fuego vivo',
    tag: 'Gastronómico',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1920&q=80',
    category: 'Cocina'
  },
  {
    id: 'preset-bar-cocteleria',
    name: 'Bar & Coctelería de Autor',
    desc: 'Barra sofisticada con iluminación ambarina, copas y licores premium',
    tag: 'Contemporáneo',
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1920&q=80',
    category: 'Bar'
  },
  {
    id: 'preset-bistro-rustico',
    name: 'Bistró Rústico & Terraza',
    desc: 'Texturas de madera noble, calidez hogareña y mesas rústicas al aire libre',
    tag: 'Artesanal',
    url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1920&q=80',
    category: 'Bistró'
  },
  {
    id: 'preset-grill-asador',
    name: 'Grill & Asador Gourmet',
    desc: 'Cortes seleccionados y ambiente de parrilla y brasas de alta categoría',
    tag: 'Fuego & Brasas',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1920&q=80',
    category: 'Parrilla'
  },
  {
    id: 'preset-cafe-lounge',
    name: 'Café Lounge & Brunch',
    desc: 'Espacio relajado y luminoso para cafetería de especialidad y brunch de día',
    tag: 'Casual Chic',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1920&q=80',
    category: 'Cafetería'
  }
];

export const PRESET_LOGIN_BACKGROUNDS = RESTAURANT_LOGIN_PRESETS;

const DEFAULT_SETTINGS = {
  // Identidad y Datos SUNAT
  businessName: 'HEIS SAC',
  businessTagline: 'Plataforma Cloud Multi-Tenant Enterprise',
  businessRuc: '20601234567',
  technicalDirector: 'Dirección General de Operaciones',
  address: 'Lima, Perú',
  phone: '(01) 456-7890 / 998-765-432',
  businessEmail: 'contacto@heis.pe',
  businessDepartment: 'Lima',
  businessProvince: 'Lima',
  businessDistrict: 'Lima',
  businessUbigeo: '150101',
  businessWebsite: 'https://heis.pe',
  currency: 'PEN',

  // Fondo Login y Estilos
  loginBgUrl: RESTAURANT_LOGIN_PRESETS[0].url,
  loginPresetId: 'preset-salon-gourmet',
  loginBgType: 'preset', // 'preset' | 'custom-file' | 'custom-url' | 'gradient' | 'solid'
  loginOverlayDarkness: 'medium', // 'light' | 'medium' | 'heavy'
  loginBgBlur: 'subtle', // 'none' | 'subtle' | 'medium'
  businessLogoUrl: '/logo-dia.png',
  userAvatarUrl: '',

  // Formatos de Impresión & Tickets
  printerPaperDefault: '80mm', // '80mm' | '58mm'
  ticketFooterText: '¡Gracias por su visita y preferencia! • Comprobante de consumo para efectos tributarios.',
  ticketShowQr: true,
  ticketAutoPrint: false,
  ticketShowLogo: true,

  // Facturación Electrónica SUNAT
  facturacionElectronicaActiva: true,
  modoSunat: 'demo', // 'demo' | 'produccion'
  sunatProveedor: 'nubefact', // 'api_propia' | 'nubefact' | 'pse' | 'simulador'
  sunatApiUrl: 'https://api.nubefact.com/api/v1/00000000-0000-0000-0000-000000000000',
  sunatToken: '',
  serieBoleta: 'B001',
  serieFactura: 'F001',
  serieNotaCreditoBoleta: 'BC01',
  serieNotaCreditoFactura: 'FC01',
  serieGuia: 'T001',
  serieNotaVenta: 'NV01',

  // Cuentas Bancarias & Pagos Digitales
  banco1Nombre: 'BCP',
  banco1Tipo: 'Cta. Corriente Soles',
  banco1Numero: '193-98765432-0-12',
  banco1Cci: '002-193-0098765432012-14',
  banco2Nombre: 'BBVA',
  banco2Tipo: 'Cta. Ahorros Soles',
  banco2Numero: '0011-0123-0200456789',
  banco2Cci: '011-123-000200456789-21',
  banco3Nombre: 'Banco de la Nación',
  banco3Tipo: 'Cta. Detracciones',
  banco3Numero: '00-012-345678',
  banco3Cci: '',
  pagoYapeNumero: '998 765 432',
  pagoPlinNumero: '998 765 432',
  pagoTitular: 'HEIS S.A.C.',
  mostrarCuentasEnCotizaciones: true,

  // Copias de Respaldo
  backupAutoHora: '23:00',
  backupRetencionDias: '15'
};

const getStoredSettings = () => {
  try {
    const raw = localStorage.getItem('gastro_restaurant_login_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      delete parsed.sunatToken;
      delete parsed.userAvatarUrl;
      if (parsed.businessName && parsed.businessName.includes('GASTRO')) {
        parsed.businessName = 'HEIS SAC';
      }
      const merged = { ...DEFAULT_SETTINGS, ...parsed };
      applyBrandToTab({
        businessName: merged.businessName,
        businessLogoUrl: merged.businessLogoUrl,
        defaultTitle: 'HEIS SAC',
        defaultFavicon: '/favicon.png'
      });
      return merged;
    }
  } catch (e) {
    console.error('Error al leer configuraciones de localStorage:', e);
  }
  applyBrandToTab({
    businessName: DEFAULT_SETTINGS.businessName,
    businessLogoUrl: DEFAULT_SETTINGS.businessLogoUrl,
    defaultTitle: 'HEIS SAC',
    defaultFavicon: '/favicon.png'
  });
  return DEFAULT_SETTINGS;
};

export const useSettingsStore = create((set, get) => ({
  ...getStoredSettings(),
  cargandoConfig: false,

  fetchServerSettings: async () => {
    try {
      set({ cargandoConfig: true });
      const res = await api.get('/configuracion');
      const conf = res?.configuracion || res?.data?.configuracion || res?.data;
      if (conf) {
        set((state) => ({ ...state, ...conf, cargandoConfig: false }));
        applyBrandToTab({
          businessName: conf.businessName || get().businessName,
          businessLogoUrl: conf.businessLogoUrl || get().businessLogoUrl,
          defaultTitle: DEFAULT_SETTINGS.businessName,
          defaultFavicon: '/logo.svg'
        });
        try {
          const current = { ...get(), ...conf };
          localStorage.setItem(
            'gastro_restaurant_login_settings',
            JSON.stringify(current)
          );
        } catch (_) {}
      } else {
        set({ cargandoConfig: false });
      }
    } catch (_) {
      set({ cargandoConfig: false });
    }
  },

  updateSettings: async (newSettings) => {
    set((state) => ({ ...state, ...newSettings }));
    applyBrandToTab({
      businessName: newSettings.businessName || get().businessName,
      businessLogoUrl: newSettings.businessLogoUrl !== undefined ? newSettings.businessLogoUrl : get().businessLogoUrl,
      defaultTitle: DEFAULT_SETTINGS.businessName,
      defaultFavicon: '/logo.svg'
    });
    try {
      const current = { ...get(), ...newSettings };
      localStorage.setItem(
        'gastro_restaurant_login_settings',
        JSON.stringify(current)
      );
      await api.put('/configuracion', newSettings);
    } catch (e) {
      console.warn('Persistencia local guardada con éxito (aviso de backend):', e.message);
    }
  },

  resetDefaults: () => {
    set(DEFAULT_SETTINGS);
    applyBrandToTab({
      businessName: DEFAULT_SETTINGS.businessName,
      businessLogoUrl: DEFAULT_SETTINGS.businessLogoUrl,
      defaultTitle: DEFAULT_SETTINGS.businessName,
      defaultFavicon: '/logo.svg'
    });
    try {
      localStorage.removeItem('gastro_restaurant_login_settings');
    } catch (_) {}
  }
}));
