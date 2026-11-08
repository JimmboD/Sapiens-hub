/* Trazo de ECG sintético que avanza de izquierda a derecha.
   El ritmo (lpm) lo fija window.setBpm(); la portada lo liga a la carga de CPU. */
(function () {
  const canvas = document.getElementById("ecg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let bpm = 62;
  window.setBpm = (v) => { bpm = Math.max(40, Math.min(150, v)); };

  const g = (x, mu, s, a) => a * Math.exp(-((x - mu) ** 2) / (2 * s * s));

  // Un latido PQRST en la fase t ∈ [0, 1).
  function beat(t) {
    return (
      g(t, 0.16, 0.025, 0.12) +   // P
      g(t, 0.285, 0.008, -0.14) + // Q
      g(t, 0.31, 0.010, 1.0) +    // R
      g(t, 0.335, 0.010, -0.28) + // S
      g(t, 0.52, 0.045, 0.28)     // T
    );
  }

  let w = 0, h = 0, dpr = 1;
  const PX_PER_S = 140;
  let samples, head = 0, phase = 0, last = performance.now();

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    w = Math.floor(r.width);
    h = Math.floor(r.height);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    samples = new Float32Array(w).fill(0);
    head = 0;
  }
  window.addEventListener("resize", resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, w, h);

    // Cuadrícula tenue, como papel de electrocardiograma.
    ctx.strokeStyle = "rgba(88,196,221,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 20) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y < h; y += 20) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();

    const base = h * 0.68;
    const amp = h * 0.55;
    const gap = 18; // hueco delante del cursor

    ctx.strokeStyle = "#fc6255";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < w; i++) {
      const dist = (i - head + w) % w;
      if (dist < gap) { pen = false; continue; }
      const y = base - samples[i] * amp;
      if (!pen) { ctx.moveTo(i, y); pen = true; } else { ctx.lineTo(i, y); }
    }
    ctx.stroke();

    // Punto del cursor
    ctx.fillStyle = "#fc6255";
    ctx.beginPath();
    ctx.arc(head, base - samples[head] * amp, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    const steps = Math.max(1, Math.round(dt * PX_PER_S));
    for (let s = 0; s < steps; s++) {
      phase += (bpm / 60) / PX_PER_S;
      if (phase >= 1) phase -= 1;
      head = (head + 1) % w;
      samples[head] = beat(phase) + (Math.random() - 0.5) * 0.012;
    }
    draw();
    requestAnimationFrame(frame);
  }

  if (reduce) {
    // Sin movimiento: se dibuja una tira estática de latidos.
    for (let i = 0; i < w; i++) samples[i] = beat(((i / PX_PER_S) * (bpm / 60)) % 1);
    head = w - 1;
    draw();
  } else {
    requestAnimationFrame(frame);
  }
})();
