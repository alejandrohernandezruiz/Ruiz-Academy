/* RuizAcademy · formulario/main.js
   Carga formulas.json, lo pinta con KaTeX y añade buscador y filtro por parcial. */

import { debounce } from "../../assets/js/common.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const results = $("#resultados");
const indexList = $("#indice");
const input = $("#buscar");
const status = $("#estado");
const empty = $("#sin-resultados");
const state = { query: "", parcial: "all" };

/* Quita tildes y mayúsculas para que "traccion" encuentre "tracción" */
const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function math(latex, display = false) {
  if (!window.katex) return `<code>${escapeHtml(latex)}</code>`; // sin KaTeX se muestra el LaTeX en bruto
  return window.katex.renderToString(latex, { displayMode: display, throwOnError: false, strict: "ignore" });
}

/* Texto con $matemáticas$ en línea y **negrita** */
function rich(text) {
  return text
    .split("$")
    .map((part, i) =>
      i % 2 ? math(part) : escapeHtml(part).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    )
    .join("");
}

function table({ cabeceras, filas }) {
  const head = cabeceras.map((c) => `<th scope="col">${rich(c)}</th>`).join("");
  const body = filas.map((fila) => `<tr>${fila.map((c) => `<td>${rich(c)}</td>`).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table class="table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function searchText(item, tema, parcial) {
  const parts = [
    item.titulo,
    item.texto,
    ...(item.lista || []),
    ...(item.donde || []),
    item.nota,
    item.claves,
    item.latex && item.latex.replace(/[\\{}^_]/g, " "),
    item.tabla && item.tabla.filas.flat().join(" "),
    `tema ${tema.numero}`,
    tema.titulo,
    parcial.nombre,
  ];
  return normalize(parts.filter(Boolean).join(" ").replace(/\$/g, " "));
}

function card(item, tema, parcial) {
  const wide = item.tabla || item.lista || (item.latex && item.latex.length > 260);
  const copy = item.latex
    ? `<button class="btn btn-ghost fm-copy" type="button" data-latex="${escapeHtml(item.latex)}" aria-label="Copiar el LaTeX de ${escapeHtml(item.titulo)}">LaTeX</button>`
    : "";
  return [
    `<article class="sheet fm-card${wide ? " wide" : ""}" data-search="${escapeHtml(searchText(item, tema, parcial))}">`,
    `<div class="fm-card__head"><h4>${rich(item.titulo)}</h4>${copy}</div>`,
    item.texto ? `<p>${rich(item.texto)}</p>` : "",
    item.lista ? `<ul>${item.lista.map((l) => `<li>${rich(l)}</li>`).join("")}</ul>` : "",
    item.latex ? `<div class="fm-math" tabindex="0" role="group" aria-label="Fórmula">${math(item.latex, true)}</div>` : "",
    item.tabla ? table(item.tabla) : "",
    item.donde ? `<ul class="fm-where">${item.donde.map((d) => `<li>${rich(d)}</li>`).join("")}</ul>` : "",
    item.nota ? `<p class="fm-note">${rich(item.nota)}</p>` : "",
    `</article>`,
  ].join("");
}

function build(data) {
  const sections = [];
  const links = [];

  for (const parcial of data.parciales) {
    const temaHtml = [];
    const temaLinks = [];
    for (const tema of parcial.temas) {
      const id = `${parcial.id}-tema-${tema.numero}`;
      temaHtml.push(
        `<section class="fm-tema" id="${id}" data-tema aria-labelledby="${id}-t">` +
          `<h3 id="${id}-t"><span>Tema ${tema.numero}</span> ${escapeHtml(tema.titulo)}</h3>` +
          `<div class="fm-items">${tema.items.map((item) => card(item, tema, parcial)).join("")}</div></section>`
      );
      temaLinks.push(
        `<li data-link="${id}"><a href="#${id}">Tema ${tema.numero}<span class="fm-count" data-count></span></a></li>`
      );
    }
    sections.push(
      `<section class="fm-parcial" data-parcial="${parcial.id}" aria-labelledby="${parcial.id}-h">` +
        `<h2 id="${parcial.id}-h">${escapeHtml(parcial.nombre)}</h2>${temaHtml.join("")}</section>`
    );
    links.push(
      `<li data-group="${parcial.id}"><strong>${escapeHtml(parcial.nombre)}</strong><ul>${temaLinks.join("")}</ul></li>`
    );
  }

  results.innerHTML = sections.join("");
  indexList.innerHTML = links.join("");
}

function applyFilter() {
  const tokens = normalize(state.query).split(/\s+/).filter(Boolean);
  let total = 0;

  for (const section of $$("[data-parcial]")) {
    const parcialOn = state.parcial === "all" || state.parcial === section.dataset.parcial;
    let parcialCount = 0;

    for (const tema of $$("[data-tema]", section)) {
      let count = 0;
      for (const item of $$("[data-search]", tema)) {
        const visible = parcialOn && tokens.every((t) => item.dataset.search.includes(t));
        item.hidden = !visible;
        if (visible) count++;
      }
      tema.hidden = count === 0;
      const link = $(`[data-link="${tema.id}"]`);
      link.hidden = count === 0;
      $("[data-count]", link).textContent = String(count);
      parcialCount += count;
    }

    section.hidden = parcialCount === 0;
    $(`[data-group="${section.dataset.parcial}"]`).hidden = parcialCount === 0;
    total += parcialCount;
  }

  status.textContent = total > 0 ? `${total} resultado${total === 1 ? "" : "s"}` : "";
  empty.hidden = total > 0;
}

function syncUrl() {
  const url = new URL(location.href);
  if (state.query) url.searchParams.set("q", state.query);
  else url.searchParams.delete("q");
  history.replaceState(null, "", url);
}

function bindEvents() {
  const onInput = debounce(() => {
    state.query = input.value.trim();
    applyFilter();
    syncUrl();
  }, 120);
  input.addEventListener("input", onInput);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && input.value) {
      input.value = "";
      onInput();
    }
  });

  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      input.focus();
    }
  });

  for (const chip of $$("[data-filter]")) {
    chip.addEventListener("click", () => {
      state.parcial = chip.dataset.filter;
      for (const other of $$("[data-filter]")) other.setAttribute("aria-pressed", String(other === chip));
      applyFilter();
    });
  }

  results.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-latex]");
    if (!button) return;
    try {
      await navigator.clipboard.writeText(button.dataset.latex);
      button.textContent = "Copiado";
    } catch {
      button.textContent = "No se pudo";
    }
    setTimeout(() => (button.textContent = "LaTeX"), 1400);
  });
}

async function init() {
  try {
    const response = await fetch("formulas.json");
    if (!response.ok) throw new Error(String(response.status));
    build(await response.json());
  } catch {
    results.innerHTML =
      '<p class="field-error" role="alert">No se pudo cargar el formulario. Si abres el archivo con doble clic no funciona: usa Live Server o la web publicada.</p>';
    return;
  }

  bindEvents();
  const initial = new URLSearchParams(location.search).get("q");
  if (initial) {
    input.value = initial;
    state.query = initial;
  }
  applyFilter();
}

init();
