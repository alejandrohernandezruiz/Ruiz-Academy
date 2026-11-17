/* RuizAcademy · vigas/main.js
   Conecta el formulario, el solver y el render. */

import { parseNumber, formatNumber as f, debounce } from "../../assets/js/common.js";
import { solveBeam, validateInputs } from "./solver.js";
import { createBeamView } from "./render.js";

const $ = (selector) => document.querySelector(selector);

const fields = { L: $("#L"), P: $("#P"), a: $("#a"), q: $("#q") };
const errorBoxes = { L: $("#err-L"), P: $("#err-P"), a: $("#err-a"), q: $("#err-q") };
const stage = $("#escenario");
const slider = $("#seccion");
const readout = $("#lectura");
const minStat = $("#stat-mmin");
const out = Object.fromEntries([...document.querySelectorAll("[data-out]")].map((el) => [el.dataset.out, el]));

const view = createBeamView($("#diagrama"), (cursor) => {
  readout.textContent = cursor
    ? `x = ${f(cursor.x)} m:  V = ${f(cursor.v)} kN,  M = ${f(cursor.m)} kN·m`
    : "";
  if (cursor) slider.value = String(cursor.x);
});

/* Un campo vacío vale `blank`; si no, se interpreta con coma o punto decimal */
const read = (el, blank) => (el.value.trim() === "" ? blank : parseNumber(el.value));

function readInputs() {
  const P = read(fields.P, 0);
  return {
    L: read(fields.L, NaN),
    P,
    a: read(fields.a, P === 0 ? 0 : NaN), // la posición solo importa si hay carga puntual
    q: read(fields.q, 0),
  };
}

function showResults(res) {
  const { RA, RB } = res.reactions;
  const set = (key, value) => {
    out[key].textContent = value;
  };
  set("ra", f(RA));
  set("rb", f(RB));
  set("vmax", f(res.shear.maxAbs.value));
  set("vmax-x", `en x = ${f(res.shear.maxAbs.x)} m`);
  set("mmax", f(Math.max(res.moment.max.value, 0)));
  set("mmax-x", res.moment.max.value > 0 ? `en x = ${f(res.moment.max.x)} m` : "");

  const hasNegative = res.moment.min.value < 0;
  minStat.hidden = !hasNegative;
  if (hasNegative) {
    set("mmin", f(res.moment.min.value));
    set("mmin-x", `en x = ${f(res.moment.min.x)} m`);
  }
}

function update() {
  const input = readInputs();
  const errors = validateInputs(input);

  for (const key of Object.keys(fields)) {
    fields[key].setAttribute("aria-invalid", String(Boolean(errors[key])));
    errorBoxes[key].textContent = errors[key] || "";
  }

  const invalid = Object.keys(errors).length > 0;
  stage.dataset.state = invalid ? "error" : "ok";
  if (invalid) return;

  const res = solveBeam(input);
  view.update(res);
  showResults(res);

  slider.max = String(input.L);
  view.setCursor(res.moment.maxAbs.x); // por defecto, la sección del flector máximo
}

const scheduleUpdate = debounce(update, 80);
for (const el of Object.values(fields)) el.addEventListener("input", scheduleUpdate);

slider.addEventListener("input", () => view.setCursor(Number(slider.value)));

$("#datos").addEventListener("submit", (event) => event.preventDefault());

for (const button of document.querySelectorAll("[data-preset]")) {
  button.addEventListener("click", () => {
    const { l, p, a, q } = button.dataset;
    fields.L.value = l;
    fields.P.value = p;
    fields.a.value = a;
    fields.q.value = q;
    update();
  });
}

update();