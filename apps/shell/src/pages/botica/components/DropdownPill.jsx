import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * DropdownPill - Componente selector tipo píldora farmacéutica con diseño Tema Botica,
 * búsqueda integrada y auto-scroll suave que enfoca automáticamente el menú al abrirse.
 *
 * @param {string|number} value - Valor seleccionado actualmente
 * @param {function} onChange - Callback invocado al seleccionar (value) => void
 * @param {Array<string|object>} options - Lista de opciones ['Caja', 'Frasco'] o [{ value, label, icon, subtitle, badge }]
 * @param {string} [label] - Etiqueta superior del campo
 * @param {string} [placeholder] - Texto por defecto cuando no hay selección
 * @param {React.ComponentType} [icon] - Ícono Lucide principal para la píldora
 * @param {boolean} [searchable] - Si muestra buscador (por defecto true si opciones > 5)
 * @param {string} [searchPlaceholder] - Placeholder del buscador
 * @param {string} [direction='down'] - 'down' (hacia abajo) o 'up' (hacia arriba)
 * @param {string} [className] - Clases para el contenedor exterior
 * @param {boolean} [disabled] - Deshabilitar interacción
 */
export default function DropdownPill({
  value,
  onChange,
  options = [],
  label,
  placeholder = 'Seleccionar...',
  icon: IconComponent,
  searchable,
  searchPlaceholder = 'Buscar opción...',
  direction = 'down',
  className = '',
  disabled = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // Normalizar opciones a formato { value, label, icon, subtitle, badge }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.value ?? opt.id ?? opt.label,
      label: opt.label ?? opt.nombre ?? String(opt.value ?? ''),
      icon: opt.icon,
      subtitle: opt.subtitle ?? opt.descripcion,
      badge: opt.badge
    };
  });

  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const isSearchable = searchable ?? normalizedOptions.length > 5;

  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    );
  });

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Auto-scroll suave que enfoca y revela el menú completo al abrirse
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (menuRef.current) {
          menuRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange && onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const [computedDirection, setComputedDirection] = useState(direction);

  useEffect(() => {
    if (direction === 'up') {
      setComputedDirection('up');
      return;
    }
    if (direction === 'down') {
      setComputedDirection('down');
      return;
    }

    // Auto-detección de colisión con los bordes de la pantalla / modal
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setComputedDirection('up');
      } else {
        setComputedDirection('down');
      }
    }
  }, [isOpen, direction]);

  const isUp = computedDirection === 'up';

  return (
    <div
      ref={containerRef}
      className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`}
    >
      {label && (
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
          <span>{label} {required && <strong className="text-rose-500">*</strong>}</span>
        </label>
      )}

      {/* Botón Píldora Principal */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border transition-all text-left cursor-pointer shadow-2xs font-sora ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm bg-emerald-50/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50/60'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {IconComponent && (
            <div className="w-6 h-6 rounded-lg bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-center shrink-0 shadow-2xs">
              <IconComponent className="w-3.5 h-3.5 text-[#00B884]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className={`text-xs font-bold truncate block ${selectedOption ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.subtitle && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {selectedOption.subtitle}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? `${isUp ? 'rotate-0' : 'rotate-180'} text-emerald-600` : `${isUp ? 'rotate-180' : ''}`
          }`}
        />
      </button>

      {/* Menú Desplegable Diseñado */}
      {isOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            isUp ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
          } left-0 right-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/95 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col scroll-mb-6`}
          style={{ maxHeight: '250px', scrollMarginBottom: '24px' }}
        >
          {/* Buscador integrado si es buscable */}
          {isSearchable && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 mb-1 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-[11px] font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Lista de Opciones */}
          <div className="space-y-0.5 overflow-y-auto custom-scrollbar pr-0.5 flex-1 min-h-0">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-slate-400 font-medium">
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                const OptIcon = opt.icon;

                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer font-sora ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-300/80 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {OptIcon && (
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#EBFDF6] border-[#A6F6D8] text-[#00855E]'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}>
                          <OptIcon className="w-3 h-3" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? 'text-emerald-950 dark:text-emerald-300 font-black' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtitle && (
                          <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                            {opt.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
