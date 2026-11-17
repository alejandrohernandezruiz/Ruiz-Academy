/* RuizAcademy · mohr/render.js
   Dibuja el círculo de Mohr (SVG) y el elemento de tensiones girado un ángulo θ.
   La geometría usa τ de Cauchy hacia arriba. Con el convenio "horario" el eje τ se rotula
   positivo hacia abajo, que es la misma geometría con otra etiqueta. */

import { formatNumber as f } from "../../assets/js/common.js";
import { wrapAngle } from "./solver.js";

const W = 760;
const H = 480;
const MARGIN = { l: 56, r: 24, t: 28, b: 36 };
const DEG = 180 / Math.PI;

const r1 = (n) => Number(n.toFixed(1));
const text = (x, y, s, anchor = "middle", cls = "plot-value") =>
  `<text class="${cls}" x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}">${s}</text>`;
const line = (x1, y1, x2, y2, cls) =>
  `<line class="${cls}" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/>`;
const dot = (x, y, radius, cls) => `<circle class="${cls}" cx="${r1(x)}" cy="${r1(y)}" r="${radius}"/>`;

function niceStep(span) {
  const raw = span / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}

const decimals = (step) => Math.max(0, -Math.floor(Math.log10(step) + 1e-9));

/* Escala común en σ y τ para que el círculo sea un círculo */
function layout(res) {
  const lo = Math.min(res.s2, 0);
  const hi = Math.max(res.s1, 0);
  const half = res.radius > 0 ? res.radius : Math.max((hi - lo) / 4, 1);
  const pad = 0.14 * Math.max(hi - lo, 2 * half);
  const sLo = lo - pad;
  const sHi = hi + pad;
  const tHalf = half + pad;
  const pw = W - MARGIN.l - MARGIN.r;
  const ph = H - MARGIN.t - MARGIN.b;
  const k = Math.min(pw / (sHi - sLo), ph / (2 * tHalf));
  const ox = MARGIN.l + (pw - (sHi - sLo) * k) / 2;
  const oy = MARGIN.t + ph / 2;
  return { k, sLo, sHi, tHalf, X: (s) => ox + (s - sLo) * k, Y: (t) => oy - t * k };
}

function drawCircle(res, g) {
  const { X, Y, k, sLo, sHi, tHalf } = g;
  const { center, radius, s1, s2, sign, tauC, input } = res;
  const o = [];

  /* Cuadrícula y ejes */
  const sStep = niceStep(sHi - sLo);
  for (let i = Math.ceil(sLo / sStep); i * sStep <= sHi + 1e-9; i++) {
    const v = i * sStep;
    o.push(line(X(v), Y(tHalf), X(v), Y(-tHalf), "plot-grid"));
    o.push(text(X(v), Y(0) + 15, f(v, decimals(sStep))));
  }
  const tStep = niceStep(2 * tHalf);
  for (let i = Math.ceil(-tHalf / tStep); i * tStep <= tHalf + 1e-9; i++) {
    const v = i * tStep;
    o.push(line(X(sLo), Y(v), X(sHi), Y(v), "plot-grid"));
    if (i !== 0) o.push(text(X(0) - 6, Y(v) + 4, f(sign * v, decimals(tStep)), "end"));
  }
  o.push(line(X(sLo), Y(0), X(sHi), Y(0), "plot-axis"), line(X(0), Y(tHalf), X(0), Y(-tHalf), "plot-axis"));
  o.push(text(X(sHi), Y(0) - 8, "σ [MPa]", "end"));
  o.push(sign === 1 ? text(X(0) + 8, Y(tHalf) + 12, "τ [MPa]", "start") : text(X(0) + 8, Y(-tHalf) - 4, "τ [MPa], positivo hacia abajo", "start"));

  /* Círculo, diámetro XY y puntos fijos */
  const cx = X(center);
  const cy = Y(0);
  o.push(`<circle class="plot-circle" cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(radius * k)}"/>`);
  const px = [X(input.sx), Y(tauC)];
  const py = [X(input.sy), Y(-tauC)];
  o.push(line(px[0], px[1], py[0], py[1], "plot-diameter"));

  /* Arco de 2θp entre el radio CX y el eje σ */
  const alpha = Math.atan2(px[1] - cy, px[0] - cx);
  const arcR = Math.min(36, radius * k * 0.4);
  if (!res.isotropic && Math.abs(alpha) > 1e-6 && arcR > 8) {
    const sweep = alpha < 0 ? 1 : 0;
    o.push(
      `<path class="plot-axis" d="M${r1(cx + arcR * Math.cos(alpha))} ${r1(cy + arcR * Math.sin(alpha))}A${r1(arcR)} ${r1(arcR)} 0 0 ${sweep} ${r1(cx + arcR)} ${r1(cy)}"/>`
    );
    o.push(text(cx + arcR + 6, cy + (alpha < 0 ? -6 : 14), `2θp = ${f(2 * res.thetaP)}°`, "start"));
  }

  for (const [p, name] of [[px, "X"], [py, "Y"]]) {
    o.push(dot(p[0], p[1], 5, "plot-support"));
    o.push(text(p[0] + 9, p[1] + (p[1] <= cy ? -8 : 16), name, "start"));
  }

  /* Tensiones principales, τ máxima y centro */
  o.push(dot(X(s1), cy, 4, "plot-support"), dot(X(s2), cy, 4, "plot-support"));
  o.push(text(X(s1), cy - 10, `σ1 = ${f(s1)}`), text(X(s2), cy - 10, `σ2 = ${f(s2)}`));
  o.push(dot(cx, Y(radius), 4, "plot-support"), dot(cx, Y(-radius), 4, "plot-support"));
  o.push(text(cx + 8, Y(sign * radius) + (sign === 1 ? -8 : 16), `τmáx = ${f(radius)}`, "start"));
  o.push(dot(cx, cy, 3, "plot-support"), text(cx, cy + 15, `C = ${f(center)}`));

  o.push(`<g data-moving></g>`);
  return o.join("");
}

function drawMoving(res, g, deg) {
  const st = res.stateAt(deg);
  const p = [g.X(st.sx), g.Y(st.tauC)];
  const q = [g.X(st.sy), g.Y(-st.tauC)];
  const cy = g.Y(0);
  return (
    line(p[0], p[1], q[0], q[1], "plot-cursor") +
    dot(p[0], p[1], 6, "plot-point") +
    dot(q[0], q[1], 6, "plot-point") +
    text(p[0] + 10, p[1] + (p[1] <= cy ? -10 : 18), "x′", "start") +
    text(q[0] + 10, q[1] + (q[1] <= cy ? -10 : 18), "y′", "start")
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
    text(lx(100), ly(100) + 4, "x′") +
    text(10, 16, `θ = ${f(deg, 1)}°`, "start") +
    text(120 - 100 * Math.sin(rad), 120 - 100 * Math.cos(rad) + 4, "y′")
  );
}

/* Crea la vista. onAngle(θ) se llama al arrastrar sobre el círculo. */
export function createMohrView(circleSvg, elementSvg, onAngle = () => {}) {
  circleSvg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  circleSvg.style.touchAction = "none";
  let res = null;
  let geo = null;
  let dragging = false;

  function setAngle(deg) {
    if (!res) return;
    circleSvg.querySelector("[data-moving]").innerHTML = drawMoving(res, geo, deg);
    elementSvg.innerHTML = drawElement(res.stateAt(deg), deg);
  }

  function angleFromEvent(event) {
    const box = circleSvg.getBoundingClientRect();
    const dx = ((event.clientX - box.left) / box.width) * W - geo.X(res.center);
    const dy = ((event.clientY - box.top) / box.height) * H - geo.Y(0);
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

  return {
    update(result, deg) {
      res = result;
      geo = layout(res);
      circleSvg.innerHTML = drawCircle(res, geo);
      setAngle(deg);
    },
    setAngle,
  };
}