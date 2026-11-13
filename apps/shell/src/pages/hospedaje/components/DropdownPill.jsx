import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * DropdownPill - Selector tipo cápsula con búsqueda integrada y scroll suave
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
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all text-left cursor-pointer font-sora ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''
        } ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/40 dark:bg-blue-950/40 border'
            : 'bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 hover:border-blue-400/80 hover:bg-slate-50/80 dark:hover:bg-slate-800 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {IconComponent && (
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
              isOpen
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80'
            }`}>
              <IconComponent className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold truncate block ${selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.badge && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shrink-0 font-mono">
                  {selectedOption.badge}
                </span>
              )}
            </div>
            {selectedOption?.subtitle && (
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                {selectedOption.subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
              isOpen ? `${isUp ? 'rotate-0' : 'rotate-180'} text-blue-600 dark:text-blue-400` : `${isUp ? 'rotate-180' : ''}`
            }`}
          />
        </div>
      </button>

      {/* Menú Desplegable con efecto Cristal */}
      {isOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            isUp ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'
          } left-0 right-0 bg-white/95 dark:bg-[#0c1427]/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-2 z-[99999] animate-in fade-in zoom-in-95 duration-150 flex flex-col scroll-mb-6`}
          style={{ maxHeight: '270px', scrollMarginBottom: '24px' }}
        >
          {isSearchable && (
            <div className="flex items-center gap-2 px-3 py-2 mb-1.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200/90 dark:border-slate-800 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-none"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="space-y-1 overflow-y-auto custom-scrollbar pr-0.5 flex-1 min-h-0">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-slate-400 font-medium">
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
                    className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer font-sora ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/60 border border-blue-300/90 dark:border-blue-800/80 shadow-2xs'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {OptIcon && (
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}>
                          <OptIcon className="w-3 h-3" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold truncate ${
                            isSelected ? 'text-blue-950 dark:text-blue-300 font-black' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 shrink-0 font-mono">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subtitle && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                            {opt.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
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
