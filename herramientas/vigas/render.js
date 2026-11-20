/* RuizAcademy · vigas/render.js
   Dibuja en un SVG la viga con sus cargas y los diagramas de cortante y flector.
   Convenio de dibujo (UPV): V positivo hacia arriba; M positivo hacia ABAJO (diagrama invertido,
   el valor se dibuja del lado de la fibra traccionada). */

import { formatNumber as f, clamp } from "../../assets/js/common.js";
import { shearPolyline, momentPolyline } from "./solver.js";

const W = 760;
const H = 600;
const X0 = 60; // x del apoyo izquierdo
const X1 = 700; // x del apoyo derecho
const Y_BEAM = 110;
const Y_SHEAR = 356; // eje del cortante
const Y_MOMENT = 520; // eje del flector
const AMP = 50; // altura máxima de cada diagrama en px

const r = (n) => Number(n.toFixed(1));
const text = (x, y, s, cls = "", anchor = "middle") =>
  `<text class="${cls}" x="${r(x)}" y="${r(y)}" text-anchor="${anchor}">${s}</text>`;

/* Flecha vertical con la cola en yTail y la punta en yHead */
function arrow(x, yTail, yHead) {
  const barb = yHead > yTail ? -8 : 8;
  return `M${r(x)} ${yTail}V${yHead}M${r(x - 5)} ${yHead + barb}L${r(x)} ${yHead}L${r(x + 5)} ${yHead + barb}`;
}

function dimension(x1, x2, y, label) {
  return (
    `<path class="plot-axis" d="M${r(x1)} ${y}H${r(x2)}M${r(x1)} ${y - 5}V${y + 5}M${r(x2)} ${y - 5}V${y + 5}"/>` +
    text((x1 + x2) / 2, y - 7, label)
  );
}

function draw(res) {
  const { L, P, a, q } = res.input;
  const { RA, RB } = res.reactions;
  const px = (x) => X0 + (x / L) * (X1 - X0);
  const amplitude = (e) => Math.max(Math.abs(e.max.value), Math.abs(e.min.value)) || 1;
  const kV = AMP / amplitude(res.shear);
  const kM = AMP / amplitude(res.moment);
  const yV = (v) => Y_SHEAR - v * kV;
  const yM = (m) => Y_MOMENT + m * kM; // positivo hacia abajo
  const xa = px(a);
  const o = [];

  /* --- Viga, apoyos y reacciones --- */
  o.push(`<line class="plot-beam" x1="${X0}" y1="${Y_BEAM}" x2="${X1}" y2="${Y_BEAM}"/>`);
  o.push(`<path class="plot-support" d="M${X0} 114L${X0 - 12} 138H${X0 + 12}ZM${X0 - 18} 138H${X0 + 18}"/>`);
  o.push(
    `<path class="plot-support" d="M${X1} 114L${X1 - 12} 132H${X1 + 12}ZM${X1 - 18} 143H${X1 + 18}"/>` +
      `<circle class="plot-support" cx="${X1}" cy="137.5" r="4.5"/>`
  );
  for (const [x, R, name, anchor] of [
    [X0, RA, "RA", "start"],
    [X1, RB, "RB", "end"],
  ]) {
    o.push(`<path class="plot-load" d="${arrow(x, R >= 0 ? 190 : 150, R >= 0 ? 150 : 190)}"/>`);
    o.push(text(x + (anchor === "start" ? -14 : 14), 208, `${name} = ${f(R)} kN`, "plot-value", anchor));
  }

  /* --- Cargas --- */
  if (q !== 0) {
    const n = Math.round((X1 - X0) / 40);
    let d = `M${X0} 62H${X1}`;
    for (let i = 0; i <= n; i++) {
      const x = X0 + ((X1 - X0) * i) / n;
      d += arrow(x, q > 0 ? 62 : 104, q > 0 ? 104 : 62);
    }
    o.push(`<path class="plot-load" d="${d}"/>`);
    const labelRight = P !== 0 && xa < (X0 + X1) / 2; // evita cruzarse con la flecha de P
    o.push(text(labelRight ? X1 : X0, 50, `q = ${f(q)} kN/m`, "plot-value", labelRight ? "end" : "start"));
  }
  if (P !== 0) {
    o.push(`<path class="plot-load" d="${arrow(xa, P > 0 ? 22 : 104, P > 0 ? 104 : 22)}"/>`);
    o.push(text(clamp(xa, 80, 680), 14, `P = ${f(P)} kN`, "plot-value"));
    o.push(`<line class="plot-grid" x1="${r(xa)}" y1="262" x2="${r(xa)}" y2="${Y_MOMENT + AMP + 4}"/>`);
  }

  /* --- Cotas --- */
  if (P !== 0 && a > 0) o.push(dimension(X0, xa, 228, `a = ${f(a)} m`));
  o.push(dimension(X0, X1, 252, `L = ${f(L)} m`));

  /* --- Cortante --- */
  o.push(text(X0, 274, "Cortante V [kN]", "plot-value", "start"));
  o.push(`<line class="plot-axis" x1="${X0 - 10}" y1="${Y_SHEAR}" x2="${X1 + 10}" y2="${Y_SHEAR}"/>`);
  const shearPath = "M" + shearPolyline(res).map((p) => `${r(px(p.x))} ${r(yV(p.v))}`).join("L");
  o.push(`<path class="plot-shear-fill" d="${shearPath}Z"/><path class="plot-shear-line" d="${shearPath}"/>`);
  for (const s of res.segments) {
    for (const [x, v, side] of [
      [s.x0, s.v0, 1],
      [s.x1, s.v1, -1],
    ]) {
      if (v === 0) continue;
      // La etiqueta va del lado contrario a la línea del diagrama para que no la atraviese
      const slope = Math.sign(s.v1 - s.v0);
      const above = slope === 0 ? v > 0 : side > 0 ? slope < 0 : slope > 0;
      o.push(text(px(x) + 5 * side, yV(v) + (above ? -7 : 15), f(v), "plot-value", side > 0 ? "start" : "end"));
    }
  }

  /* --- Flector (invertido: positivo hacia abajo) --- */
  o.push(text(X0, 440, "Flector M [kN·m], positivo hacia abajo", "plot-value", "start"));
  o.push(`<line class="plot-axis" x1="${X0 - 10}" y1="${Y_MOMENT}" x2="${X1 + 10}" y2="${Y_MOMENT}"/>`);
  const momentPath = "M" + momentPolyline(res).map((p) => `${r(px(p.x))} ${r(yM(p.m))}`).join("L");
  o.push(`<path class="plot-moment-fill" d="${momentPath}Z"/><path class="plot-moment-line" d="${momentPath}"/>`);

  const marks = [];
  if (res.moment.max.value > 0) marks.push(["Mmáx", res.moment.max]);
  if (res.moment.min.value < 0) marks.push(["Mmín", res.moment.min]);
  for (const [name, e] of marks) {
    const x = px(e.x);
    const y = yM(e.value);
    const interior = e.x > 1e-9 && e.x < L - 1e-9 && !(P !== 0 && Math.abs(e.x - a) < 1e-9);
    if (interior) o.push(`<line class="plot-grid" x1="${r(x)}" y1="${Y_SHEAR}" x2="${r(x)}" y2="${r(y)}"/>`);
    o.push(`<circle class="plot-point" cx="${r(x)}" cy="${r(y)}" r="4.5"/>`);
    o.push(text(clamp(x, 150, 610), y + (e.value > 0 ? 24 : -14), `${name} = ${f(e.value)} kN·m en x = ${f(e.x)} m`, "plot-value"));
  }

  /* --- Cursor de lectura --- */
  o.push(
    `<g data-cursor visibility="hidden"><line class="plot-cursor" x1="0" y1="262" x2="0" y2="${Y_MOMENT + AMP + 6}"/>` +
      `<circle class="plot-point" data-cv cx="0" cy="0" r="5"/><circle class="plot-point" data-cm cx="0" cy="0" r="5"/></g>`
  );

  return { markup: o.join(""), px, yV, yM };
}

/* Crea la vista sobre un <svg>. onCursor recibe { x, v, m } o null. */
export function createBeamView(svg, onCursor = () => {}) {
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  let result = null;
  let geo = null;

  function setCursor(x) {
    const g = svg.querySelector("[data-cursor]");
    if (!result || !g || x === null) {
      g?.setAttribute("visibility", "hidden");
      onCursor(null);
      return;
    }
    const xc = clamp(x, 0, result.input.L);
    const v = result.shearAt(xc);
    const m = result.momentAt(xc);
    const cx = r(geo.px(xc));
    g.querySelector(".plot-cursor").setAttribute("x1", cx);
    g.querySelector(".plot-cursor").setAttribute("x2", cx);
    g.querySelector("[data-cv]").setAttribute("cx", cx);
    g.querySelector("[data-cv]").setAttribute("cy", r(geo.yV(v)));
    g.querySelector("[data-cm]").setAttribute("cx", cx);
    g.querySelector("[data-cm]").setAttribute("cy", r(geo.yM(m)));
    g.setAttribute("visibility", "visible");
    onCursor({ x: xc, v, m });
  }

  function xFromEvent(event) {
    const box = svg.getBoundingClientRect();
    const sx = ((event.clientX - box.left) / box.width) * W;
    return ((sx - X0) / (X1 - X0)) * result.input.L;
  }

  const follow = (event) => {
    if (result) setCursor(xFromEvent(event));
  };
  svg.addEventListener("pointermove", follow);
  svg.addEventListener("pointerdown", follow);

  return {
    update(res) {
      result = res;
      geo = draw(res);
      svg.innerHTML = geo.markup;
    },
    setCursor,
  };
}