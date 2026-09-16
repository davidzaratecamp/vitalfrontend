// jsdom no implementa matchMedia ni ResizeObserver; los componentes de layout
// (tema del sistema) y algunos primitivos de Radix los necesitan para montar.
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Tampoco implementa scrollIntoView — hace falta para abrir un <Select> de
// Radix (posiciona la opción resaltada al abrir).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
