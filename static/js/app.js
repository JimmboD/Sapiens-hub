/* Tarjetas de proyectos de la portada. El estado del servidor lo maneja statuspanel.js. */
(function () {
  const $ = (id) => document.getElementById(id);

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
})();
