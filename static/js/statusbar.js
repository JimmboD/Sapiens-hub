/* Barra de estado del servidor, fija bajo el encabezado en todas las páginas.
   Consulta /api/status cada 3 segundos y también mueve el ECG de la portada. */
(function () {
  const header = document.querySelector(".topbar");
  if (!header) return;

  const POLL_MS = 3000;

  const bar = document.createElement("div");
  bar.className = "statusbar";
  bar.setAttribute("role", "status");
  bar.setAttribute("aria-label", "Estado del servidor");
  const inner = document.createElement("div");
  inner.className = "wrap statusbar-inner";
  bar.appendChild(inner);
  header.appendChild(bar);

  const ITEMS = [
    { key: "cpu", label: "CPU", name: "Procesador", icon: "cpu", tone: "blue", meter: true },
    { key: "ram", label: "RAM", name: "Memoria RAM", icon: "ram", tone: "green", meter: true },
    { key: "temp", label: "Temp", name: "Temperatura", icon: "thermometer", tone: "red", meter: true },
    { key: "bat", label: "Batería", name: "Batería", icon: "battery", tone: "gold", meter: true },
    { key: "disk", label: "Disco", name: "Disco del sistema", icon: "disk", tone: "gold", meter: true },
    { key: "usb", label: "USB", name: "Memoria USB", icon: "usb", tone: "purple", meter: true },
    { key: "net", label: "Red", name: "Red", icon: "net", tone: "blue", meter: false },
    { key: "up", label: "Activo", name: "Tiempo encendido", icon: "clock", tone: "green", meter: false },
  ];

  // Indicador de conexión
  const live = document.createElement("span");
  live.className = "stat live";
  const dot = document.createElement("span");
  dot.className = "dot";
  const liveText = document.createElement("span");
  liveText.textContent = "Conectando…";
  live.append(dot, liveText);
  inner.appendChild(live);

  // Un elemento por métrica: icono, etiqueta, valor y barrita opcional.
  const refs = {};
  ITEMS.forEach((it) => {
    const root = document.createElement("span");
    root.className = "stat";
    root.dataset.tone = it.tone;
    root.title = `${it.name}: sin datos todavía`;

    const icon = window.makeIcon(it.icon, "i sm");
    const label = document.createElement("span");
    label.className = "stat-label";
    label.textContent = it.label;
    const value = document.createElement("span");
    value.className = "stat-value";
    value.textContent = "--";
    root.append(icon, label, value);

    let fill = null;
    if (it.meter) {
      const mini = document.createElement("span");
      mini.className = "mini";
      fill = document.createElement("i");
      mini.appendChild(fill);
      root.appendChild(mini);
    }
    inner.appendChild(root);
    refs[it.key] = { root, value, fill, icon, name: it.name };
  });

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

  function set(key, text, detail, percent) {
    const r = refs[key];
    r.value.textContent = text;
    r.root.title = `${r.name}: ${detail}`;
    if (r.fill) r.fill.style.width = `${Math.min(100, Math.max(0, percent || 0))}%`;
  }

  function render(s) {
    set("cpu", `${Math.round(s.cpu.percent)}%`, `${s.cpu.cores} núcleos, carga ${s.cpu.load.join(" / ")}`, s.cpu.percent);
    set("ram", `${Math.round(s.ram.percent)}%`, `${fmtGB(s.ram.used_gb)} en uso de ${fmtGB(s.ram.total_gb)}`, s.ram.percent);

    if (s.temp_c != null) set("temp", `${Math.round(s.temp_c)}°C`, "lectura del sensor más caliente", (s.temp_c / 90) * 100);
    else set("temp", "--", "este equipo no reporta temperatura", 0);

    if (s.battery) {
      set("bat", `${s.battery.percent}%`, s.battery.plugged ? "conectada a la corriente" : "funcionando con batería", s.battery.percent);
      refs.bat.icon.firstElementChild.setAttribute("href", s.battery.plugged ? "#i-bolt" : "#i-battery");
    } else {
      set("bat", "--", "no se detectó batería", 0);
    }

    if (s.disk) set("disk", `${Math.round(s.disk.percent)}%`, `${fmtGB(s.disk.free_gb)} libres de ${fmtGB(s.disk.total_gb)}`, s.disk.percent);
    else set("disk", "--", "no se pudo leer el disco", 0);

    if (s.usb) set("usb", `${Math.round(s.usb.percent)}%`, `${fmtGB(s.usb.free_gb)} libres de ${fmtGB(s.usb.total_gb)}`, s.usb.percent);
    else set("usb", "--", "no hay USB montado en la ruta configurada", 0);

    set("net", `↓ ${fmtRate(s.net.down_bps)}  ↑ ${fmtRate(s.net.up_bps)}`, "bajada (↓) y subida (↑)", 0);
    set("up", fmtUptime(s.uptime_s), `${s.host}, ${s.os}`, 0);

    // Pulso del ECG de la portada: sube con la carga del procesador.
    const bpm = Math.round(58 + s.cpu.percent * 0.7);
    const bpmEl = document.getElementById("bpm");
    if (bpmEl) bpmEl.textContent = bpm;
    if (window.setBpm) window.setBpm(bpm);
  }

  function setLive(ok) {
    bar.classList.toggle("stale", !ok);
    live.classList.toggle("ok", ok);
    live.classList.toggle("bad", !ok);
    liveText.textContent = ok ? "En línea" : "Sin conexión con el servidor";
    live.title = ok
      ? `Actualizado a las ${new Date().toLocaleTimeString("es-MX")}`
      : "Revisa que el backend esté en marcha: uvicorn main:app --host 0.0.0.0 --port 8000";
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
