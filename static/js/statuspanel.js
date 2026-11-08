/* Panel lateral con el estado del servidor, en todas las páginas.
   Cada métrica es una sección desplegable. Consulta /api/status cada 3 segundos
   y también mueve el ECG de la portada. */
(function () {
  const row = document.querySelector(".topbar-main");
  if (!row) return;

  const POLL_MS = 3000;
  const KEY = "sapiens-panel";
  const wide = window.matchMedia("(min-width: 900px)");
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* sin almacenamiento */ } },
  };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // Orden de las secciones del panel.
  const ITEMS = [
    { id: "bat", name: "Batería", icon: "battery", tone: "gold", parts: [{ id: "bat", meter: true }] },
    { id: "cpu", name: "Procesador", icon: "cpu", tone: "blue", parts: [{ id: "cpu", meter: true }] },
    { id: "ram", name: "Memoria RAM", icon: "ram", tone: "green", parts: [{ id: "ram", meter: true }] },
    { id: "temp", name: "Temperatura", icon: "thermometer", tone: "red", parts: [{ id: "temp", meter: true }] },
    {
      id: "disk", name: "Disco", icon: "disk", tone: "purple",
      parts: [{ id: "disk", label: "Sistema", meter: true }, { id: "usb", label: "Memoria USB", meter: true }],
    },
    { id: "net", name: "Red", icon: "net", tone: "blue", parts: [{ id: "net-down", label: "Bajada" }, { id: "net-up", label: "Subida" }] },
    { id: "up", name: "Tiempo encendido", icon: "clock", tone: "green", parts: [{ id: "up" }] },
  ];

  // Botón del encabezado para mostrar u ocultar el panel
  const toggle = el("button", "panel-toggle");
  toggle.type = "button";
  toggle.setAttribute("aria-controls", "status-panel");
  toggle.append(window.makeIcon("panel", "i sm"), el("span", null, "Estado"));
  row.prepend(toggle);

  // Panel
  const panel = el("aside", "status-panel");
  panel.id = "status-panel";
  panel.setAttribute("aria-label", "Estado del servidor");

  const live = el("p", "panel-live");
  const dot = el("span", "dot");
  const liveText = el("span", null, "Conectando…");
  live.append(dot, liveText);

  const hint = el("p", "panel-hint");
  hint.hidden = true;
  hint.append("Revisa que el backend esté en marcha con ");
  hint.appendChild(el("code", null, "uvicorn main:app --host 0.0.0.0 --port 8000"));
  hint.append(".");

  const list = el("div", "stat-list");
  panel.append(el("h2", null, "Estado del servidor"), live, hint, list);

  const backdrop = el("div", "panel-backdrop");
  backdrop.hidden = true;

  const summaries = {};
  const parts = {};
  let batIcon = null;

  ITEMS.forEach((it) => {
    const d = el("details", "stat-item");
    d.dataset.tone = it.tone;

    const sum = document.createElement("summary");
    const chip = el("span", "chip sm");
    const icon = window.makeIcon(it.icon, "i sm");
    chip.appendChild(icon);
    if (it.id === "bat") batIcon = icon;
    const value = el("span", "stat-value", "--");
    summaries[it.id] = value;
    sum.append(chip, el("span", "stat-name", it.name), value);

    const body = el("div", "stat-body");
    it.parts.forEach((p) => {
      const part = el("div", "part");
      const ref = {};
      if (p.label) {
        const head = el("div", "part-head");
        ref.value = el("span", "part-value", "--");
        head.append(el("span", null, p.label), ref.value);
        part.appendChild(head);
      }
      if (p.meter) {
        const bar = el("div", "bar");
        ref.fill = document.createElement("i");
        bar.appendChild(ref.fill);
        part.appendChild(bar);
      }
      ref.detail = el("p", "detail");
      part.appendChild(ref.detail);
      parts[p.id] = ref;
      body.appendChild(part);
    });

    d.append(sum, body);
    list.appendChild(d);
  });

  document.body.append(panel, backdrop);

  // Mostrar u ocultar. En pantallas anchas empuja el contenido; en pequeñas es un cajón.
  function setOpen(open, remember) {
    panel.classList.toggle("open", open);
    document.body.classList.toggle("panel-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    backdrop.hidden = !(open && !wide.matches);
    if (remember && wide.matches) store.set(open ? "open" : "closed");
  }
  const defaultOpen = () => (wide.matches ? store.get() !== "closed" : false);

  setOpen(defaultOpen(), false);
  toggle.addEventListener("click", () => setOpen(!panel.classList.contains("open"), true));
  backdrop.addEventListener("click", () => setOpen(false, false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("open") && !wide.matches) {
      setOpen(false, false);
      toggle.focus();
    }
  });
  wide.addEventListener("change", () => setOpen(defaultOpen(), false));

  // Datos
  const fmtGB = (n) => `${n.toFixed(1)} GB`;
  const fmtRate = (bps) => {
    if (bps >= 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
    if (bps >= 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${Math.round(bps)} B/s`;
  };
  const fmtUptime = (s) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return d > 0 ? `${d} d ${h} h` : h > 0 ? `${h} h ${m} min` : `${m} min`;
  };

  function setPart(id, detail, percent, value) {
    const r = parts[id];
    r.detail.textContent = detail || "";
    if (r.fill) r.fill.style.width = `${Math.min(100, Math.max(0, percent || 0))}%`;
    if (r.value && value != null) r.value.textContent = value;
  }

  function render(s) {
    if (s.battery) {
      summaries.bat.textContent = `${s.battery.percent}%`;
      setPart("bat", s.battery.plugged ? "Conectada a la corriente" : "Funcionando con batería", s.battery.percent);
      batIcon.firstElementChild.setAttribute("href", s.battery.plugged ? "#i-bolt" : "#i-battery");
    } else {
      summaries.bat.textContent = "--";
      setPart("bat", "No se detectó batería", 0);
    }

    summaries.cpu.textContent = `${Math.round(s.cpu.percent)}%`;
    setPart("cpu", `${s.cpu.cores} núcleos, carga ${s.cpu.load.join(" / ")}`, s.cpu.percent);

    summaries.ram.textContent = `${Math.round(s.ram.percent)}%`;
    setPart("ram", `${fmtGB(s.ram.used_gb)} en uso de ${fmtGB(s.ram.total_gb)}`, s.ram.percent);

    if (s.temp_c != null) {
      summaries.temp.textContent = `${Math.round(s.temp_c)}°C`;
      setPart("temp", "Lectura del sensor más caliente", (s.temp_c / 90) * 100);
    } else {
      summaries.temp.textContent = "--";
      setPart("temp", "Este equipo no reporta temperatura", 0);
    }

    if (s.disk) {
      summaries.disk.textContent = `${Math.round(s.disk.percent)}%`;
      setPart("disk", `${fmtGB(s.disk.free_gb)} libres de ${fmtGB(s.disk.total_gb)}`, s.disk.percent, `${Math.round(s.disk.percent)}%`);
    } else {
      summaries.disk.textContent = "--";
      setPart("disk", "No se pudo leer el disco", 0, "--");
    }
    if (s.usb) setPart("usb", `${fmtGB(s.usb.free_gb)} libres de ${fmtGB(s.usb.total_gb)}`, s.usb.percent, `${Math.round(s.usb.percent)}%`);
    else setPart("usb", "No hay USB montado en la ruta configurada", 0, "--");

    summaries.net.textContent = `↓ ${fmtRate(s.net.down_bps)}`;
    setPart("net-down", "", 0, fmtRate(s.net.down_bps));
    setPart("net-up", "", 0, fmtRate(s.net.up_bps));

    summaries.up.textContent = fmtUptime(s.uptime_s);
    setPart("up", `${s.host}, ${s.os}`, 0);

    // Pulso del ECG de la portada: sube con la carga del procesador.
    const bpm = Math.round(58 + s.cpu.percent * 0.7);
    const bpmEl = document.getElementById("bpm");
    if (bpmEl) bpmEl.textContent = bpm;
    if (window.setBpm) window.setBpm(bpm);
  }

  function setLive(ok) {
    panel.classList.toggle("stale", !ok);
    live.classList.toggle("ok", ok);
    live.classList.toggle("bad", !ok);
    hint.hidden = ok;
    liveText.textContent = ok
      ? `En línea, actualizado ${new Date().toLocaleTimeString("es-MX")}`
      : "Sin conexión con el servidor";
  }

  async function poll() {
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status);
      render(await r.json());
      setLive(true);
    } catch (e) {
      setLive(false);
    }
  }

  poll();
  setInterval(poll, POLL_MS);
})();
