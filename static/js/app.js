/* Dashboard de estado y tarjetas de proyectos de la portada. */
(function () {
  const $ = (id) => document.getElementById(id);
  const POLL_MS = 3000;

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

  function setMetric(key, value, detail, percent) {
    $(`${key}-v`).textContent = value;
    $(`${key}-d`).textContent = detail;
    const bar = $(`${key}-b`);
    if (bar && percent != null) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }

  function unavailable(key, detail) {
    setMetric(key, "--", detail, 0);
  }

  function render(s) {
    setMetric("cpu", Math.round(s.cpu.percent), `${s.cpu.cores} núcleos · carga ${s.cpu.load.join(" / ")}`, s.cpu.percent);
    setMetric("ram", Math.round(s.ram.percent), `${fmtGB(s.ram.used_gb)} en uso de ${fmtGB(s.ram.total_gb)}`, s.ram.percent);

    if (s.temp_c != null) setMetric("temp", Math.round(s.temp_c), "Lectura del sensor más caliente", Math.min(100, (s.temp_c / 90) * 100));
    else unavailable("temp", "Este equipo no reporta temperatura");

    if (s.battery) {
      setMetric("bat", s.battery.percent, s.battery.plugged ? "Conectada a la corriente" : "Funcionando con batería", s.battery.percent);
      $("bat-i").firstElementChild.setAttribute("href", s.battery.plugged ? "#i-bolt" : "#i-battery");
    } else {
      unavailable("bat", "No se detectó batería");
    }

    if (s.disk) setMetric("disk", Math.round(s.disk.percent), `${fmtGB(s.disk.free_gb)} libres de ${fmtGB(s.disk.total_gb)}`, s.disk.percent);
    else unavailable("disk", "No se pudo leer el disco");

    if (s.usb) setMetric("usb", Math.round(s.usb.percent), `${fmtGB(s.usb.free_gb)} libres de ${fmtGB(s.usb.total_gb)}`, s.usb.percent);
    else unavailable("usb", "No hay USB montado en la ruta configurada");

    $("net-v").textContent = fmtRate(s.net.down_bps);
    $("net-d").textContent = `Subida: ${fmtRate(s.net.up_bps)}`;

    $("up-v").textContent = fmtUptime(s.uptime_s);
    $("up-d").textContent = `${s.host} · ${s.os}`;

    const bpm = Math.round(58 + s.cpu.percent * 0.7);
    $("bpm").textContent = bpm;
    if (window.setBpm) window.setBpm(bpm);
  }

  function setLive(ok) {
    const live = $("live");
    live.classList.toggle("ok", ok);
    live.classList.toggle("bad", !ok);
    $("live-text").textContent = ok ? "En línea" : "Sin conexión";
    $("live-time").textContent = ok ? new Date().toLocaleTimeString("es-MX") : "";
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
  const TONES = ["red", "green", "blue", "gold", "purple"];

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
        a.className = "card project";
        a.href = `/projects/${p.slug}/`;
        a.dataset.tone = TONES[i % TONES.length];

        const top = document.createElement("div");
        top.className = "project-top";
        const chip = document.createElement("span");
        chip.className = "chip lg";
        chip.appendChild(window.makeIcon(p.icono, "i"));
        const badge = document.createElement("span");
        badge.className = `badge ${cls}`;
        const dot = document.createElement("span");
        dot.className = "dot";
        badge.append(dot, label);
        top.append(chip, badge);

        const h = document.createElement("h3");
        h.textContent = p.titulo;
        const area = document.createElement("p");
        area.className = "area";
        area.textContent = p.area;
        const sum = document.createElement("p");
        sum.className = "summary";
        sum.textContent = p.resumen;
        const tags = document.createElement("div");
        tags.className = "tags";
        (p.etiquetas || []).forEach((t) => {
          const s = document.createElement("span");
          s.className = "tag";
          s.textContent = t;
          tags.appendChild(s);
        });

        a.append(top, h, area, sum, tags);
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
