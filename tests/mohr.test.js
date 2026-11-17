/* Tests del solver del círculo de Mohr (herramientas/mohr/solver.js). Se ejecutan con: npm test */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { solveMohr, validateInputs, wrapAngle } from "../herramientas/mohr/solver.js";

const closeTo = (actual, expected, digits = 3) =>
  assert.ok(
    Math.abs(actual - expected) < 10 ** -digits / 2,
    `Esperado ${expected}, obtenido ${actual}`
  );

const mohr = (sx, sy, txy, convention = "ccw") => solveMohr({ sx, sy, txy, convention });

describe("Círculo de Mohr: casos de libro", () => {
  test("Caso general σx = 50, σy = -10, τxy = 40 (terna 3-4-5)", () => {
    const r = mohr(50, -10, 40);
    closeTo(r.center, 20);
    closeTo(r.radius, 50);
    closeTo(r.s1, 70);
    closeTo(r.s2, -30);
    closeTo(r.thetaP, Math.atan(4 / 3) * (90 / Math.PI)); // 26,565°
    closeTo(r.thetaS, r.thetaP - 45);
    closeTo(r.tauMaxAbs, 50);
    closeTo(r.vonMises, Math.sqrt(7900));
    closeTo(r.tresca, 100);

    const atP = r.stateAt(r.thetaP);
    closeTo(atP.sx, 70);
    closeTo(atP.sy, -30);
    closeTo(atP.tau, 0);

    const atS = r.stateAt(r.thetaS);
    closeTo(atS.sx, 20);
    closeTo(atS.tau, 50);
  });

  test("Tracción uniaxial σx = 100", () => {
    const r = mohr(100, 0, 0);
    closeTo(r.s1, 100);
    closeTo(r.s2, 0);
    closeTo(r.thetaP, 0);
    closeTo(r.tauMax, 50);
    closeTo(r.thetaS, -45);
    closeTo(r.vonMises, 100);
  });

  test("Cortante puro τxy = 20", () => {
    const r = mohr(0, 0, 20);
    closeTo(r.s1, 20);
    closeTo(r.s2, -20);
    closeTo(r.thetaP, 45);
    closeTo(r.vonMises, 20 * Math.sqrt(3));
  });

  test("Dos tensiones del mismo signo: el cortante absoluto lo da σ1/2", () => {
    const r = mohr(100, 60, 0);
    closeTo(r.tauMax, 20);
    closeTo(r.tauMaxAbs, 50);
  });

  test("Estado hidrostático: círculo reducido a un punto", () => {
    const r = mohr(30, 30, 0);
    assert.equal(r.isotropic, true);
    closeTo(r.radius, 0);
    closeTo(r.s1, 30);
    closeTo(r.s2, 30);
  });
});

describe("Convenio de signos de τ", () => {
  test("Con convenio horario, τxy = 40 equivale a τ de Cauchy = -40", () => {
    const cw = mohr(50, -10, 40, "cw");
    const ccw = mohr(50, -10, -40, "ccw");
    closeTo(cw.s1, ccw.s1);
    closeTo(cw.thetaP, ccw.thetaP);
    closeTo(cw.thetaP, -26.565);
    closeTo(cw.stateAt(0).tau, 40); // en el eje x se recupera τxy tal como se introdujo
    closeTo(cw.stateAt(0).tauC, -40);
  });
});

describe("Propiedades que deben cumplirse siempre", () => {
  let seed = 4321;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

  test("200 casos aleatorios: invariantes y pertenencia al círculo", () => {
    for (let i = 0; i < 200; i++) {
      const sx = (rnd() - 0.5) * 400;
      const sy = (rnd() - 0.5) * 400;
      const txy = (rnd() - 0.5) * 200;
      const convention = i % 2 === 0 ? "ccw" : "cw";
      const r = mohr(sx, sy, txy, convention);
      const theta = (rnd() - 0.5) * 180;
      const st = r.stateAt(theta);
      const t0 = r.stateAt(0);
      const t90 = r.stateAt(90);

      closeTo(st.sx + st.sy, sx + sy, 8); // primer invariante
      closeTo(Math.hypot(st.sx - r.center, st.tauC), r.radius, 8); // el punto está en el círculo
      closeTo(t0.sx, sx, 8);
      closeTo(t0.sy, sy, 8);
      closeTo(t0.tau, txy, 8);
      closeTo(t90.sx, sy, 8);
      closeTo(t90.tau, -txy, 8);
      closeTo(r.stateAt(r.thetaP).tau, 0, 8); // τ nula en los planos principales
      closeTo(r.stateAt(r.thetaP).sx, r.s1, 8);
      assert.ok(r.s1 >= r.s2);
    }
  });
});

describe("Validación y utilidades", () => {
  test("rechaza valores no numéricos o desmesurados", () => {
    assert.ok(validateInputs({ sx: NaN, sy: 0, txy: 0 }).sx);
    assert.ok(validateInputs({ sx: 0, sy: Infinity, txy: 0 }).sy);
    assert.ok(validateInputs({ sx: 0, sy: 0, txy: 1e9 }).txy);
    assert.deepEqual(validateInputs({ sx: 1, sy: 2, txy: 3 }), {});
    assert.throws(() => mohr(NaN, 0, 0), RangeError);
  });

  test("wrapAngle lleva los ángulos a (-90, 90]", () => {
    assert.equal(wrapAngle(-90), 90);
    assert.equal(wrapAngle(135), -45);
    assert.equal(wrapAngle(0), 0);
    assert.equal(wrapAngle(-100), 80);
  });
});