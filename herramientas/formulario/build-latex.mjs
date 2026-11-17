/* Genera latex/formulario-<parcial>-<curso>.tex a partir de herramientas/formulario/formulas.json.
   Así la web y los PDF salen siempre de la misma fuente.
   Uso:  npm run latex   (después, compila los .tex con Overleaf o con latexmk -pdf) */

import { readFile, writeFile, mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const data = JSON.parse(await readFile(new URL("herramientas/formulario/formulas.json", root), "utf8"));
const { aviso, curso } = data.meta;

const ESCAPES = { "\\": "\\textbackslash{}", "~": "\\textasciitilde{}", "^": "\\textasciicircum{}" };
const escapeText = (s) => s.replace(/[\\&%#_{}~^]/g, (c) => ESCAPES[c] ?? `\\${c}`);

/* Texto con $matemáticas$ y **negrita** */
function rich(text) {
  if ((text.match(/\$/g) || []).length % 2 !== 0) throw new Error(`Falta cerrar un $ en: ${text}`);
  return text
    .split("$")
    .map((part, i) => (i % 2 ? `$${part}$` : escapeText(part).replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}")))
    .join("");
}

const list = (items) =>
  `{\\small\\begin{itemize}[leftmargin=*,nosep,label={--}]\n${items.map((l) => `\\item ${rich(l)}`).join("\n")}\n\\end{itemize}}`;

function tabla({ cabeceras, filas }) {
  const widths = [0.3, 0.36, 0.22];
  const spec = cabeceras.map((_, i) => `p{${widths[i] ?? 0.2}\\linewidth}`).join("");
  const head = cabeceras.map((c) => `\\textbf{${rich(c)}}`).join(" & ");
  const body = filas.map((f) => `${f.map(rich).join(" & ")} \\\\`).join("\n\\hline\n");
  return `{\\renewcommand{\\arraystretch}{1.3}\\begin{tabular}{${spec}}\n\\hline\n${head} \\\\\n\\hline\n${body}\n\\\\\\hline\n\\end{tabular}}`;
}

function item(it) {
  const parts = ["\\begin{tcolorbox}[itembox]", `\\textbf{${rich(it.titulo)}}\\par`];
  if (it.texto) parts.push(`\\smallskip\\noindent ${rich(it.texto)}\\par`);
  if (it.lista) parts.push(list(it.lista));
  if (it.latex) parts.push(`\\[\n${it.latex}\n\\]`);
  if (it.tabla) parts.push(tabla(it.tabla));
  if (it.donde) parts.push(list(it.donde));
  if (it.nota) parts.push(`\\smallskip\\noindent{\\small\\itshape ${rich(it.nota)}}\\par`);
  parts.push("\\end{tcolorbox}");
  return parts.join("\n");
}

function document(parcial) {
  const numeros = parcial.temas.map((t) => t.numero);
  const rango = `Temas ${Math.min(...numeros)} a ${Math.max(...numeros)}`;
  const temas = parcial.temas
    .map((t) => `\\tema{${t.numero}}{${rich(t.titulo)}}\n\n${t.items.map(item).join("\n\n")}`)
    .join("\n\n");

  return String.raw`\documentclass[10pt,a4paper]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{lmodern}
\usepackage[spanish,es-noshorthands]{babel}
\usepackage{amsmath,amssymb}
\usepackage[a4paper,margin=1.7cm,top=2.1cm,bottom=2cm]{geometry}
\usepackage{xcolor}
\usepackage{enumitem}
\usepackage{fancyhdr}
\usepackage[skins]{tcolorbox}

\definecolor{ink}{HTML}{0F2A47}
\definecolor{signal}{HTML}{F2C200}

\tcbset{itembox/.style={colback=white,colframe=ink!30,boxrule=0.5pt,arc=1.2mm,
  left=8pt,right=8pt,top=4pt,bottom=4pt,before skip=7pt,after skip=0pt}}

\setlength{\parindent}{0pt}
\setlength{\abovedisplayskip}{5pt}
\setlength{\belowdisplayskip}{5pt}
\setlength{\abovedisplayshortskip}{3pt}
\setlength{\belowdisplayshortskip}{3pt}

\newcommand{\tema}[2]{\vspace{1.1em}{\large\bfseries\color{ink}Tema #1\quad #2}\par\vspace{1pt}{\color{signal}\rule{\linewidth}{1.4pt}}\par\vspace{-2pt}}

\pagestyle{fancy}
\fancyhf{}
\renewcommand{\headrulewidth}{0.4pt}
\fancyhead[L]{\small Formulario de REM -- ${parcial.nombre}}
\fancyhead[R]{\small ruizacademy.es}
\fancyfoot[L]{\footnotesize Formulario orientativo elaborado por un alumno (Curso ${curso})}
\fancyfoot[R]{\small\thepage}

\begin{document}

\begin{tcolorbox}[colback=ink,colframe=ink,coltext=white,arc=1.5mm,boxrule=0pt,left=10pt,right=10pt,top=8pt,bottom=8pt]
{\Large\bfseries Formulario de REM}\\[3pt]
{\large ${parcial.nombre} $\cdot$ ${rango} $\cdot$ Curso ${curso}}
\end{tcolorbox}

\begin{tcolorbox}[enhanced,colback=signal!14,colframe=signal!14,boxrule=0pt,arc=0mm,
  borderline west={3pt}{0pt}{signal},left=9pt,right=8pt,top=5pt,bottom=5pt,before skip=8pt]
\small ${rich(aviso)}
\end{tcolorbox}

${temas}

\end{document}
`;
}

await mkdir(new URL("latex/", root), { recursive: true });
for (const parcial of data.parciales) {
  const file = `latex/formulario-${parcial.id}-${curso}.tex`;
  await writeFile(new URL(file, root), document(parcial), "utf8");
  console.log(`Escrito ${file}`);
}
