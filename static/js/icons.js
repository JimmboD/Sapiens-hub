/* Iconos de trazo (24×24) en un sprite SVG inyectado en la página.
   Uso en HTML:  <svg class="i"><use href="#i-cpu"/></svg>
   Uso en JS:    window.makeIcon("cpu", "i")  → elemento <svg>
   El color y el grosor vienen del CSS (currentColor, .i). */
(function () {
  const ICONS = {
    cpu: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    ram: '<rect x="2" y="6" width="20" height="11" rx="1.5"/><path d="M6 17v3M10 17v3M14 17v3M18 17v3M6 10v3M10 10v3M14 10v3M18 10v3"/>',
    disk: '<path d="M2 12h20"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01M10 16h.01"/>',
    usb: '<circle cx="12" cy="20" r="1.8"/><path d="M12 18.2V4M9.5 6.5 12 3.5l2.5 3"/><path d="M12 13 8 10.5V8.8"/><circle cx="8" cy="7.2" r="1.4"/><path d="M12 15.5l4-2.5v-2.5"/><rect x="14.7" y="8" width="2.6" height="2.5"/>',
    thermometer: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',
    battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10.5v3M10 10.5v3"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    net: '<path d="M7 20V4M3 8l4-4 4 4M17 4v16M13 16l4 4 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "heart-pulse": '<path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11z"/><path d="M3 12.5h4.5l1.8-3 3 5.5 1.7-2.5H21"/>',
    waveform: '<path d="M2 12h3l2.5-7 3 14 3-10 2 3H22"/>',
    sigma: '<path d="M18 5H6l6 7-6 7h12"/>',
    graph: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8.5 6.4l7 1.2M7.3 8.2l3.6 7.6M16.7 10.2l-3.6 5.6"/>',
    lattice: '<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/><path d="M12 12l8.5-5M12 12v10M12 12 3.5 7"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'
  };

  const NS = "http://www.w3.org/2000/svg";

  const sprite = document.createElementNS(NS, "svg");
  sprite.setAttribute("aria-hidden", "true");
  sprite.setAttribute("width", "0");
  sprite.setAttribute("height", "0");
  sprite.style.position = "absolute";
  for (const [name, body] of Object.entries(ICONS)) {
    const sym = document.createElementNS(NS, "symbol");
    sym.id = "i-" + name;
    sym.setAttribute("viewBox", "0 0 24 24");
    sym.innerHTML = body;
    sprite.appendChild(sym);
  }
  document.body.prepend(sprite);

  window.makeIcon = function (name, cls) {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", cls || "i");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#i-" + (ICONS[name] ? name : "box"));
    svg.appendChild(use);
    return svg;
  };
})();
