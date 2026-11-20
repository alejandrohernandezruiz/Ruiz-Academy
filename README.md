<div align="center">

# Ruiz Academy

**Interactive engineering tools for Strength of Materials and structural analysis.**

A student-built project to make selected engineering concepts easier to explore and understand.

[🌐 Website](https://ruizacademy.es) · [🇪🇸 Versión en español](README.es.md)

</div>

---

## About

Ruiz Academy is an independent project created to support engineering students, especially those studying **Strength of Materials (REM)** and **Structures**.

I'm Alejandro Hernández Ruiz, a **third-year Industrial Engineering student at the Universitat Politècnica de València (UPV)**. My long-term interests are Python, data analysis and the application of technology to engineering problems.

I started this project to build something useful for my university community. To do so, I learned the fundamentals of HTML, CSS and JavaScript and used AI tools to assist with implementation. I defined the project requirements and expected behaviour, guided the structure of the application, and reviewed the calculations and outputs. AI was part of the development process; this is not a claim that I independently authored every line of code or that I am a professional web developer.

Ruiz Academy is therefore an extension of my interest in applying technology to engineering problems—not a change in my long-term focus.

## Tools

- **Beam diagrams** — calculate support reactions and display shear-force \(V(x)\) and bending-moment \(M(x)\) diagrams for the beam cases supported by the tool.
- **Mohr's circle** — explore plane-stress transformations by changing the rotation angle and observing the resulting stresses, principal stresses and maximum shear.
- **REM formula reference** — search formulas organised by topic and access the corresponding PDF reference sheets.

## Technical overview

The project uses a modular frontend structure:

- `solver.js` contains calculation logic.
- `render.js` handles Canvas-based visualisation.
- `main.js` connects the calculations, visual output and user interface.

The formula reference is stored as structured data in JSON. The PDF reference sheets are prepared from LaTeX source files.

### Automated tests

The project uses **Node.js's built-in test runner** (`node:test`) and assertions from `node:assert/strict`. It does **not** use Jest.

The test suite covers selected Mohr's circle calculations, beam calculations and equilibrium properties, as well as the integrity of the formula data and related page content. These tests provide checks for the cases they cover; they do not guarantee that every possible input or engineering situation is error-free.

To run the tests, use **Node.js 20 or later**:

```bash
npm test
```

No additional test framework is required.

## Academic note

Ruiz Academy is an independent educational project. It is **not affiliated with, endorsed by or sponsored by the Universitat Politècnica de València (UPV)**. Use it as a study aid and check important results against your course material and the relevant academic references.

## License

See the [`LICENSE`](LICENSE) file for the applicable terms.
