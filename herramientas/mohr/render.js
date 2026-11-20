/* RuizAcademy · mohr/render.js
   Dibuja el círculo de Mohr (SVG) y el elemento de tensiones girado un ángulo θ.
   La geometría usa τ de Cauchy hacia arriba. Con el convenio "horario" el eje τ se rotula
   positivo hacia abajo, que es la misma geometría con otra etiqueta.

   Dos disposiciones del círculo:
   - "wide" (ordenador): SVG apaisado de 760 px de ancho de dibujo.
   - "tall" (móvil, SVG de menos de 600 px): el círculo ocupa todo el ancho y el alto se ajusta al contenido. */

import { formatNumber as f, clamp } from "../../assets/js/common.js";
import { wrapAngle } from "./solver.js";

const MODES = {
  wide: { W: 760, H: 540, m: { l: 56, r: 24, t: 28, b: 36 }, pad: 0.14 },
  tall: { W: 400, m: { l: 46, r: 14, t: 14, b: 22 }, pad: 0.04 },
};
const TALL_BELOW = 600; // anchura del SVG (px) por debajo de la cual se usa la disposición vertical
const DEG = 180 / Math.PI;

const r1 = (n) => Number(n.toFixed(1));
const text = (x, y, s, anchor = "middle", cls = "plot-value") =>
  `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${s}</text>`;
const line = (x1, y1, x2, y2, cls) =>
  `<line class="${cls}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
const dot = (x, y, radius, cls) => `<circle class="${cls}" cx="${r1(x)}" cy="${r1(y)}" r="${radius}"/>`;

/* Paso de cuadrícula redondeado (1, 2, 5 por una potencia de 10) para unas `target` divisiones */
function niceStep(span, target) {
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}

const decimals = (step) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));

/* Escala común en σ y τ para que el círculo sea un círculo */
function layout(res, mode) {
  const { W, m, pad: padK } = MODES[mode];
  const lo = Math.min(res.s2, 0);
  const hi = Math.max(res.s1, 0);
  const half = res.radius > 0 ? res.radius : Math.max((hi - lo) / 4, 1);
  const pad = padK * Math.max(hi - lo, 2 * half);
  const sLo = lo - pad;
  const sHi = hi + pad;
  const pw = W - m.l - m.r;

  let k;
  let tHalf;
  let H;
  if (mode === "wide") {
    H = MODES.wide.H;
    tHalf = half + pad;
    k = Math.min(pw / (sHi - sLo), (H - m.t - m.b) / (2 * tHalf));
  } else {
    k = Math.min(pw / (sHi - sLo), 480 / (2 * (half + pad))); // por anchura; el tope evita dibujos altísimos
    tHalf = half + pad + 34 / k; // hueco fijo para las etiquetas que quedan fuera del círculo
    H = Math.max(300, Math.round(2 * tHalf * k + m.t + m.b));
  }
  const ox = m.l + (pw - (sHi - sLo) * k) / 2;
  const oy = m.t + (H - m.t - m.b) / 2;
  const X = (s) => ox + (s - sLo) * k;
  const Y = (t) => oy - t * k;
  return { mode, W, H, k, sLo, sHi, tHalf, X, Y, cx: X(res.center), cy: Y(0), scale: mode === "tall" ? 1.25 : 1 };
}

/* Posición de la etiqueta de un punto de la circunferencia: a `d` px en la dirección radial
   (d > 0 por fuera, d < 0 por dentro) y `shift` px a lo largo de la tangente */
function place(g, p, d, shift = 0) {
  const vx = p[0] - g.cx;
  const vy = p[1] - g.cy;
  const len = Math.hypot(vx, vy);
  const [ux, uy] = len < 1e-6 ? [0.7, -0.7] : [vx / len, vy / len];
  return [clamp(p[0] + d * ux - shift * uy, 12, g.W - 12), clamp(p[1] + d * uy + shift * ux + 5, 14, g.H - 6)];
}

function drawCircle(res, g) {
  const { X, Y, k, sLo, sHi, tHalf, cx, cy, scale: s } = g;
  const { center, radius, s1, s2, sign, tauC, input } = res;
  const o = [];

  /* Cuadrícula y ejes */
  const target = g.mode === "tall" ? 4 : 6;
  const sStep = niceStep(sHi - sLo, target);
  for (let i = Math.ceil(sLo / sStep); i * sStep <= sHi + 1e-9; i++) {
    const v = i * sStep;
    o.push(line(X(v), Y(tHalf), X(v), Y(-tHalf), "plot-grid"));
    o.push(text(X(v), cy + 16 * s, f(v, decimals(sStep))));
  }
  const tStep = niceStep(2 * tHalf, target);
  for (let i = Math.ceil(-tHalf / tStep); i * tStep <= tHalf + 1e-9; i++) {
    const v = i * tStep;
    o.push(line(X(sLo), Y(v), X(sHi), Y(v), "plot-grid"));
    if (i !== 0) o.push(text(X(sLo) - 6, Y(v) + 4, f(sign * v, decimals(tStep)), "end")); // en el borde, lejos de los puntos
  }
  o.push(line(X(sLo), cy, X(sHi), cy, "plot-axis"), line(X(0), Y(tHalf), X(0), Y(-tHalf), "plot-axis"));

  /* Títulos de los ejes: el de σ debajo de las cifras, el de τ en el extremo del eje */
  o.push(text(X(sHi), cy + 34 * s, "σ [MPa]", "end"));
  const titleX = X(0) < g.W / 2 ? [X(0) + 8, "start"] : [X(0) - 8, "end"];
  o.push(
    sign === 1
      ? text(titleX[0], Y(tHalf) + 14 * s, "τ [MPa]", titleX[1])
      : text(titleX[0], Y(-tHalf) - 6, "τ [MPa], positivo hacia abajo", titleX[1])
  );

  /* Círculo, diámetro XY y puntos fijos */
  o.push(`<circle class="plot-circle" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(radius * k)}"/>`);
  const px = [X(input.sx), Y(tauC)];
  const py = [X(input.sy), Y(-tauC)];
  o.push(line(px[0], px[1], py[0], py[1], "plot-diameter"));

  /* Arco de 2θp entre el radio CX y el eje σ */
  const alpha = Math.atan2(px[1] - cy, px[0] - cx);
  const arcR = Math.min(36 * s, radius * k * 0.4);
  if (!res.isotropic && Math.abs(alpha) > 1e-6 && arcR > 8) {
    const sweep = alpha < 0 ? 1 : 0;
    o.push(
      `<path class="plot-axis" fill="none" d="M${r1(cx + arcR * Math.cos(alpha))} ${r1(cy + arcR * Math.sin(alpha))}A${r1(arcR)} ${r1(arcR)} 0 0 ${sweep} ${r1(cx + arcR)} ${r1(cy)}"/>`
    );
    o.push(text(cx + arcR + 6, cy + (alpha < 0 ? -6 : 16 * s), `2θp = ${f(2 * res.thetaP)}°`, "start"));
  }

  /* Puntos X e Y: etiquetas por fuera del círculo */
  for (const [p, name] of [[px, "X"], [py, "Y"]]) {
    const label = place(g, p, 16 * s);
    o.push(dot(p[0], p[1], 5, "plot-support"), text(label[0], label[1], name));
  }

  /* Tensiones principales: σ1 se extiende hacia la derecha y σ2 hacia la izquierda, sin pisarse */
  const lw = 100 * s; // anchura aproximada de la etiqueta
  o.push(dot(X(s1), cy, 4, "plot-support"), dot(X(s2), cy, 4, "plot-support"));
  const sigma1X = Math.min(X(s1) - 6, g.W - lw);
  const arcLabelEnd = cx + arcR + 6 + 95 * s;
  const arcShown = !res.isotropic && Math.abs(alpha) > 1e-6 && arcR > 8;
  const sigma1Y = cy - (arcShown && arcLabelEnd > sigma1X - 4 ? 34 : 12) * s;
  o.push(text(sigma1X, sigma1Y, `σ1 = ${f(s1)}`, "start"));
  o.push(text(Math.max(X(s2) + 6, lw), cy - 12 * s, `σ2 = ${f(s2)}`, "end"));

  /* τ máxima: los puntos son fijos; su etiqueta se coloca en drawMoving para esquivar x′ e y′ */
  o.push(dot(cx, Y(radius), 4, "plot-support"), dot(cx, Y(-radius), 4, "plot-support"));

  /* Centro: en la segunda fila bajo el eje (la de las cifras queda libre) */
  const nearRight = cx > X(sHi) - 110 * s;
  o.push(dot(cx, cy, 3, "plot-support"), text(cx, cy + (nearRight ? 52 : 34) * s, `C = ${f(center)}`));

  o.push(`<g data-moving></g>`);
  return o.join("");
}

function drawMoving(res, g, deg) {
  const st = res.stateAt(deg);
  const p = [g.X(st.sx), g.Y(st.tauC)];
  const q = [g.X(st.sy), g.Y(-st.tauC)];
  const lp = place(g, p, -20 * g.scale, 14 * g.scale);
  const lq = place(g, q, -20 * g.scale, 14 * g.scale);

  /* Etiqueta de τmáx: dentro del círculo o fuera, según cuál no pise a X, Y, x′ ni y′ */
  const box = (x, y, w) => ({ x0: x - w / 2, x1: x + w / 2, y0: y - 14 * g.scale, y1: y + 4 });
  const overlaps = (a, b) => a.x0 < b.x1 + 4 && b.x0 < a.x1 + 4 && a.y0 < b.y1 + 2 && b.y0 < a.y1 + 2;
  const small = 24 * g.scale;
  const fixedX = place(g, [g.X(res.input.sx), g.Y(res.tauC)], 16 * g.scale);
  const fixedY = place(g, [g.X(res.input.sy), g.Y(-res.tauC)], 16 * g.scale);
  const others = [lp, lq, fixedX, fixedY].map((l) => box(l[0], l[1], small));
  const yTau = g.Y(res.sign * res.radius);
  const options = res.sign === 1 ? [yTau + 18 * g.scale, yTau - 10 * g.scale] : [yTau - 8, yTau + 20 * g.scale];
  const tauY = options.find((y) => !others.some((b) => overlaps(box(g.cx, y, 112 * g.scale), b))) ?? options[0];

  return (
    text(g.cx, tauY, `τmáx = ${f(res.radius)}`) +
    line(p[0], p[1], q[0], q[1], "plot-cursor") +
    dot(p[0], p[1], 6, "plot-point") +
    dot(q[0], q[1], 6, "plot-point") +
    text(lp[0], lp[1], "x′") +
    text(lq[0], lq[1], "y′")
  );
}

/* Flecha de (x1, y1) a (x2, y2) */
function arrow(x1, y1, x2, y2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (d) => `${r1(x2 - 7 * Math.cos(a + d))} ${r1(y2 - 7 * Math.sin(a + d))}`;
  return `M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}M${head(-0.45)}L${r1(x2)} ${r1(y2)}L${head(0.45)}`;
}

/* Elemento de tensiones girado θ: flechas de σ (negro) y de τ (ámbar) */
function drawElement(st, deg) {
  const half = 36;
  const reach = 26;
  const faces = [
    { n: [1, 0], t: [0, -1], s: st.sx },
    { n: [-1, 0], t: [0, 1], s: st.sx },
    { n: [0, -1], t: [1, 0], s: st.sy },
    { n: [0, 1], t: [-1, 0], s: st.sy },
  ];
  const shearSign = Math.sign(st.tauC);
  let normals = "";
  let shears = "";
  for (const { n, t, s } of faces) {
    if (s !== 0) {
      const a = [n[0] * half, n[1] * half];
      const b = [n[0] * (half + reach), n[1] * (half + reach)];
      normals += s > 0 ? arrow(a[0], a[1], b[0], b[1]) : arrow(b[0], b[1], a[0], a[1]);
    }
    if (shearSign !== 0) {
      const c = [n[0] * (half + 9), n[1] * (half + 9)];
      shears += arrow(c[0] - t[0] * 20 * shearSign, c[1] - t[1] * 20 * shearSign, c[0] + t[0] * 20 * shearSign, c[1] + t[1] * 20 * shearSign);
    }
  }
  const rad = deg / DEG;
  const lx = (d) => 120 + d * Math.cos(rad);
  const ly = (d) => 120 - d * Math.sin(rad);
  return (
    line(10, 120, 230, 120, "plot-grid") +
    `<g transform="translate(120 120) rotate(${-deg})">` +
    `<rect class="plot-support" x="${-half}" y="${-half}" width="${2 * half}" height="${2 * half}"/>` +
    `<path class="plot-load" d="${normals}"/><path class="plot-moment-line" d="${shears}"/></g>` +
    `<text class="plot-value" x="${r1(lx(100))}" y="${r1(ly(100) + 4)}" text-anchor="middle" style="fill: var(--ink, currentColor)">x′</text>` +
    `<text class="plot-value" x="10" y="16" text-anchor="start" style="fill: var(--ink, currentColor)">θ = ${f(deg, 1)}°</text>` +
    `<text class="plot-value" x="${r1(120 - 100 * Math.sin(rad))}" y="${r1(120 - 100 * Math.cos(rad) + 4)}" text-anchor="middle" style="fill: var(--ink, currentColor)">y′</text>`
  );
}

/* Crea la vista. onAngle(θ) se llama al arrastrar sobre el círculo. */
export function createMohrView(circleSvg, elementSvg, onAngle = () => {}) {
  circleSvg.style.touchAction = "none";
  let res = null;
  let geo = null;
  let angle = 0;
  let dragging = false;

  const chooseMode = () => (circleSvg.getBoundingClientRect().width < TALL_BELOW ? "tall" : "wide");

  function setAngle(deg) {
    angle = deg;
    if (!res) return;
    circleSvg.querySelector("[data-moving]").innerHTML = drawMoving(res, geo, deg);
    elementSvg.innerHTML = drawElement(res.stateAt(deg), deg);
  }

  function render() {
    geo = layout(res, chooseMode());
    circleSvg.setAttribute("viewBox", `0 0 ${geo.W} ${geo.H}`);
    circleSvg.classList.toggle("is-tall", geo.mode === "tall");
    circleSvg.innerHTML = drawCircle(res, geo);
    setAngle(angle);
  }

  function angleFromEvent(event) {
    const box = circleSvg.getBoundingClientRect();
    const dx = ((event.clientX - box.left) / box.width) * geo.W - geo.cx;
    const dy = ((event.clientY - box.top) / box.height) * geo.H - geo.cy;
    return wrapAngle(res.thetaP + (Math.atan2(dy, dx) * DEG) / 2);
  }

  const drag = (event) => {
    if (dragging && res) onAngle(angleFromEvent(event));
  };
  circleSvg.addEventListener("pointerdown", (event) => {
    dragging = true;
    circleSvg.setPointerCapture(event.pointerId);
    drag(event);
  });
  circleSvg.addEventListener("pointermove", drag);
  circleSvg.addEventListener("pointerup", () => (dragging = false));
  circleSvg.addEventListener("pointercancel", () => (dragging = false));

  /* Si la ventana cambia de ancho (girar el móvil, redimensionar) y cambia la disposición, se redibuja */
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      if (res && geo && chooseMode() !== geo.mode) render();
    }).observe(circleSvg);
  }

  return {
    update(result, deg) {
      res = result;
      angle = deg;
      render();
    },
    setAngle,
  };
}