<div align="center">

# 📐 Ruiz Academy — Engineering & Mechanics Tools

**Interactive web tools for Strength of Materials (REM) and Structural Analysis.**  
Built by an engineering student, for engineering students.

[🌐 Live Website (ruizacademy.es)](https://ruizacademy.es) · [🇪🇸 Leer en Español](README.es.md)

</div>

---

## 💡 About the Project & My Story (Full Transparency)

Hi! I'm a **20-year-old 3nd-year Industrial Engineering student** at the **Universitat Politècnica de València (UPV)** in Spain. 

I am self-taught in **Python**, and my long-term goal as an industrial engineer is to connect Python with real-world engineering problems, data analysis, and process optimization. However, I happened to own a personal domain (`ruizacademy.es`) from a previous project and I didn't want to let it go to waste.

Out of pure curiosity and a desire to build a real, useful product for my university community—specifically for tough core subjects like **Strength of Materials (REM)** and **Structures**—I decided to self-teach myself the core fundamentals of **HTML, CSS, and JavaScript** from scratch.

### 🎼 Acting as the "Orchestra Conductor" with AI
Because I am an engineering student with limited time—not a full-time web developer—learning three frontend languages to 100% mastery would have delayed launching this project for months. Instead of letting that stop me, **I leveraged Artificial Intelligence as a development accelerator**. 

I acted as the **product architect and orchestra conductor**: defining the engineering requirements, enforcing UPV academic sign conventions, structuring the modular codebase, and validating every mathematical output against real past university exams. I believe in total transparency regarding my workflow, my current technical limits, and my genuine intention to help fellow industrial, civil, and mechanical engineering students visualize complex concepts.

---

## 🛠️ Included Tools

1. **Interactive 2D Beam Diagrams (`herramientas/vigas/`):**
   * Real-time calculation of support reactions, shear force diagrams V(x), and bending moment diagrams M(x) using UPV sign conventions (tensioned bottom fibers drawn downwards).
2. **2D Mohr's Circle Visualizer (`herramientas/mohr/`):**
   * Dynamic stress transformation calculator (\(\sigma_x, \sigma_y, \tau_{xy}\)) with an interactive rotation angle slider (θ) rendering principal stresses and maximum shear in real time.
3. **UPV Smart Formula Sheet (`herramientas/formulario/`):**
   * Searchable database of Strength of Materials formulas divided into Midterm 1 (Units 1–6) and Midterm 2 (Units 7–10), rendered with KaTeX and accompanied by clean LaTeX-compiled PDF downloads.

---

## 📂 Project Architecture

The project follows a clean, zero-dependency Frontend architecture that decouples pure physics/math (`solver.js`) from canvas rendering (`render.js`) and DOM manipulation (`main.js`):

```text
Ruiz-Academy/
├── assets/
│   ├── css/
│   │   ├── base.css                  # Global variables, reset, typography & dark/light theme
│   │   ├── components.css            # Reusable UI cards, buttons, inputs & tables
│   │   └── tools.css                 # Specific layout for engineering calculators
│   ├── img/                          # Static visual assets & icons
│   └── js/
│       └── common.js                 # Shared utilities & theme switcher
├── herramientas/
│   ├── formulario/
│   │   ├── pdf/
│   │   │   ├── formulario-parcial-1-2025.pdf
│   │   │   └── formulario-parcial-2-2025.pdf
│   │   ├── build-latex.mjs           # Automated script for LaTeX generation
│   │   ├── formulario-parcial-1-2025.tex
│   │   ├── formulario-parcial-2-2025.tex
│   │   ├── formulas.json             # Decoupled structured formula database
│   │   ├── index.html
│   │   └── main.js
│   ├── mohr/
│   │   ├── index.html
│   │   ├── main.js                   # Connects UI events, solver & canvas
│   │   ├── render.js                 # HTML5 Canvas rendering for Mohr's Circle
│   │   └── solver.js                 # Pure physics & stress transformation math
│   └── vigas/
│       ├── index.html
│       ├── main.js                   # Connects UI events, solver & canvas
│       ├── render.js                 # HTML5 Canvas rendering for V(x) and M(x)
│       └── solver.js                 # Pure analytical beam mechanics
├── tests/
│   ├── formulario.test.js            # Automated tests for formula data integrity
│   ├── mohr.test.js                  # Automated tests for stress states
│   └── vigas.test.js                 # Unit tests validated against real UPV exams
├── index.html                        # Main landing page & tool selector
├── LICENSE                           # Proprietary / All Rights Reserved notice
├── package.json                      # Node.js & Jest testing configuration
└── README.md                         # Project documentation
```

---

## 🧪 Mathematical Validation (TDD)

To guarantee academic accuracy, the mathematical engines (`solver.js`) are verified locally using **Jest** against analytical problems and past exams solved by UPV professors:

```bash
npm install
npm test
```

---

## ⚖️ Disclaimer & License

* **Academic Disclaimer:** This is an independent student-led project created to support engineering students. It is not officially affiliated with, endorsed, or sponsored by the *Universitat Politècnica de València (UPV)*.
* **License:** See the [LICENSE](LICENSE) file for usage and redistribution terms.
