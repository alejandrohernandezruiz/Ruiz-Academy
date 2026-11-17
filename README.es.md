<div align="center">

# 📐 Ruiz Academy — Herramientas de Ingeniería y Estructuras

**Herramientas web interactivas para Resistencia de Materiales (REM) y Cálculo de Estructuras.**  
Desarrollado por un estudiante de ingeniería, para estudiantes de ingeniería.

[🌐 Visitar la Web (ruizacademy.es)](https://ruizacademy.es) · [🇺🇸 Read in English](README.md)

</div>

---

## 💡 Sobre el Proyecto y Mi Historia (Transparencia Total)

¡Hola! Soy un **estudiante de Ingeniería Industrial de 20 años**, actualmente en **2.º de carrera** en la **Universitat Politècnica de València (UPV)**.

Soy autodidacta con el lenguaje de programación **Python** y mi objetivo a largo plazo como ingeniero industrial es conectar Python con problemas reales de ingeniería, análisis de datos y optimización de procesos. Sin embargo, tenía un dominio web personal comprado (`ruizacademy.es`) de un proyecto anterior y no quería desperdiciarlo.

Por pura curiosidad y con ganas de construir un proyecto real que aportara valor a la comunidad de estudiantes de mi universidad —especialmente en asignaturas clave y exigentes como **Resistencia de Materiales (REM)** y **Estructuras**—, decidí aprender por mi cuenta las bases mínimas de **HTML, CSS y JavaScript**.

### 🎼 El papel de "Director de Orquesta" apalancado en IA
Al ser estudiante a tiempo completo y no desarrollador web profesional, aprender tres lenguajes de frontend al 100 % habría retrasado este proyecto durante meses. En lugar de dejar que esa limitación de tiempo frenara la publicación de la web, **decidí apalancarme en la Inteligencia Artificial para construir el producto**.

Mi rol ha sido el de **arquitecto y director de orquesta**: definir los requisitos técnicos, exigir el convenio de signos exacto que se usa en la UPV, diseñar una arquitectura modular limpia y validar cada resultado matemático contrastándolo con exámenes reales resueltos por profesores. Quiero ser 100 % transparente con mi proceso, mis limitaciones actuales como programador y mi intención real de ayudar a compañeros de ingeniería industrial, civil o mecánica a visualizar conceptos difíciles.

---

## 🛠️ Herramientas Incluidas

1. **Diagramas Interactivos de Vigas 2D (`herramientas/vigas/`):**
   * Cálculo en tiempo real de reacciones en apoyos, esfuerzos cortantes V(x) y momentos flectores M(x) siguiendo el criterio de fibras traccionadas de la UPV (momentos positivos dibujados hacia abajo).
2. **Visualizador del Círculo de Mohr 2D (`herramientas/mohr/`):**
   * Calculadora dinámica de transformación de tensiones (\(\sigma_x, \sigma_y, \tau_{xy}\)) con un deslizador interactivo de ángulo (θ) que renderiza las tensiones principales y el cortante máximo al instante.
3. **Formulario Inteligente UPV (`herramientas/formulario/`):**
   * Buscador rápido de fórmulas de REM dividido en Parcial 1 (Temas 1–6) y Parcial 2 (Temas 7–10), renderizado con KaTeX y con descarga directa de los formularios pasados a limpio en LaTeX.

---

## 📂 Estructura del Proyecto

El código sigue una arquitectura Frontend modular sin dependencias pesadas, separando la física pura (`solver.js`) del dibujo gráfico (`render.js`) y la interfaz (`main.js`):

```text
Ruiz-Academy/
├── assets/
│   ├── css/
│   │   ├── base.css                  # Variables globales, reset, tipografía y modo oscuro
│   │   ├── components.css            # Botones, tarjetas, inputs y tablas reutilizables
│   │   └── tools.css                 # Layout común para las calculadoras
│   ├── img/                          # Recursos visuales e iconos
│   └── js/
│       └── common.js                 # Utilidades compartidas y cambio de tema
├── herramientas/
│   ├── formulario/
│   │   ├── pdf/
│   │   │   ├── formulario-parcial-1-2025.pdf
│   │   │   └── formulario-parcial-2-2025.pdf
│   │   ├── build-latex.mjs           # Script automatizado para compilar LaTeX
│   │   ├── formulario-parcial-1-2025.tex
│   │   ├── formulario-parcial-2-2025.tex
│   │   ├── formulas.json             # Base de datos de fórmulas desacoplada
│   │   ├── index.html
│   │   └── main.js
│   ├── mohr/
│   │   ├── index.html
│   │   ├── main.js                   # Une interfaz, solver y dibujo
│   │   ├── render.js                 # Dibujo en Canvas HTML5 del Círculo de Mohr
│   │   └── solver.js                 # Física pura y ecuaciones de transformación
│   └── vigas/
│       ├── index.html
│       ├── main.js                   # Une interfaz, solver y dibujo
│       ├── render.js                 # Dibujo en Canvas HTML5 de V(x) y M(x)
│       └── solver.js                 # Física pura analítica de vigas
├── tests/
│   ├── formulario.test.js            # Pruebas de integridad del JSON de fórmulas
│   ├── mohr.test.js                  # Pruebas unitarias de estados tensionales
│   └── vigas.test.js                 # Pruebas contrastadas con exámenes reales UPV
├── index.html                        # Portada principal y selector de herramientas
├── LICENSE                           # Derechos reservados y condiciones de uso
├── package.json                      # Configuración de Node.js y Jest
└── README.md                         # Documentación principal en inglés
```

---

## 🧪 Validación Matemática (Tests Unitarios)

Para garantizar que las herramientas no cometen errores de cálculo, los motores matemáticos (`solver.js`) pasan pruebas automatizadas en local con **Jest** contrastadas con ejercicios reales de examen:

```bash
npm install
npm test
```

---

## ⚖️ Aviso Legal y Licencia

* **Aviso Académico:** Este es un proyecto independiente creado por y para estudiantes. No está afiliado, patrocinado ni vinculado oficialmente con la *Universitat Politècnica de València (UPV)*.
* **Licencia:** Consulta el archivo [LICENSE](LICENSE) para conocer los términos de uso y propiedad intelectual.
