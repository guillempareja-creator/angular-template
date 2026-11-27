# Arquitectura — visión general

> Documento **agnóstico de framework y de negocio**: describe cómo estructuramos
> y escribimos el código frontend en cualquier proyecto. Lo específico del
> framework actual (Angular) vive en
> [`../stack/angular.md`](../stack/angular.md); si un proyecto usa otro
> framework, se sustituye ese documento y este se mantiene.
>
> Las reglas no se quedan en papel: casi todas están automatizadas en los
> quality gates ([`quality.md`](quality.md)) y una tarea no está terminada hasta
> que `npm run check` pasa en verde.

## Índice de la arquitectura

| Documento                                    | Qué cubre                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `overview.md` (este)                         | Principios, capas, carpetas, dependencias, nomenclatura, ids             |
| [`api.md`](api.md)                           | Capa de API (una o varias APIs), tipos, entornos, interceptor y mock MSW |
| [`styles.md`](styles.md)                     | Estilos compartidos + estilos de componente                              |
| [`i18n.md`](i18n.md)                         | Textos visibles y claves de traducción                                   |
| [`testing.md`](testing.md)                   | Tests unitarios y e2e (cómo funciona Playwright)                         |
| [`quality.md`](quality.md)                   | Quality gates, git hooks, CI, Definition of Done y checklist             |
| [`../stack/angular.md`](../stack/angular.md) | Particularidades de Angular                                              |
| [`../ai/workflow.md`](../ai/workflow.md)     | Cómo trabajamos con IA (Copilot y Claude Code)                           |

---

## 1. Principios

1. **Screaming architecture**: la estructura de carpetas grita el dominio, no el
   framework. `pages/person/`, `pages/expedient/`… son _vertical slices_: cada
   dominio contiene sus pantallas, componentes, servicios, enums y utilidades.
2. **Los ficheros viven en el nivel más bajo posible.** Un componente, servicio
   o util nace dentro de la pantalla que lo usa y solo sube (a la carpeta del
   dominio o a `shared/`) cuando aparece un **segundo consumidor real**.
   `shared/` no es un cajón de sastre.
3. **Componentes tontos, lógica en servicios.** Los componentes orquestan y
   pintan; el estado compartido y la lógica de negocio viven en servicios.
4. **Extraer a la mínima.** Cualquier transformación reutilizable (formateo,
   mapeo, validación) va a un util, un pipe/filtro o un validator; nunca se
   duplica ni se deja inline. Para transformaciones de presentación en plantilla
   se prefieren pipes/filtros a métodos del componente.
5. **Reutilización**: un formulario que se usa en alta y en edición es **un solo
   componente** parametrizado; nunca dos copias.
6. **Todo tipado, todo explícito**: TypeScript estricto, sin `any` (`unknown` +
   type guard), tipos moleculares compartidos y visibilidad explícita.
7. **async/await**: la capa de API devuelve `Promise`; nada de suscripciones
   manuales salvo donde el framework lo exija (interceptores).
8. **Sin dependencias gratuitas**: añadir una librería exige justificar qué
   resuelve que no resuelva el framework o un util propio, y que el bundle siga
   dentro de presupuesto.
9. **Calidad verificable**: todo fichero con lógica nace con su test; todo flujo
   de usuario, con su e2e; y lo que se puede comprobar se comprueba de forma
   automática.
10. **Nada de cajas negras**: cada pieza del template está documentada aquí y
    ejemplificada en el código, para que cualquiera (humano o IA) entienda cómo
    funciona y cómo escala.

---

## 2. Capas

```
core/     Infraestructura y estado global singleton: APIs, interceptor, i18n, guards, servicios
pages/    Dominios de negocio (vertical slices): pantallas y todo lo que solo usan ellas
shared/   Piezas reutilizables entre 2+ dominios: componentes, pipes, utils, validators, modelos…
```

**¿Core o shared?** `core/` es infraestructura (HTTP, i18n, sesión,
configuración): existe una vez y no pinta UI. `shared/` son piezas reutilizables
(componentes, utilidades) que usan varios dominios.

**Dirección de dependencias** (la comprueban `npm run lint:arch` y ESLint):

- `pages/` → `shared/` y `core/`. Nunca al revés: `core/` y `shared/` no
  importan de `pages/`.
- Un dominio de `pages/` **no importa otro dominio**: lo común se promociona a
  `shared/`.
- `shared/` puede usar servicios y APIs de `core/`, pero no `core/guards/` ni
  `core/interceptors/`.
- La app nunca importa el fake backend (`src/fake-backend/`): solo lo carga el
  arranque.
- Sin dependencias circulares ni ficheros huérfanos; el código de producción no
  importa tests ni `devDependencies`.

---

## 3. Estructura del repositorio

```
AGENTS.md                ← Instrucciones para agentes de IA (fuente única, ver docs/ai/workflow.md)
README.md                ← Arranque rápido, comandos y mapa de documentación
.claude/                 ← Configuración de IA compartida por Copilot y Claude Code
│   ├── CLAUDE.md        ← Importa AGENTS.md
│   ├── settings.json    ← Hooks de auto-validación y permisos
│   └── skills/          ← Skills (procedimientos paso a paso) + índice README.md
.github/workflows/       ← CI y entorno del agente cloud de Copilot
docs/                    ← Documentación, siempre en subcarpetas (ver §8)
e2e/                     ← Tests e2e de Playwright (un spec por flujo de usuario)
scripts/                 ← Tooling: rename-project.mjs y ai/ (sello DoD y hooks)
src/
├── main.ts              ← Arranca el fake backend (si procede) y luego la app
├── app/
│   ├── app.*            ← Shell (layout), configuración (providers) y rutas raíz
│   ├── core/
│   │   ├── api/         ← Una carpeta por API y, dentro, una por familia de endpoints (api.md)
│   │   ├── guards/      ← Guards de rutas (vacío en el template)
│   │   ├── i18n/        ← Configuración de traducciones
│   │   ├── interceptors/← Interceptor HTTP único (punto de enganche, api.md §6)
│   │   └── services/    ← Servicios de infraestructura (vacío en el template)
│   ├── pages/           ← Dominios de negocio (vertical slices); `main/` es el ejemplo
│   └── shared/
│       ├── components/  ← Componentes compartidos (header, footer)
│       ├── constants/   ← Constantes (opciones estáticas de selects, radios…)
│       ├── directives/
│       ├── enums/       ← Enums transversales (AppPath…)
│       ├── models/      ← Tipos átomo/moleculares compartidos (api.md §4)
│       ├── pipes/       ← Transformaciones de presentación
│       ├── services/    ← Servicios transversales con UI
│       ├── utils/       ← Funciones puras (*.utils.ts)
│       └── validations/ ← Validators reutilizables
├── assets/              ← i18n/ (un JSON por idioma) e images/
├── environments/        ← Configuración por entorno: URL de cada API y uso del mock
├── styles/              ← Estilos compartidos (styles.md)
└── fake-backend/        ← Mock MSW, espejo de core/api (solo desarrollo y e2e)
```

Las carpetas vacías llevan un `.gitkeep`: son **huecos de la arquitectura**,
para que se vea dónde va cada cosa antes de que exista. Se rellenan cuando
aparece el primer fichero (y el `.gitkeep` se borra).

### Estructura interna de un dominio (`pages/{domain}/`)

```
pages/{domain}/
├── {domain}.routes.ts   ← Rutas del dominio (lazy)
├── {screen}/            ← Una carpeta por pantalla (list/, detail/, registration/…)
│   ├── {screen}.component.*
│   ├── components/      ← Sub-componentes propios de la pantalla
│   ├── enums/
│   └── services/        ← Estado propio de la pantalla
├── components/          ← Componentes compartidos entre pantallas DEL dominio
├── services/            ← Servicios propios del dominio
└── utils/               ← Utils propios del dominio
```

Un dominio de una sola pantalla (como `main`) puede ser directamente la
pantalla.

### Reglas de carpetas

- **Sin prefijos redundantes**: `pages/{domain}/components/form/`, no
  `{domain}-form/`.
- Cada componente en su propia carpeta, con su vista, estilos y test.
- Los sub-componentes van en `components/` dentro de su padre (anidamiento
  recursivo).
- Cada pantalla puede tener sus propios `enums/`, `services/` y `utils/`
  locales.

---

## 4. Nomenclatura

```
*.component.ts / .html / .scss / .spec.ts
*.service.ts      *.types.ts (NUNCA .model.ts ni .interface.ts)    *.enum.ts
*.pipe.ts         *.directive.ts    *.guard.ts    *.interceptor.ts
*.utils.ts        *.validators.ts   *.routes.ts   *.constants.ts
e2e/{flujo}.spec.ts
```

- Ficheros y carpetas en **kebab-case**. Clases `PascalCase`, variables y
  funciones `camelCase`, constantes `SCREAMING_SNAKE_CASE`, booleans con prefijo
  `is/has/should/can`.
- **Código, comentarios y nombres de fichero en inglés.** Los términos de
  dominio se mantienen en el idioma del negocio (campos del backend, rutas
  visibles como `/listado`).
- Handlers de UI `handle{Acción}`; navegación `navTo{Destino}` / `navBack`.
- Nada de _magic strings_ ni _magic numbers_: enum o constante.

### Estilo de código

- **Early returns**, cero `if/else` anidados; llaves siempre en
  `if`/`for`/`while`.
- **Funciones pequeñas**: complejidad ciclomática y cognitiva ≤ 10, profundidad
  ≤ 3, ≤ 4 parámetros, ≤ 60 líneas por función y ≤ 300 por fichero (si se
  supera, se extrae).
- Sin _non-null assertions_ (`!`): se tipa bien o se comprueba.
- Arrays en plural; funciones verbo + sustantivo (`loadData`, `confirmDelete`).
- **Comentarios** en inglés y solo para explicar el _porqué_ (o separar
  bloques), nunca el _qué_.

### Alias e imports

Alias de TypeScript: `@core/*`, `@shared/*`, `@pages/*` (en `tsconfig.json`).
Orden de imports: framework → terceros → alias → relativos. `import type` para
lo que solo es tipo.

---

## 5. IDs de elementos interactuables

Todo elemento **interactuable** (inputs, botones, selects, tablas, pestañas…)
lleva un `id` con el patrón:

```
{domain}-{component}-{type}-{element}
```

- `domain` = carpeta bajo `pages/`; `component` = carpeta del componente; `type`
  = tipo de control (`input`, `dropdown`, `datepicker`, `radio`, `checkbox`,
  `btn`, `table`, `tabs`, `textarea`…); `element` = nombre del campo o acción,
  en inglés.
- Formas cortas: pantalla única de un dominio → `{domain}-{type}-{element}`
  (`login-input-username`); componente de `shared/` →
  `{component}-{type}-{element}`.
- Sin `id` en elementos de solo lectura, salvo los mensajes de error de un campo
  (`{domain}-error-{campo}`), enlazados con `aria-describedby`.
- Son los **selectores estables de los tests** (unitarios y e2e): no se cambian
  a la ligera.

```html
<input id="{domain}-{component}-input-fieldName" />
<button id="{domain}-form-btn-save" type="button"></button>
```

Las claves de traducción siguen el mismo esquema ([`i18n.md`](i18n.md)).

---

## 6. Accesibilidad (mínimos)

- `type` en todo `<button>`, `alt` en toda imagen y `<label>` asociado a cada
  control.
- Todo lo clicable es usable con teclado y tiene foco visible (estilo de foco:
  decisión de diseño de cada proyecto, ver [`styles.md`](styles.md)).
- Landmarks semánticos en el layout (`<header>`, `<main>`, `<footer>`).
- ESLint valida estáticamente las reglas de accesibilidad de plantillas
  ([`quality.md`](quality.md)).

---

## 7. Dónde va cada cosa — decisión rápida

| Necesito…                                   | Va en                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| Llamar a un endpoint                        | `core/api/{api}/{familia}/` + mock en `fake-backend/` ([`api.md`](api.md)) |
| Una pantalla nueva                          | `pages/{domain}/{screen}/` + ruta + e2e                                    |
| Un componente que usa una sola pantalla     | `components/` de esa pantalla                                              |
| Un componente que usan 2+ dominios          | `shared/components/`                                                       |
| Una transformación pura                     | `*.utils.ts` (local o `shared/utils/`)                                     |
| Un tipo de dominio compartido (átomo)       | `shared/models/`                                                           |
| Un valor de diseño (color, espacio…)        | `src/styles/base/_variables.scss` ([`styles.md`](styles.md))               |
| Un texto visible                            | `src/assets/i18n/es.json` ([`i18n.md`](i18n.md))                           |
| Lógica transversal de HTTP (auth, errores…) | `core/interceptors/` ([`api.md`](api.md) §6)                               |
| Un pendiente                                | `// TODO` + fila en `docs/project/TODOS.md` (skill `track-todos`)          |
| Documentación nueva                         | Subcarpeta de `docs/` (§8)                                                 |

---

## 8. Documentación del proyecto (`docs/`)

`docs/` se organiza **siempre en subcarpetas**; nunca hay ficheros sueltos en su
raíz:

| Carpeta         | Contenido                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `architecture/` | Cómo se construye: arquitectura agnóstica de framework                                                                                                       |
| `stack/`        | Particularidades del framework y librerías del proyecto                                                                                                      |
| `ai/`           | Cómo trabajamos con agentes de IA                                                                                                                            |
| `project/`      | Gestión del proyecto: `TODOS.md` y, cuando existan, historias de usuario, tareas… (cada tipo en su propia subcarpeta: `project/stories/`, `project/tasks/`…) |

En la raíz del repo solo quedan `README.md` y `AGENTS.md` (las herramientas los
buscan ahí). Cuando cambia una convención, se actualiza su documento (una regla
vive en **un solo sitio**) y, si se puede, se automatiza en los gates.
