import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

/**
 * Hook de física y medición continua para la píldora indicadora deslizante (Magic Sliding Indicator)
 * Garantiza animación fluida de 60fps con transiciones de aceleración orgánica.
 */
export function useSlidingPill(containerRef, activeSelector, dependencies = []) {
  const [pillState, setPillState] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    visible: false,
    ready: false,
    animating: false,
  });

  const hasMountedRef = useRef(false);

  const updatePosition = useCallback(() => {
    if (!containerRef.current || !activeSelector) {
      setPillState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const containerEl = containerRef.current;
    const targetEl = containerEl.querySelector(activeSelector);

    if (!targetEl) {
      setPillState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const containerRect = containerEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const top = targetRect.top - containerRect.top + containerEl.scrollTop;
    const left = targetRect.left - containerRect.left + containerEl.scrollLeft;
    const width = targetRect.width;
    const height = targetRect.height;

    const isFirst = !hasMountedRef.current;

    setPillState({
      top,
      left,
      width,
      height,
      visible: true,
      ready: !isFirst,
      animating: !isFirst,
    });

    if (isFirst) {
      requestAnimationFrame(() => {
        hasMountedRef.current = true;
        setPillState((prev) => ({ ...prev, ready: true, animating: true }));
      });
    }
  }, [containerRef, activeSelector]);

  useLayoutEffect(() => {
    updatePosition();
    const frameId = requestAnimationFrame(() => {
      updatePosition();
    });
    return () => cancelAnimationFrame(frameId);
  }, [updatePosition, ...dependencies]);

  useEffect(() => {
    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updatePosition();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updatePosition, containerRef]);

  return pillState;
}

