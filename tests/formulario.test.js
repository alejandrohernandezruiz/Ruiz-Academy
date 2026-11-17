/* Tests de integridad de herramientas/formulario/formulas.json y de la página. Se ejecutan con: npm test */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const data = JSON.parse(read("herramientas/formulario/formulas.json"));
const html = read("herramientas/formulario/index.html");

const items = data.parciales.flatMap((p) => p.temas.flatMap((t) => t.items.map((item) => ({ p, t, item }))));
const count = (text, regex) => (text.match(regex) || []).length;
const strings = ({ item }) => [item.titulo, item.texto, item.nota, ...(item.lista || []), ...(item.donde || [])].filter(Boolean);

describe("formulas.json", () => {
  test("cada parcial y cada tema tiene identificador y contenido", () => {
    const ids = data.parciales.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const p of data.parciales) {
      assert.ok(p.nombre && p.temas.length > 0, p.id);
      const numeros = p.temas.map((t) => t.numero);
      assert.equal(new Set(numeros).size, numeros.length, `temas repetidos en ${p.id}`);
      for (const t of p.temas) assert.ok(t.titulo && t.items.length > 0, `tema ${t.numero} vacío`);
    }
  });

  test("cada elemento tiene título y algún contenido, sin títulos repetidos en un tema", () => {
    for (const { t, item } of items) {
      assert.ok(item.titulo, `sin título en el tema ${t.numero}`);
      assert.ok(item.latex || item.texto || item.lista || item.tabla, `vacío: ${item.titulo}`);
    }
    for (const p of data.parciales) {
      for (const t of p.temas) {
        const titles = t.items.map((i) => i.titulo);
        assert.equal(new Set(titles).size, titles.length, `títulos repetidos en el tema ${t.numero}`);
      }
    }
  });

  test("los $ de los textos están balanceados", () => {
    for (const entry of items) {
      for (const s of strings(entry)) assert.equal(count(s, /\$/g) % 2, 0, `$ sin cerrar en: ${s}`);
    }
  });

  test("cada fórmula tiene llaves, \\begin/\\end y \\left/\\right equilibrados", () => {
    const formulas = [...items.filter(({ item }) => item.latex).map(({ item }) => item.latex)];
    for (const entry of items) {
      for (const s of strings(entry)) formulas.push(...s.split("$").filter((_, i) => i % 2));
    }
    for (const f of formulas) {
      const plain = f.replace(/\\[{}]/g, "");
      assert.equal(count(plain, /\{/g), count(plain, /\}/g), `llaves en: ${f}`);
      assert.equal(count(f, /\\begin\{/g), count(f, /\\end\{/g), `begin/end en: ${f}`);
      assert.equal(count(f, /\\left/g), count(f, /\\right/g), `left/right en: ${f}`);
    }
  });
});

describe("index.html", () => {
  test("muestra el aviso de transparencia exacto", () => {
    const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
    assert.ok(text.includes(data.meta.aviso), "el aviso del HTML no coincide con meta.aviso");
  });

  test("enlaza un PDF por parcial con el nombre acordado", () => {
    for (const p of data.parciales) {
      assert.ok(
        html.includes(`../../pdf/formulario-${p.id}-${data.meta.curso}.pdf`),
        `falta el enlace al PDF de ${p.id}`
      );
    }
  });
});
