# Estilos

> Principio agnóstico de framework: **siempre hay una capa de estilos
> compartidos** y, encima, los estilos propios de cada componente. Cómo se
> encapsulan los estilos de componente depende del framework (Angular: ver
> [`../stack/angular.md`](../stack/angular.md#9-estilos)); la estructura de
> `src/styles/` es la misma en cualquier proyecto con Sass.

No hay librería de estilos externa: el sistema es propio y vive en
`src/styles/`. La tipografía, el espaciado, los colores y las utilidades se
definen una sola vez y se consumen desde todos los componentes.

## 1. Dos niveles

1. **Estilos de componente** — el sitio por defecto. Cada componente lleva su
   propia hoja con **sus** estilos, aislados del resto. Si un estilo solo afecta
   a un componente, se queda ahí.
2. **Estilos compartidos** — `src/styles/`. Solo lo verdaderamente transversal:
   tokens de diseño, funciones, mixins, estilos base de los elementos HTML y
   clases globales reutilizables.

> **Regla mental:** cuando algo visual se repite mucho, lo normal es **crear un
> componente**. Pero hay cosas que se repiten y **no son un componente** (el
> tamaño de los títulos, un color de marca, un mixin de _flex_ centrado, una
> rejilla de columnas…): eso vive en `src/styles/`, para no replicar los mismos
> valores ni las mismas clases en cada pantalla.

Un estilo nace en su componente y sube a `src/styles/` **solo** cuando aparece
un segundo consumidor real.

## 2. La carpeta `src/styles/`

```
styles/
├── app.scss            ← Entrada global (registrada en el build): solo @use 'base' + @use 'ui'
├── _imports.scss       ← Fachada para componentes: @forward de variables + utils (no genera CSS)
├── base/               ← Cimientos
│   ├── _normalize.scss ← normalize.css (reset entre navegadores; no se edita)
│   ├── _variables.scss ← TODOS los tokens de diseño (única fuente de verdad)
│   └── _globals.scss   ← Estilos base neutros de elementos HTML
├── ui/                 ← Clases globales reutilizables que NO son un componente
│   ├── _grid.scss      ← .grid-template + .col-1…col-12 (+ .new-row)
│   ├── _layouts.scss   ← .field-group, .buttons-group
│   └── _texts.scss     ← .clamped-text
└── utils/              ← Herramientas para escribir estilos (no generan CSS)
    ├── _functions.scss ← rem($px)
    └── _mixins.scss    ← breakpoint, flex-center, text-ellipsis, fade-in, line-clamp, flex-wrap, spin
```

Hay **dos puntos de entrada** y no se confunden:

- `app.scss` se aplica **globalmente** a toda la app: genera CSS real (reset,
  base y clases `ui/`).
- `_imports.scss` es lo que importa **cada hoja de componente**
  (`@use 'imports' as *;`): solo expone variables, funciones y mixins; no genera
  CSS, así que no duplica nada.

### `base/_variables.scss` — tokens de diseño

Variables Sass organizadas por escala; **la única fuente de verdad del diseño**:

- **Colores**: paletas `$color-primary-*`, `$color-secondary-*`,
  `$color-error-*`, `$color-warning-*`, `$color-success-*`, `$color-neutral-*`,
  `$color-basic-black/white`. La paleta del template es un placeholder: cada
  proyecto pone la suya.
- **Tipografía**: `$font-family`, `$base-font-size`, `$small-font-size`,
  `$base-line-height`.
- **Espaciados**: escala `$spacing-5xs` (2px) … `$spacing-9xl` (104px), en
  `rem()`.
- **Bordes**: `$border-radius-xs` … `$border-radius-xxl`.
- **Breakpoints**: mapa `$breakpoints` (phone/tablet/laptop/desktop/wide-screen)
  que consume `@include breakpoint($device)`.
- **Otros**: `$page-max-width`, `$transition-speed`, `$z-index-*`, `$shadow-*`.

### `base/_globals.scss` — estilos base neutros

Solo lo que cualquier proyecto quiere y **no es una decisión de diseño**:

- `box-sizing: border-box` para todo.
- `body` con la tipografía y el color de texto globales (los tokens).
- `img` responsive (`max-width: 100%`).
- Márgenes de `h1`–`h6` a cero (el espaciado lo pone cada layout).

**Deliberadamente no hay** estilos de diseño de elementos: tamaños y colores de
títulos, aspecto de inputs, selects, textareas y botones, estilo de foco
(`:focus-visible`), listas sin viñetas, clases de error de formulario… Eso lo
decide cada proyecto con su diseño: cuando se defina, sus reglas de elemento van
aquí y sus clases reutilizables en `ui/`. Recordatorio de accesibilidad: si se
cambia el foco por defecto del navegador, el nuevo debe seguir siendo claramente
visible.

### `ui/` — clases globales reutilizables

Estilos que se repiten mucho pero no justifican un componente:

- **`_grid.scss`**: rejilla de 12 columnas. `.grid-template` como contenedor y
  `.col-1`…`.col-12` para el ancho de cada hijo (`.new-row` fuerza salto de
  fila); en móvil pasa a una columna.
- **`_layouts.scss`**: `.field-group` (label + control) y `.buttons-group`
  (barra de botones).
- **`_texts.scss`**: `.clamped-text` (recorte a N líneas).

Estas clases **se usan, pero jamás se redefinen** en la hoja de un componente:
el componente solo añade sus espaciados y detalles propios.

### `utils/` — herramientas

- `rem($px)`: convierte píxeles a `rem` (`rem(24)` → `1.5rem`). Todos los
  tamaños en px pasan por él.
- Mixins: `breakpoint($device)`, `flex-center`, `text-ellipsis`, `fade-in`,
  `line-clamp`, `flex-wrap`, `spin`.

## 3. Cómo se escribe la hoja de un componente

```scss
@use 'imports' as *; // primera línea: tokens, funciones y mixins

:host {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  @include breakpoint('tablet') {
    gap: $spacing-md;
  }
}
```

- **Tokens y mixins siempre**: nunca colores, espaciados ni tamaños a pelo, ni
  estilos inline en la plantilla.
- El aislamiento del componente lo da el framework (en Angular, la encapsulación
  por defecto y `:host`); nunca se desactiva para "filtrar" estilos a otros
  componentes: si algo debe ser global, va a `src/styles/`.

## 4. Dónde poner un estilo nuevo

| ¿Qué es?                                                       | Dónde                       |
| -------------------------------------------------------------- | --------------------------- |
| Solo lo usa un componente                                      | Su hoja, dentro de `:host`  |
| Un valor de diseño (color, espacio, tamaño, breakpoint…)       | `base/_variables.scss`      |
| El estilo por defecto de un elemento HTML (decisión de diseño) | `base/_globals.scss`        |
| Un patrón visual reutilizable que no es un componente          | `ui/` (un fichero por tema) |
| Una función o mixin para escribir estilos                      | `utils/`                    |

## 5. Reglas automáticas

- **Stylelint** (`npm run lint:styles`): anidamiento ≤ 3, ≤ 4 selectores
  compuestos, sin `!important`, sin selectores de id, sin colores por nombre.
  Los comentarios `stylelint-disable` se ignoran. `npm run format` aplica los
  arreglos automáticos.
- **Presupuesto** del build de producción: cada hoja de componente ≤ 3 kB
  (aviso) / 6 kB (error). Si un componente crece más, se divide.

## 6. Nota sobre el template

Las clases de `ui/` y los mixins son una base genérica y deliberadamente
sencilla. Si un proyecto adopta un design system o una librería de estilos, lo
que deje de usarse se elimina sin miedo; la estructura de dos niveles
(compartido + componente) se mantiene.
