// packages/ui/src/components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Si Sentry está activo en window.__SENTRY_HUB__ o importado en apps/shell
    if (typeof window !== 'undefined' && window.Sentry?.captureException) {
      const empresaId = localStorage.getItem('heis_empresa_id') || 'unknown';
      const sucursalId = localStorage.getItem('heis_sucursal_id') || 'unknown';

      const eventId = window.Sentry.captureException(error, {
        tags: { empresa_id: empresaId, sucursal_id: sucursalId },
        extra: { componentStack: errorInfo?.componentStack },
      });
      this.setState({ eventId });
    }
    console.error('[HEIS_UI_ERROR_BOUNDARY]:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Se detectó una anomalía inesperada en el módulo
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nuestro sistema de telemetría ha registrado el incidente automáticamente para el equipo de ingeniería de HEIS. Tus transacciones en servidor están protegidas.
            </p>
            {this.state.eventId && (
              <div className="text-[11px] font-mono text-slate-500 bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800">
                Código de Auditoría: {this.state.eventId}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Módulo de Forma Segura
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
