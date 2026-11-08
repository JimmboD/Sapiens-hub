/* Rellena una página de proyecto con los datos de /projects.json.
   La página indica su proyecto con <body data-slug="...">. */
(function () {
  const slug = document.body.dataset.slug;
  const COLORS = ["var(--red)", "var(--green)", "var(--blue)", "var(--gold)", "var(--purple)"];
  const $ = (id) => document.getElementById(id);

  fetch("/projects.json", { cache: "no-store" })
    .then((r) => r.json())
    .then((projects) => {
      const i = projects.findIndex((p) => p.slug === slug);
      if (i < 0) throw new Error("proyecto no encontrado");
      const p = projects[i];

      document.title = `${p.titulo} · Sapiens Hub`;
      $("p-hero").style.setProperty("--c", COLORS[i % COLORS.length]);
      $("p-title").textContent = p.titulo;
      $("p-area").textContent = p.area;
      $("p-summary").textContent = p.resumen;

      const tags = $("p-tags");
      (p.etiquetas || []).forEach((t) => {
        const s = document.createElement("span");
        s.className = "tag";
        s.textContent = t;
        tags.appendChild(s);
      });

      if (p.puerto) {
        const link = $("p-app");
        link.href = `${location.protocol}//${location.hostname}:${p.puerto}/`;
        link.textContent = `Abrir la app en el puerto ${p.puerto}`;
        $("p-app-wrap").hidden = false;
      }
    })
    .catch(() => {
      $("p-title").textContent = "Proyecto no encontrado";
      $("p-summary").textContent = "Revisa que el proyecto exista en projects.json.";
    });
})();
