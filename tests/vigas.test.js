/* Tests del solver de vigas biapoyadas (herramientas/vigas/solver.js).
   Se ejecutan con:  npm test   (necesita Node.js 20 o superior, sin instalar nada más). */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { solveBeam, validateInputs, verifyEquilibrium } from "../herramientas/vigas/solver.js";

/* Equivale al toBeCloseTo de Jest: |real - esperado| < 10^-dígitos / 2 */
const closeTo = (actual, expected, digits = 3) =>
  assert.ok(
    Math.abs(actual - expected) < 10 ** -digits / 2,
    `Esperado ${expected}, obtenido ${actual}`
  );

const beam = (L, P, a, q) => solveBeam({ L, P, a, q });

describe("Viga biapoyada: casos de libro", () => {
  test("Caso 1: L = 6 m, P = 12 kN en el centro", () => {
    const r = beam(6, 12, 3, 0);
    closeTo(r.reactions.RA, 6, 2);
    closeTo(r.reactions.RB, 6, 2);
    closeTo(r.moment.max.value, 18, 2); // P·L/4
    closeTo(r.moment.max.x, 3, 2);
    closeTo(r.segments[0].v1, 6, 2); // cortante justo antes de la carga
    closeTo(r.segments[1].v0, -6, 2); // cortante justo después
  });

  test("Caso 2: L = 4 m, P = 20 kN a 1 m del apoyo A", () => {
    const r = beam(4, 20, 1, 0);
    closeTo(r.reactions.RA, 15, 2); // P·b/L
    closeTo(r.reactions.RB, 5, 2); // P·a/L
    closeTo(r.moment.max.value, 15, 2); // P·a·b/L, bajo la carga
    closeTo(r.moment.max.x, 1, 2);
  });

  test("Caso 3: L = 5 m, solo q = 4 kN/m", () => {
    const r = beam(5, 0, 0, 4);
    closeTo(r.reactions.RA, 10, 2);
    closeTo(r.reactions.RB, 10, 2);
    closeTo(r.moment.max.value, 12.5, 2); // q·L²/8
    closeTo(r.moment.max.x, 2.5, 2);
    closeTo(r.shear.max.value, 10, 2);
    closeTo(r.shear.min.value, -10, 2);
  });

  test("Caso 6: L = 6 m, P = 10 kN en a = 2 m y q = 5 kN/m (el máximo no está bajo P)", () => {
    const r = beam(6, 10, 2, 5);
    closeTo(r.reactions.RA, 65 / 3, 3);
    closeTo(r.reactions.RB, 55 / 3, 3);
    closeTo(r.moment.max.value, 33.6111, 3);
    closeTo(r.moment.max.x, 7 / 3, 3); // donde V = 0
  });

  test("Caso 7: P justo sobre el apoyo se va entera a la reacción", () => {
    const r = beam(6, 10, 0, 0);
    closeTo(r.reactions.RA, 10, 3);
    closeTo(r.reactions.RB, 0, 3);
    closeTo(r.shear.maxAbs.value, 0, 3);
    closeTo(r.moment.maxAbs.value, 0, 3);
  });

  test("Caso 8: P hacia arriba (negativa) da flector negativo", () => {
    const r = beam(6, -10, 2, 0);
    closeTo(r.reactions.RA, -20 / 3, 3);
    closeTo(r.moment.min.value, -40 / 3, 3);
    closeTo(r.moment.max.value, 0, 3);
  });
});

describe("Propiedades que deben cumplirse siempre", () => {
  let seed = 12345; // generador determinista: los tests no son aleatorios entre ejecuciones
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

  test("300 casos aleatorios: equilibrio, dM/dx = V y extremos correctos", () => {
    for (let i = 0; i < 300; i++) {
      const L = 1 + rnd() * 20;
      const P = i % 5 === 0 ? 0 : (rnd() - 0.5) * 40;
      const a = rnd() * L;
      const q = i % 7 === 0 ? 0 : (rnd() - 0.5) * 20;
      const r = beam(L, P, a, q);
      const scale = Math.max(1, Math.abs(P) + Math.abs(q) * L);

      // Equilibrio de fuerzas y M(L) = 0
      const eq = verifyEquilibrium(r);
      assert.ok(Math.abs(eq.forceResidual) < 1e-9 * scale, `fuerzas, caso ${i}`);
      assert.ok(Math.abs(eq.momentResidual) < 1e-9 * scale * L, `momentos, caso ${i}`);

      // dM/dx = V lejos de la carga puntual (derivada centrada)
      const x = rnd() * L;
      if (Math.abs(x - r.input.a) > 1e-3 || P === 0) {
        const h = 1e-6;
        const slope = (r.momentAt(x + h) - r.momentAt(x - h)) / (2 * h);
        assert.ok(Math.abs(slope - r.shearAt(x)) < 1e-4 * scale, `dM/dx, caso ${i}`);
      }

      // Ningún punto de la viga supera los extremos que informa el solver
      for (let k = 0; k <= 400; k++) {
        const m = r.momentAt((L * k) / 400);
        assert.ok(m <= r.moment.max.value + 1e-9 * scale * L, `Mmáx, caso ${i}`);
        assert.ok(m >= r.moment.min.value - 1e-9 * scale * L, `Mmín, caso ${i}`);
      }
    }
  });
});

describe("Validación de datos", () => {
  test("rechaza luz nula, negativa o no numérica", () => {
    assert.ok(validateInputs({ L: 0, P: 1, a: 0, q: 0 }).L);
    assert.ok(validateInputs({ L: -3, P: 1, a: 0, q: 0 }).L);
    assert.ok(validateInputs({ L: NaN, P: 1, a: 0, q: 0 }).L);
  });

  test("a debe estar entre 0 y L solo si hay carga puntual", () => {
    assert.ok(validateInputs({ L: 6, P: 10, a: 7, q: 0 }).a);
    assert.ok(validateInputs({ L: 6, P: 10, a: -1, q: 0 }).a);
    assert.deepEqual(validateInputs({ L: 6, P: 0, a: 99, q: 5 }), {});
  });

  test("solveBeam lanza un error con datos inválidos", () => {
    assert.throws(() => beam(0, 1, 0, 0), RangeError);
  });
});

describe("Examen real ERM (GITI, UPV), parcial 1", () => {
  /* Barra CB con q = 5 kN/m y L = 4 m, con momentos en los extremos M(0) = -21,2132 y M(L) = 8,0516 kN·m.
     Se resuelve por superposición: viga biapoyada con q (el solver) + un momento lineal entre los extremos.
     Convenio del profesor: Vy = -V del solver (el solver usa V positivo en sentido horario). */
  test("Caso 4: V(s) y M(s) de la barra CB coinciden con las ecuaciones del profesor", () => {
    const L = 4;
    const q = 5;
    const M0 = -21.2132;
    const ML = 8.0516;
    const r = beam(L, 0, 0, q);
    const k = (ML - M0) / L; // cortante añadido por los momentos de extremo

    const Vprof = (s) => -(r.shearAt(s) + k);
    const Mprof = (s) => r.momentAt(s) + M0 + k * s;

    closeTo(Vprof(0), -17.3162, 3); // Vy(0) del profesor
    closeTo(Vprof(L), 2.6838, 3); // Vy(4)
    closeTo(Mprof(L), 8.0516, 3); // Mz(4)

    const sMax = (r.reactions.RA + k) / q; // donde Vy(s) = 0
    closeTo(sMax, 3.46324, 4);
    closeTo(Mprof(sMax), 8.7718, 3); // Mz máximo del profesor
  });

  test.todo(
    "Caso 5: reacciones del pórtico (Ry^A = 9,7549 y Ry^D = 17,3162 kN). Requiere la herramienta de pórticos: " +
      "la viga plana equivalente omite el momento de la componente horizontal de la carga inclinada."
  );
});