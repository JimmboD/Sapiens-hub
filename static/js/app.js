/* Dashboard de estado y mosaico de proyectos de la portada. */
(function () {
  const $ = (id) => document.getElementById(id);
  const POLL_MS = 3000;

  const NAMES = {
    cpu: "Procesador", ram: "Memoria RAM", disk: "Disco del sistema", usb: "Memoria USB",
    temp: "Temperatura", bat: "Batería", net: "Red", up: "Tiempo encendido",
  };

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

  // Valor visible; el detalle va en el tooltip y en texto para lector de pantalla.
  function setMetric(key, value, detail, percent) {
    $(`${key}-v`).textContent = value;
    const d = $(`${key}-d`);
    d.textContent = detail;
    $(`m-${key}`).title = `${NAMES[key]}: ${detail}`;
    const bar = $(`${key}-b`);
    if (bar && percent != null) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  function unavailable(key, detail) {
    setMetric(key, "--", detail, 0);
  }

  function render(s) {
    setMetric("cpu", Math.round(s.cpu.percent), `${s.cpu.cores} núcleos, carga ${s.cpu.load.join(" / ")}`, s.cpu.percent);
    setMetric("ram", Math.round(s.ram.percent), `${fmtGB(s.ram.used_gb)} de ${fmtGB(s.ram.total_gb)} en uso`, s.ram.percent);

    if (s.disk) setMetric("disk", Math.round(s.disk.percent), `${fmtGB(s.disk.free_gb)} libres de ${fmtGB(s.disk.total_gb)}`, s.disk.percent);
    else unavailable("disk", "no se pudo leer el disco");

    if (s.usb) setMetric("usb", Math.round(s.usb.percent), `${fmtGB(s.usb.free_gb)} libres de ${fmtGB(s.usb.total_gb)}`, s.usb.percent);
    else unavailable("usb", "no hay USB montado en la ruta configurada");

    if (s.temp_c != null) setMetric("temp", Math.round(s.temp_c), "sensor más caliente", Math.min(100, (s.temp_c / 90) * 100));
    else unavailable("temp", "el equipo no reporta temperatura");

    if (s.battery) {
      setMetric("bat", s.battery.percent, s.battery.plugged ? "conectada a la corriente" : "funcionando con batería", s.battery.percent);
      $("bat-i").firstElementChild.setAttribute("href", s.battery.plugged ? "#i-bolt" : "#i-battery");
    } else {
      unavailable("bat", "no se detectó batería");
    }

    $("net-v").textContent = `↓ ${fmtRate(s.net.down_bps)}`;
    $("net-d").textContent = `↑ ${fmtRate(s.net.up_bps)}`;
    $("m-net").title = `${NAMES.net}: bajada y subida`;

    $("up-v").textContent = fmtUptime(s.uptime_s);
    $("up-d").textContent = `${s.host}, ${s.os}`;
    $("m-up").title = `${NAMES.up}: ${s.host}, ${s.os}`;

    const bpm = Math.round(58 + s.cpu.percent * 0.7);
    $("bpm").textContent = bpm;
    if (window.setBpm) window.setBpm(bpm);
  }

  function setLive(ok) {
    const live = $("live");
    live.classList.toggle("ok", ok);
    live.classList.toggle("bad", !ok);
    const text = ok
      ? `En línea, actualizado ${new Date().toLocaleTimeString("es-MX")}`
      : "Sin conexión con el servidor";
    $("live-text").textContent = text;
    live.title = text;
    $("notice").hidden = ok;
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

  const STATES = {
    "en-linea": ["En línea", "on"],
    "en-desarrollo": ["En desarrollo", "dev"],
    "pendiente": ["Pendiente", ""],
  };
  const COLORS = ["var(--red)", "var(--green)", "var(--blue)", "var(--gold)", "var(--purple)"];

  async function loadProjects() {
    const list = $("project-list");
    try {
      const r = await fetch("/projects.json", { cache: "no-store" });
      const projects = await r.json();
      list.innerHTML = "";
      projects.forEach((p, i) => {
        const [label, cls] = STATES[p.estado] || STATES.pendiente;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "tile";
        a.href = `/projects/${p.slug}/`;
        a.style.setProperty("--c", COLORS[i % COLORS.length]);
        a.title = `${p.titulo}: ${p.area}`;

        const state = document.createElement("span");
        state.className = `state ${cls}`;
        state.title = label;
        const stateText = document.createElement("span");
        stateText.className = "sr";
        stateText.textContent = label;

        const icon = window.makeIcon(p.icono, "i lg");
        const h = document.createElement("h3");
        h.textContent = p.titulo;

        a.append(state, stateText, icon, h);
        li.appendChild(a);
        list.appendChild(li);
      });
    } catch (e) {
      list.innerHTML = '<li class="notice">No se pudo cargar la lista de proyectos. Revisa que exista <code>static/projects.json</code>.</li>';
    }
  }

  loadProjects();
  poll();
  setInterval(poll, POLL_MS);
})();
