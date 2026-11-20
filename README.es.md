<div align="center">

# Ruiz Academy

**Herramientas interactivas para Resistencia de Materiales y cálculo de estructuras.**

Un proyecto personal para explorar y comprender mejor algunos conceptos de ingeniería.

[🌐 Visitar la web](https://ruizacademy.es) · [🇺🇸 Read in English](README.md)

</div>

---

## Sobre el proyecto

Ruiz Academy es un proyecto independiente creado para ayudar a estudiantes de ingeniería, especialmente en asignaturas como **Resistencia de Materiales (REM)** y **Estructuras**.

Soy Alejandro Hernández Ruiz, estudiante de **3.º de Ingeniería Industrial en la Universitat Politècnica de València (UPV)**. A largo plazo, mis intereses se centran en Python, el análisis de datos y la aplicación de la tecnología a problemas de ingeniería.

Quería construir una herramienta útil para la comunidad universitaria. Para ello, aprendí las bases de HTML, CSS y JavaScript y utilicé herramientas de IA como apoyo durante la implementación. Mi papel consistió en definir los requisitos y el comportamiento esperado, orientar la estructura de la aplicación y revisar los cálculos y resultados. La IA formó parte del proceso de desarrollo: no afirmo haber escrito de forma independiente cada línea de código ni ser desarrollador web profesional.

Ruiz Academy es, por tanto, otra forma de aplicar la tecnología a problemas de ingeniería, no un cambio en mi enfoque profesional a largo plazo.

## Herramientas

- **Diagramas de vigas** — cálculo de reacciones en los apoyos y representación de los diagramas de esfuerzo cortante \(V(x)\) y momento flector \(M(x)\) para los casos contemplados por la herramienta.
- **Círculo de Mohr** — exploración de la transformación de tensiones planas mediante un ángulo de giro interactivo y visualización de tensiones transformadas, principales y cortante máximo.
- **Formulario de REM** — buscador de fórmulas organizado por temas y acceso a los correspondientes formularios en PDF.

## Aspectos técnicos

El proyecto utiliza una estructura frontend modular:

- `solver.js` contiene la lógica de cálculo.
- `render.js` se encarga de la representación gráfica mediante Canvas.
- `main.js` conecta los cálculos, la visualización y la interfaz.

Las fórmulas se almacenan como datos estructurados en JSON. Los formularios PDF se preparan a partir de archivos fuente LaTeX.

### Pruebas automatizadas

El proyecto utiliza el **ejecutor de pruebas integrado en Node.js** (`node:test`) y las aserciones de `node:assert/strict`. **No utiliza Jest.**

Las pruebas cubren determinados cálculos del círculo de Mohr, cálculos y propiedades de equilibrio de vigas, y la integridad de los datos de fórmulas y de contenido relacionado de la página. Estas pruebas comprueban los casos incluidos en la suite; no garantizan que cualquier entrada o situación de ingeniería posible esté libre de errores.

Para ejecutar las pruebas, utiliza **Node.js 20 o una versión posterior**:

```bash
npm test
```

No se necesita instalar un framework de pruebas adicional.

## Nota académica

Ruiz Academy es un proyecto educativo independiente. **No está afiliado, avalado ni patrocinado por la Universitat Politècnica de València (UPV)**. Utilízalo como material de apoyo y contrasta los resultados importantes con los apuntes de la asignatura y las referencias académicas correspondientes.

## Licencia

Consulta el archivo [`LICENSE`](LICENSE) para conocer las condiciones aplicables.
