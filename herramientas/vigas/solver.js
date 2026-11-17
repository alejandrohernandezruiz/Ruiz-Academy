/* RuizAcademy · vigas/solver.js
   Viga biapoyada de luz L con una carga puntual P en x = a y una carga uniforme q en toda la luz.
   Unidades: m, kN, kN/m, kN·m. Cargas positivas = hacia abajo (gravedad).

   Convenio (REM, UPV):
   - V positivo si hace girar el elemento en sentido horario: V(x) = suma de fuerzas verticales
     a la izquierda de la sección, positivas hacia arriba.
   - M positivo si tracciona las fibras inferiores (forma de U).

   Este módulo no toca el DOM: se puede probar con Node. */

const EPS = 1e-9;

const zero = (value, scale) => (Math.abs(value) < EPS * scale ? 0 : value);

/* Devuelve un objeto { campo: mensaje } con los errores. Vacío si los datos son válidos. */
export function validateInputs({ L, P, a, q }) {
  const errors = {};
  if (!Number.isFinite(L) || L <= 0) errors.L = "La luz debe ser un número mayor que 0.";
  else if (L > 1000) errors.L = "La luz no puede superar los 1000 m.";
  if (!Number.isFinite(P)) errors.P = "Introduce un número válido.";
  if (!Number.isFinite(q)) errors.q = "Introduce un número válido.";
  if (Number.isFinite(P) && P !== 0) {
    if (!Number.isFinite(a) || a < 0 || (Number.isFinite(L) && a > L)) {
      errors.a = "La posición debe estar entre 0 y L.";
    }
  }
  return errors;
}

export function solveBeam(input) {
  const errors = validateInputs(input);
  if (Object.keys(errors).length > 0) throw new RangeError(Object.values(errors)[0]);

  const { L, P, q } = input;
  const a = P !== 0 ? input.a : 0;
  const scale = Math.max(1, Math.abs(P) + Math.abs(q) * L); // para anular ruido de coma flotante

  // Reacciones (positivas hacia arriba)
  const RA = zero((P * (L - a)) / L + (q * L) / 2, scale);
  const RB = zero((P * a) / L + (q * L) / 2, scale);

  // Funciones de esfuerzos. En x = a el cortante toma el límite por la derecha.
  const shearAt = (x) => RA - q * x - (P !== 0 && x >= a ? P : 0);
  const momentAt = (x) => RA * x - (q * x * x) / 2 - (P !== 0 && x > a ? P * (x - a) : 0);

  // Tramos con cortante lineal: [0, a] y [a, L], o un único tramo si P = 0 o a está en un extremo
  const breaks = [...new Set(P !== 0 ? [0, a, L] : [0, L])].sort((m, n) => m - n);
  const segments = [];
  for (let i = 0; i < breaks.length - 1; i++) {
    const x0 = breaks[i];
    const x1 = breaks[i + 1];
    const pTerm = P !== 0 && (x0 + x1) / 2 > a ? P : 0;
    segments.push({
      x0,
      x1,
      v0: zero(RA - q * x0 - pTerm, scale),
      v1: zero(RA - q * x1 - pTerm, scale),
    });
  }

  // Candidatos a extremos: extremos de tramo (V) y, para M, también los puntos donde V = 0
  const vPoints = segments.flatMap((s) => [
    { x: s.x0, value: s.v0 },
    { x: s.x1, value: s.v1 },
  ]);
  const mPoints = breaks.map((x) => ({ x, value: momentAt(x) }));
  if (q !== 0) {
    for (const s of segments) {
      const xs = s.x0 + s.v0 / q;
      if (xs > s.x0 + EPS && xs < s.x1 - EPS) mPoints.push({ x: xs, value: momentAt(xs) });
    }
  }

  return {
    input: { L, P, a, q },
    reactions: { RA, RB },
    breaks,
    segments,
    shearAt,
    momentAt,
    shear: extremes(vPoints, scale),
    moment: extremes(mPoints, scale * L),
  };
}

function extremes(points, scale) {
  const clean = points.map((p) => ({ x: p.x, value: zero(p.value, scale) }));
  const max = clean.reduce((best, p) => (p.value > best.value ? p : best));
  const min = clean.reduce((best, p) => (p.value < best.value ? p : best));
  const maxAbs = Math.abs(max.value) >= Math.abs(min.value) ? max : min;
  return { max, min, maxAbs };
}

/* Polilínea del cortante, con los saltos verticales en x = 0, x = a y x = L */
export function shearPolyline(result) {
  const points = [{ x: 0, v: 0 }];
  for (const s of result.segments) points.push({ x: s.x0, v: s.v0 }, { x: s.x1, v: s.v1 });
  points.push({ x: result.input.L, v: 0 });
  return points;
}

/* Polilínea del flector. Recta si q = 0; parábola muestreada en caso contrario */
export function momentPolyline(result, samples = 96) {
  const points = [];
  const steps = result.input.q === 0 ? 1 : samples;
  for (const s of result.segments) {
    for (let i = points.length > 0 ? 1 : 0; i <= steps; i++) {
      const x = s.x0 + ((s.x1 - s.x0) * i) / steps;
      points.push({ x, m: result.momentAt(x) });
    }
  }
  return points;
}

/* Comprobaciones de equilibrio: ambos residuos deben ser ≈ 0 */
export function verifyEquilibrium(result) {
  const { L, P, q } = result.input;
  return {
    forceResidual: result.reactions.RA + result.reactions.RB - (P + q * L),
    momentResidual: result.momentAt(L),
  };
}