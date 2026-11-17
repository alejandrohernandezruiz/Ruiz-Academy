/* RuizAcademy · mohr/solver.js
   Estado plano de tensiones y círculo de Mohr. Unidades libres (se usa MPa en la interfaz).

   Convenio:
   - σ positiva en tracción.
   - Los ángulos θ son físicos, positivos en sentido antihorario, y se miden desde el eje x
     hasta la normal de la cara.
   - Internamente se trabaja con τ de Cauchy (cara positiva, sentido positivo del eje).
     Si la asignatura define τxy positiva en sentido horario ("cw"), el solver cambia el signo
     de entrada y de salida, y el resultado físico es el mismo.

   Este módulo no toca el DOM: se puede probar con Node. */

const RAD = Math.PI / 180;
const LIMIT = 1e6;

/* Lleva un ángulo en grados al intervalo (-90, 90], porque una cara y la opuesta son la misma */
export function wrapAngle(deg) {
  const wrapped = ((((deg + 90) % 180) + 180) % 180) - 90;
  return wrapped === -90 ? 90 : wrapped;
}

/* Devuelve { campo: mensaje }. Vacío si los datos son válidos. */
export function validateInputs({ sx, sy, txy }) {
  const errors = {};
  for (const [key, value] of Object.entries({ sx, sy, txy })) {
    if (!Number.isFinite(value)) errors[key] = "Introduce un número válido.";
    else if (Math.abs(value) > LIMIT) errors[key] = "El valor es demasiado grande.";
  }
  return errors;
}

export function solveMohr({ sx, sy, txy, convention = "ccw" }) {
  const errors = validateInputs({ sx, sy, txy });
  if (Object.keys(errors).length > 0) throw new RangeError(Object.values(errors)[0]);

  const sign = convention === "cw" ? -1 : 1;
  const tauC = sign * txy; // τxy de Cauchy
  const scale = Math.max(1, Math.abs(sx), Math.abs(sy), Math.abs(txy));
  const clean = (v) => (Math.abs(v) < 1e-9 * scale ? 0 : v);

  const center = (sx + sy) / 2;
  const u = (sx - sy) / 2;
  const radius = clean(Math.hypot(u, tauC));
  const isotropic = radius === 0;
  const phi = isotropic ? 0 : Math.atan2(tauC, u); // 2·θp en radianes

  const s1 = center + radius;
  const s2 = center - radius;
  const thetaP = wrapAngle((phi / RAD) / 2); // plano de σ1
  const thetaS = wrapAngle(thetaP + (sign === 1 ? -45 : 45)); // plano de τ máxima positiva

  /* Tensiones sobre la cara con normal a θ grados del eje x, y sobre la cara perpendicular */
  function stateAt(thetaDeg) {
    const c2 = Math.cos(2 * thetaDeg * RAD);
    const s2t = Math.sin(2 * thetaDeg * RAD);
    const normal = center + u * c2 + tauC * s2t;
    const shear = -u * s2t + tauC * c2;
    return {
      sx: clean(normal),
      sy: clean(sx + sy - normal),
      tauC: clean(shear),
      tau: clean(sign * shear),
    };
  }

  return {
    input: { sx, sy, txy, convention },
    sign,
    tauC,
    center,
    radius,
    phi,
    isotropic,
    s1: clean(s1),
    s2: clean(s2),
    thetaP,
    thetaP2: wrapAngle(thetaP + 90),
    thetaS,
    tauMax: radius,
    tauMaxAbs: Math.max(radius, Math.abs(s1) / 2, Math.abs(s2) / 2), // contando el plano libre σ3 = 0
    vonMises: Math.sqrt(s1 * s1 - s1 * s2 + s2 * s2),
    tresca: Math.max(Math.abs(s1 - s2), Math.abs(s1), Math.abs(s2)),
    stateAt,
  };
}