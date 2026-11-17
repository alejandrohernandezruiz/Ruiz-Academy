/* RuizAcademy · mohr/main.js
   Conecta el formulario, el solver y el render. */

import { parseNumber, formatNumber as f, debounce, clamp } from "../../assets/js/common.js";
import { solveMohr, validateInputs } from "./solver.js";
import { createMohrView } from "./render.js";

const $ = (selector) => document.querySelector(selector);

const fields = { sx: $("#sx"), sy: $("#sy"), txy: $("#txy") };
const errorBoxes = { sx: $("#err-sx"), sy: $("#err-sy"), txy: $("#err-txy") };
const convention = $("#conv");
const stage = $("#escenario");
const slider = $("#angulo");
const readout = $("#lectura");
const out = Object.fromEntries([...document.querySelectorAll("[data-out]")].map((el) => [el.dataset.out, el]));

let result = null;

const view = createMohrView($("#circulo"), $("#elemento"), (theta) => setAngle(theta));

/* Un campo vacío vale 0; si no, se interpreta con coma o punto decimal */
const read = (el) => (el.value.trim() === "" ? 0 : parseNumber(el.value));

function setAngle(theta) {
  if (!result) return;
  const deg = clamp(Math.round(theta * 10) / 10, -90, 90);
  slider.value = String(deg);
  view.setAngle(deg);
  const st = result.stateAt(deg);
  readout.textContent = `θ = ${f(deg, 1)}°:  σx′ = ${f(st.sx)} MPa,  σy′ = ${f(st.sy)} MPa,  τx′y′ = ${f(st.tau)} MPa`;
}

function showResults(res) {
  const set = (key, value) => {
    out[key].textContent = value;
  };
  const where = (deg) => (res.isotropic ? "en cualquier plano" : `en θ = ${f(deg)}°`);
  set("s1", f(res.s1));
  set("s1-th", where(res.thetaP));
  set("s2", f(res.s2));
  set("s2-th", where(res.thetaP2));
  set("ts", f(res.tauMax));
  set("ts-th", where(res.thetaS));
  set("tabs", f(res.tauMaxAbs));
  set("vm", f(res.vonMises));
  set("tr", f(res.tresca));
}

function update() {
  const input = {
    sx: read(fields.sx),
    sy: read(fields.sy),
    txy: read(fields.txy),
    convention: convention.value,
  };
  const errors = validateInputs(input);

  for (const key of Object.keys(fields)) {
    fields[key].setAttribute("aria-invalid", String(Boolean(errors[key])));
    errorBoxes[key].textContent = errors[key] || "";
  }

  const invalid = Object.keys(errors).length > 0;
  stage.dataset.state = invalid ? "error" : "ok";
  if (invalid) return;

  result = solveMohr(input);
  view.update(result, Number(slider.value));
  showResults(result);
  setAngle(Number(slider.value));
}

const scheduleUpdate = debounce(update, 80);
for (const el of Object.values(fields)) el.addEventListener("input", scheduleUpdate);
convention.addEventListener("change", update);
slider.addEventListener("input", () => setAngle(Number(slider.value)));

$("#datos").addEventListener("submit", (event) => event.preventDefault());

for (const button of document.querySelectorAll("[data-go]")) {
  button.addEventListener("click", () => {
    if (!result) return;
    const targets = { x: 0, p: result.thetaP, s: result.thetaS };
    setAngle(targets[button.dataset.go]);
  });
}

for (const button of document.querySelectorAll("[data-preset]")) {
  button.addEventListener("click", () => {
    const { sx, sy, txy } = button.dataset;
    fields.sx.value = sx;
    fields.sy.value = sy;
    fields.txy.value = txy;
    slider.value = "0";
    update();
  });
}

update();