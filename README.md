# App Template 🧩

> **Plantilla para arrancar aplicaciones frontend construidas con IA.** No es una app funcional: es
> la arquitectura, las convenciones, los quality gates y la configuración de IA (GitHub Copilot y
> Claude Code) ya montados, más un ejemplo mínimo que enseña cómo se programa aquí.
>
> Hoy el stack es **Angular 22 (zoneless)**, pero la arquitectura es agnóstica de framework: la skill
> `new-project` adapta el template si el proyecto usa otro.

---

## 🚀 Arrancar un proyecto nuevo

```bash
git clone <repo-url> mi-proyecto
cd mi-proyecto
npm install
npm run e2e:install   # una vez por máquina: navegador de Playwright
```

Abre la carpeta en VS Code y, en el chat de **GitHub Copilot** o de **Claude Code** (mismo comando
en los dos):

```
/new-project Una app para gestionar expedientes: listado con filtros, alta y edición
```

La skill [`new-project`](.claude/skills/new-project/SKILL.md) pregunta lo que falte (nombre,
framework, APIs…), renombra los placeholders, sustituye el ejemplo por los dominios reales con sus
tests unitarios y e2e, deja la documentación al día y termina con **`npm run check` en verde**.

### …o a mano

```bash
npm run rename -- "Gestión de Expedientes"            # slug derivado del nombre
npm run rename -- "Gestión de Expedientes" --slug exp # slug explícito
npm run rename -- "Gestión de Expedientes" --dry      # ver qué cambiaría
```

Después, sigue la checklist de la skill `new-project`.

---

## 🏷️ Placeholders del template

| Placeholder                   | Dónde vive                                                                    | Sustituir por                      |
| ----------------------------- | ----------------------------------------------------------------------------- | ---------------------------------- |
| `app-template`                | `package.json`, `angular.json`, docs                                          | Slug técnico en kebab-case         |
| `App Template`                | `src/index.html`, `src/assets/i18n/es.json` (`app.name`), `e2e/`, docs        | Nombre visible de la aplicación    |
| Carpeta del repo              | Sistema de ficheros                                                           | El slug (**a mano**, editor cerrado) |
| API `example-api`             | `src/environments/` (`apis.exampleApi`), `src/app/core/api/example-api/`, `src/fake-backend/handlers/example-api/` | Las APIs reales y sus URLs |
| Página `main`                 | `src/app/pages/main/`, `e2e/example.spec.ts`                                  | Primera pantalla real              |
| Paleta de color               | `src/styles/base/_variables.scss`                                             | Colores de marca                   |
| Favicon                       | `src/assets/images/favicon.ico`                                               | Icono del proyecto                 |

Los dos primeros los cubre `npm run rename`; el resto es decisión de proyecto.

---

## 📚 Documentación

| Documento                                                        | Para qué                                                         |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`AGENTS.md`](AGENTS.md)                                         | Instrucciones para los agentes de IA (fuente única)             |
| [`docs/architecture/`](docs/architecture/overview.md)            | Arquitectura agnóstica: capas, API, estilos, i18n, testing, calidad y DoD |
| [`docs/stack/angular.md`](docs/stack/angular.md)                 | Particularidades de Angular                                     |
| [`docs/ai/workflow.md`](docs/ai/workflow.md)                     | Cómo trabajamos con IA y cómo se auto-valida                    |
| [`.claude/skills/README.md`](.claude/skills/README.md)           | Skills disponibles (procedimientos paso a paso)                 |
| [`docs/project/TODOS.md`](docs/project/TODOS.md)                 | Pendientes reales del proyecto                                  |

---

## 🧱 Qué trae montado

- **Angular 22** standalone + **signals**, **zoneless**, `OnPush` y control flow moderno.
- **Arquitectura por capas**: `core/` (infraestructura) · `pages/` (dominios, _vertical slices_) ·
  `shared/` (reutilizables entre 2+ dominios), con las carpetas vacías marcadas para que se vea dónde
  va cada cosa.
- **Capa de API para una o varias APIs**: `core/api/{api}/{familia}/`, URL de cada API por entorno y
  un endpoint de ejemplo (`GET /example`) pintado en la página `main`.
- **Interceptor HTTP único**, vacío, como punto de enganche para la lógica transversal de cada
  proyecto.
- **Fake backend con MSW**, espejo de la capa de API: la app y los e2e arrancan sin backend real.
- **i18n** con `@ngx-translate` (cero texto hardcodeado).
- **Estilos propios**: capa compartida (`src/styles/`: tokens, reset neutro, rejilla, mixins) +
  estilos encapsulados por componente.
- **Tests**: Vitest con cobertura mínima por fichero y Playwright para los flujos de usuario.
- **Quality gates** estrictos y sin vías de escape, hooks de git y CI en GitHub Actions.
- **IA preparada**: `AGENTS.md`, skills y hooks de auto-validación compartidos por Copilot y Claude
  Code.

**Lo que no trae, a propósito**: autenticación, notificaciones, loader global, formularios ni
librerías de UI. Cada proyecto los decide; dónde encajan está documentado en
[`docs/architecture/api.md`](docs/architecture/api.md) y
[`docs/stack/angular.md`](docs/stack/angular.md).

Dependencias de runtime: Angular, `rxjs`, `tslib` y `@ngx-translate/*`. Nada más.

---

## 🛠️ Desarrollo

Requisitos: **Node.js 24** (≥ 24.15; ver `.nvmrc` y `engines`) y npm. El Angular CLI va como
dependencia del proyecto (`npx ng …`).

| Comando                      | Qué hace                                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| `npm start`                  | Dev server con el fake backend MSW → http://localhost:4200               |
| `npm run start:tst`          | Dev server contra la API de test (sin MSW)                               |
| `npm run build`              | Build de producción (con presupuestos de bundle)                         |
| `npm test`                   | Tests unitarios en modo watch                                            |
| `npm run test:file -- <ruta>`| Tests de un fichero o carpeta, sin cobertura (bucle rápido)              |
| `npm run test:ci`            | Todos los tests + cobertura por fichero                                  |
| `npm run e2e:install`        | Instala Chromium para Playwright (una vez por máquina)                   |
| `npm run e2e`                | Tests e2e (Playwright) contra `ng serve` + MSW                           |
| `npm run e2e:ui`             | Tests e2e en modo UI (depuración paso a paso)                            |
| `npm run e2e:report`         | Abre el último informe HTML de Playwright                                |
| `npm run lint`               | ESLint (TS, plantillas, a11y, complejidad, arquitectura)                 |
| `npm run lint:styles`        | Stylelint                                                                |
| `npm run lint:arch`          | dependency-cruiser: capas, ciclos, huérfanos                             |
| `npm run lint:unused`        | knip: ficheros, exports y dependencias sin usar                          |
| `npm run typecheck`          | `tsc` sobre app, specs y e2e                                             |
| `npm run format`             | Prettier + arreglos automáticos de Stylelint                             |
| `npm run check:static`       | Formato + lints + arquitectura + código muerto + tipos                   |
| `npm run check`              | **Todo lo de la CI**: `check:static` + `test:ci` + `build` + `e2e` ← DoD |
| `npm run audit:prod`         | `npm audit` de las dependencias de producción                            |
| `npm run rename -- "Nombre"` | Sustituye los placeholders del template                                  |

El fake backend se activa con `useMSW: true` en `src/environments/environment.ts` (ponlo a `false`
para atacar una API real en desarrollo). MSW solo existe en desarrollo: los builds `tst` y
producción no lo incluyen.

---

## ✅ Quality gates y Definition of Done

Una tarea **no está terminada hasta que `npm run check` pasa en verde de principio a fin**, y nunca
se relaja un gate para conseguirlo: se arregla el código. Detalle en
[`docs/architecture/quality.md`](docs/architecture/quality.md).

---

## 🤝 Mantener el template

Las mejoras genéricas (utils, reglas, skills, documentación) vuelven a este repositorio; la lógica de
dominio de cada proyecto, **nunca**. Una convención nueva se documenta en `docs/`, se automatiza en
los gates si es posible y, si merece una guía paso a paso, se convierte en skill (`/create-skill`).
