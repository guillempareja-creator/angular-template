# App Template 🧩

> **Cascarón Angular 22 (zoneless) listo para convertirse en cualquier aplicación.**
> No es una app funcional: es la arquitectura, la infraestructura, las convenciones y los quality
> gates ya montados, más un dominio de ejemplo desechable que enseña cómo se programa aquí.

---

## 🚀 Arrancar un proyecto nuevo (la vía rápida)

Este repositorio está preparado para que **una IA lo transforme en el proyecto real a partir de un
solo prompt** y lo implemente como una caja negra: el humano revisa la funcionalidad; la calidad
del código la garantizan los gates automáticos. Clona, instala y pide el arranque:

```bash
git clone <repo-url> mi-proyecto
cd mi-proyecto
npm install
npm run e2e:install   # una vez por máquina: navegador de Playwright
```

En Claude Code:

```
/new-project Una app para gestionar expedientes: listado con filtros, alta y edición, y login corporativo
```

En Copilot: `@new-project` + la misma descripción.

La skill [`new-project`](.github/skills/new-project/SKILL.md) se encarga de todo el ciclo:
renombrar los placeholders, purgar el dominio de ejemplo, decidir si se conserva el flujo de
autenticación, montar los dominios reales con sus mocks, escribir sus tests unitarios y e2e, dejar
la documentación al día y terminar con **`npm run check` en verde**.

### …o a mano

```bash
npm run rename -- "Gestión de Expedientes"            # slug derivado del nombre
npm run rename -- "Gestión de Expedientes" --slug exp # slug explícito
npm run rename -- "Gestión de Expedientes" --dry      # ver qué cambiaría
```

Después: renombrar la carpeta del repo, ajustar `src/environments/`, y seguir la checklist de la
skill `new-project`.

---

## 🏷️ Placeholders del template

Todo lo que hay que sustituir para que el proyecto deje de ser un cascarón:

| Placeholder | Dónde vive | Sustituir por |
|---|---|---|
| `app-template` | `package.json`, `angular.json` (nombre del proyecto y `buildTarget`), docs | Slug técnico en kebab-case |
| `App Template` | `src/index.html` (`<title>`), `src/assets/i18n/es.json` (`app.name`), docs | Nombre visible de la aplicación |
| Carpeta del repo | Sistema de ficheros | El slug técnico (**a mano**, con el editor cerrado) |
| `https://api.example.com` | `src/environments/environment.prod.ts` | URL real de la API de producción |
| `https://api-tst.example.com` | `src/environments/environment.tst.ts` | URL real de la API de test |
| Dominio `example` | `src/app/core/api/example/`, `src/fake-backend/handlers/example/` | Borrar y crear los dominios reales |
| Página `main` | `src/app/pages/main/` | Primera pantalla real (ojo a la ruta `**` y a `AppPath`) |
| E2E de ejemplo | `e2e/auth.spec.ts` | Specs de los flujos reales |
| Paleta de color | `src/styles/base/_variables.scss` | Colores de marca del proyecto |
| Favicon | `src/assets/images/favicon.ico` | Icono del proyecto |

Los dos primeros los cubre `npm run rename`. El resto es decisión de proyecto.

---

## 📚 Documentación

| Documento | Para qué |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | **Fuente de verdad**: arquitectura, forma de programar, quality gates y Definition of Done |
| [`CLAUDE.md`](CLAUDE.md) / [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Resumen operativo para los agentes de IA |
| [`.github/skills/SKILLS.md`](.github/skills/SKILLS.md) | Skills locales invocables |
| [`src/styles/README.md`](src/styles/README.md) | Sistema de estilos SCSS |
| [`TODOS.md`](TODOS.md) | Pendientes reales del proyecto |

---

## 🧱 Qué trae montado

- **Angular 22** standalone + **signals**, **zoneless** (sin `zone.js`), `OnPush`, control flow `@if`/`@for`.
- **Arquitectura por capas**: `core/` (api, guards, i18n, interceptors, services) · `pages/`
  (vertical slices de dominio) · `shared/` (reutilizables entre 2+ dominios).
- **Capa API tipada** en `core/api/{familia}/` con `firstValueFrom`, URLs relativas y opciones por
  llamada como `HttpContext` (`requestContext({ successMessage, showLoader })`).
- **Interceptores funcionales**: loader global, notificaciones (éxito / aviso del backend / error),
  token + refresh automático single-flight, y base URL de la API.
- **Notificaciones propias** (`NotificationService` + `NotificationsComponent`), sin librerías de toasts.
- **Fake backend con MSW** (`src/fake-backend/`): la app y los e2e arrancan sin backend real.
- **Auth de ejemplo**: login, guards funcionales, refresh token — eliminable de una pieza.
- **i18n** con `@ngx-translate` (`src/assets/i18n/es.json`), cero texto hardcodeado.
- **SCSS propio** (sin librería corporativa): variables, mixins, grid, layouts en `src/styles/`.
- **Utils y validaciones** reutilizables: fechas, formularios, objetos, delay, i18n, validadores.
- **Tests**: unitarios con **Vitest** (cobertura mínima por fichero) y e2e con **Playwright**.
- **Quality gates** estrictos: Prettier, ESLint (TS estricto, Angular, a11y, complejidad), Stylelint,
  dependency-cruiser, knip, `tsc`, presupuestos de bundle; con hooks de git y CI.

Dependencias de runtime: Angular, `rxjs`, `@ngx-translate/*`, `date-fns` y `ngx-pipes`. Nada más.

### Estructura

```
src/app/
├── core/              # Infraestructura y estado global (singleton)
│   ├── api/           # Un folder por familia de endpoint: service + types (+ spec)
│   ├── guards/        # authGuard / guestGuard
│   ├── i18n/          # provideI18n()
│   ├── interceptors/  # loader, notification, auth, apiUrl + HttpContext tokens
│   └── services/      # auth, loader, notification, respuesta HTTP
├── pages/             # Dominios de negocio — vertical slices
└── shared/            # Reutilizables entre 2+ dominios
    ├── components/  constants/  directives/  enums/  models/
    └── pipes/  services/  utils/  validations/

src/fake-backend/      # MSW: handlers y mocks espejo de cada endpoint
src/environments/      # environment.ts (dev) · .tst.ts · .prod.ts
src/styles/            # base/ (variables, globals) · ui/ (grid, layouts) · utils/ (mixins)
e2e/                   # Tests e2e de Playwright
```

**¿Core o Shared?** Core = infraestructura y estado global singleton (HTTP, auth, notificaciones).
Shared = piezas reutilizables entre dominios (componentes, pipes, utils, validators). Un fichero
nace en el nivel más bajo posible y solo sube cuando aparece un **segundo consumidor real**.
Detalle en `ARCHITECTURE.md` §3.

---

## 🛠️ Desarrollo

Requisitos: **Node.js 24** (`.nvmrc`; `engines` admite `^22.22.3 || ^24.15.0 || >=26`) y npm.
El Angular CLI va como dependencia del proyecto (`npx ng …`).

| Comando | Qué hace |
|---|---|
| `npm start` | Dev server con el fake backend MSW → http://localhost:4200 |
| `npm run start:tst` | Dev server contra la API de test (sin MSW) |
| `npm run build` | Build de producción (con presupuestos de bundle) |
| `npm run watch` | Build de desarrollo en modo watch |
| `npm test` | Tests unitarios (Vitest) en modo watch |
| `npm run test:ci` | Una pasada de tests + cobertura; falla si algún fichero baja del umbral |
| `npm run e2e:install` | Instala Chromium para Playwright (una vez por máquina) |
| `npm run e2e` | Tests e2e (Playwright) contra `ng serve` + MSW |
| `npm run lint` | ESLint (TS, templates, a11y, complejidad, arquitectura), `--max-warnings=0` |
| `npm run lint:styles` | Stylelint en `src/**/*.scss` |
| `npm run lint:arch` | dependency-cruiser: capas, ciclos, huérfanos |
| `npm run lint:unused` | knip: ficheros, exports y dependencias sin usar |
| `npm run typecheck` | `tsc` sobre app, specs y e2e |
| `npm run format` | Prettier + `stylelint --fix` |
| `npm run format:check` | Prettier en modo comprobación |
| `npm run check:static` | `format:check` + `lint` + `lint:styles` + `lint:arch` + `lint:unused` + `typecheck` |
| `npm run check` | **Todo lo de CI**: `check:static` + `test:ci` + `build` + `e2e` |
| `npm run audit:prod` | `npm audit` de las dependencias de producción (nivel alto) |
| `npm run rename -- "Nombre"` | Sustituye los placeholders del template |

El mock backend se activa con `useMSW: true` en `src/environments/environment.ts`: ponlo a `false`
para atacar una API real en desarrollo. MSW **solo existe en desarrollo**: los builds `tst` y
producción no incluyen ni el worker ni su código. En el login de demo vale cualquier credencial
(los e2e usan `demo` / `demo`).

---

## ✅ Quality gates y Definition of Done

Una tarea **no está terminada hasta que `npm run check` pasa en verde de principio a fin**. Resumen
(detalle en [`ARCHITECTURE.md`](ARCHITECTURE.md) §18–§19):

- **Formato y lint**: Prettier; ESLint con typescript-eslint `strictTypeChecked`, angular-eslint
  (incl. accesibilidad de templates) y sonarjs; complejidad ciclomática y cognitiva ≤ 10,
  funciones ≤ 60 líneas, ficheros ≤ 300 líneas; cero warnings.
- **Estilos**: Stylelint (anidamiento ≤ 3, sin `!important`, sin ids, sin colores por nombre).
- **Arquitectura**: dependency-cruiser (sin ciclos ni huérfanos, dominios aislados, `core`/`shared`
  no importan `pages`, la app no importa el fake backend) y knip (sin código muerto).
- **Tipos**: TypeScript estricto + `strictTemplates` de Angular.
- **Tests**: Vitest con cobertura **por fichero** (statements 90 · branches 85 · functions 90 ·
  lines 90) y e2e con Playwright para cada flujo de usuario.
- **Build**: presupuestos de bundle (inicial 500 kB, script 350 kB, estilos de componente 6 kB como máximo).
- **Git**: `pre-commit` (lint-staged), `commit-msg` (conventional commits), `pre-push`
  (`check:static` + `test:ci`). **CI** repite todo (más `audit:prod`) en cada push a `main` y PR.

Nunca se relaja un gate para que pase (desactivar reglas, `eslint-disable`, bajar umbrales, subir
presupuestos, saltar tests): se arregla el código.

---

## 📋 Convenciones (resumen)

- Ficheros kebab-case: `*.component.ts`, `*.service.ts`, `*.types.ts`, `*.enum.ts`, `*.utils.ts`.
- Clases `PascalCase`, variables y métodos `camelCase`, constantes `SCREAMING_SNAKE_CASE`.
- `type` siempre (nunca `interface` para datos), sin `any`, `import type` para tipos.
- Código, comentarios y nombres de fichero en **inglés**; textos de usuario en **español** vía i18n.
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`…).

La versión completa y normativa está en [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 🤝 Mantener el template

Las mejoras genéricas (utils, componentes base, reglas de arquitectura) vuelven a este repositorio;
la lógica de dominio de cada proyecto **nunca**. Si añades una convención nueva, documéntala en
`ARCHITECTURE.md`, automatízala en los gates si es posible y, si merece una guía paso a paso, crea
una skill con `@create-skill`.
