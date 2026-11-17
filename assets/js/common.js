/* RuizAcademy · common.js
   Módulo compartido por todas las páginas.
   Se carga con: <script type="module" src="assets/js/common.js"></script>
   (desde herramientas/<nombre>/ la ruta es ../../assets/js/common.js)
   
/* ---------- Tema claro / oscuro ---------- */

const THEME_KEY = "ruizacademy-theme";
const THEMES = ["light", "dark"];
const THEME_COLORS = { light: "#edf1f5", dark: "#0b2038" };

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.includes(stored) ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTheme() {
  return document.documentElement.dataset.theme || readStoredTheme() || systemTheme();
}

export function setTheme(theme, persist = true) {
  if (!THEMES.includes(theme)) return;
  document.documentElement.dataset.theme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.setAttribute(
      "aria-label",
      theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
    );
  });

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* Almacenamiento no disponible: el tema solo dura esta visita. */
    }
  }

  document.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

export function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

function initTheme() {
  setTheme(getTheme(), false);

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", toggleTheme);
  });

  // Si la persona no ha elegido tema, seguimos el del sistema.
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!readStoredTheme()) setTheme(systemTheme(), false);
  });
}

/* ---------- Cabecera: marca el estado al hacer scroll ---------- */

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const update = () => {
    header.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

/* ---------- Utilidades numéricas (formato español) ---------- */

export function formatNumber(value, decimals = 2) {
  if (!Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Object.is(value, -0) ? 0 : value);
}

/* Acepta "12,5", "12.5", "1.500,25" y notación científica.
   Devuelve NaN si el texto no es un número válido.
   Ojo: "1.500" sin coma se interpreta como 1,5. */
export function parseNumber(text) {
  const clean = String(text).trim().replace(/\s/g, "");
  if (clean === "") return NaN;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  return Number(normalized);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---------- Demo de la portada: viga biapoyada con una carga puntual ---------- */

function initBeamDemo() {
  const root = document.querySelector("[data-beam-demo]");
  if (!root) return;

  const range = root.querySelector("[data-demo-range]");
  const load = root.querySelector("[data-demo-load]");
  const shearLine = root.querySelector("[data-demo-shear]");
  const shearFill = root.querySelector("[data-demo-shear-fill]");
  const momentLine = root.querySelector("[data-demo-moment]");
  const momentFill = root.querySelector("[data-demo-moment-fill]");
  const momentLabel = root.querySelector("[data-demo-moment-label]");
  const out = {
    ra: root.querySelector('[data-out="ra"]'),
    rb: root.querySelector('[data-out="rb"]'),
    mmax: root.querySelector('[data-out="mmax"]'),
  };

  const L = 6; // luz en m
  const P = 10; // carga en kN
  const X0 = 30; // x del apoyo izquierdo en el SVG
  const X1 = 450; // x del apoyo derecho en el SVG
  const Y_SHEAR = 160; // línea cero del cortante
  const Y_MOMENT = 232; // línea cero del flector (positivo hacia abajo, lado traccionado)
  const K_SHEAR = 3.5; // px por kN
  const K_MOMENT = 4; // px por kN·m

  const px = (x) => X0 + (x / L) * (X1 - X0);
  const yV = (v) => Y_SHEAR - v * K_SHEAR;
  const yM = (m) => Y_MOMENT + m * K_MOMENT;

  function update() {
    const a = Number(range.value);
    const ra = (P * (L - a)) / L;
    const rb = (P * a) / L;
    const mmax = ra * a;
    const xa = px(a);

    load.setAttribute("transform", `translate(${xa.toFixed(1)} 0)`);

    const shear =
      `M${X0} ${yV(0)} L${X0} ${yV(ra).toFixed(1)} L${xa.toFixed(1)} ${yV(ra).toFixed(1)} ` +
      `L${xa.toFixed(1)} ${yV(ra - P).toFixed(1)} L${X1} ${yV(ra - P).toFixed(1)} L${X1} ${yV(0)}`;
    const moment = `M${X0} ${Y_MOMENT} L${xa.toFixed(1)} ${yM(mmax).toFixed(1)} L${X1} ${Y_MOMENT}`;

    shearLine.setAttribute("d", shear);
    shearFill.setAttribute("d", `${shear} Z`);
    momentLine.setAttribute("d", moment);
    momentFill.setAttribute("d", `${moment} Z`);

    momentLabel.setAttribute("x", clamp(xa, 70, 410).toFixed(1));
    momentLabel.setAttribute("y", (yM(mmax) + 16).toFixed(1));
    momentLabel.textContent = `${formatNumber(mmax, 1)} kN·m`;

    out.ra.textContent = formatNumber(ra);
    out.rb.textContent = formatNumber(rb);
    out.mmax.textContent = formatNumber(mmax);
  }

  range.addEventListener("input", update);
  update();
}

/* ---------- Pie: año actual ---------- */

function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

/* ---------- Arranque ---------- */

function init() {
  initTheme();
  initHeader();
  initBeamDemo();
  initYear();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}