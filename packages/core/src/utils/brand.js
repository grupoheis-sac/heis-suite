/**
 * Sincronizador en tiempo real de Marca Blanca (Brand & White-label)
 * Actualiza el título y el favicon de la pestaña del navegador
 */
export function applyBrandToTab({
  businessName,
  businessLogoUrl,
  defaultTitle = 'HEIS SAC',
  defaultFavicon = '/favicon.png'
} = {}) {
  if (typeof document === 'undefined') return;

  // 1. Título de la pestaña
  const title = (businessName && businessName.trim()) ? businessName.trim() : defaultTitle;
  if (document.title !== title) {
    document.title = title;
  }

  // 2. Favicon (Logo de la pestaña)
  const iconUrl = (businessLogoUrl && businessLogoUrl.trim()) ? businessLogoUrl.trim() : defaultFavicon;
  if (iconUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (link.getAttribute('href') !== iconUrl) {
      link.href = iconUrl;
    }

    let appleLink = document.querySelector("link[rel='apple-touch-icon']");
    if (!appleLink) {
      appleLink = document.createElement('link');
      appleLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleLink);
    }
    if (appleLink.getAttribute('href') !== iconUrl) {
      appleLink.href = iconUrl;
    }
  }
}
