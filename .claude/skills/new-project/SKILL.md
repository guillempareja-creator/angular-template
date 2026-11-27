---
name: new-project
description: >
  Use when this template repository is turned into a real application for the first time. ALWAYS
  invoke it when the user describes the app to build on top of the template ("quiero una app
  que...", "este proyecto va a ser...", "monta una aplicación de...") or asks in Spanish to arrancar
  el proyecto, iniciar el proyecto, renombrar el proyecto, quitar el ejemplo, personalizar el
  template, empezar de cero or bootstrap. Covers the kickoff interview (name, purpose, framework,
  APIs, domains), renaming the placeholders, replacing the example (example-api, main page, MSW
  mocks, e2e), adapting the template when the framework is not Angular, building the real domains
  with the other skills, tests, documentation and finishing with npm run check green.
user-invocable: true
---

# Skill: Arrancar un proyecto nuevo desde el template

## 1. Cuándo usar esta skill

La primera vez que este repositorio se convierte en una aplicación real. El resultado: un proyecto
sin rastro del ejemplo, con sus dominios reales, sus tests y **`npm run check` en verde**. El humano
revisará funcionalidad, no código: los gates son la garantía de calidad y no se relaja ninguno.

Lee antes [`AGENTS.md`](../../../AGENTS.md) y
[`docs/architecture/overview.md`](../../../docs/architecture/overview.md).

## 2. Paso 0 — Entrevista inicial

Pregunta **en una sola ronda** (con la herramienta de preguntas si existe) solo lo que falte en la
descripción del usuario:

| Tema | Qué saber |
|---|---|
| Identidad | Nombre visible (y slug si lo quiere explícito) y propósito de la app |
| **Framework** | ¿Angular (el del template) u otro (React, Vue…)? |
| APIs | Cuántos backends; nombre de cada API; URLs de test y producción si se conocen |
| Dominios | Pantallas y flujos de usuario, con criterios de aceptación |
| Endpoints | Familias y endpoints que necesita cada pantalla (o "se definirán", y se mockean) |
| Transversal | ¿Login/sesión, notificaciones, loader global, formularios? El template **no los trae**: se diseñan con el usuario, sin inventar contratos de backend |
| Marca | Paleta de color y favicon, si existen |

Sin nombre o sin propósito no se toca nada. El resto se decide con criterio y se explica en el
resumen final.

## 3. Paso 1 — Renombrar los placeholders

```bash
npm run rename -- "Gestión de Expedientes"              # slug derivado
npm run rename -- "Gestión de Expedientes" --slug exp   # slug explícito
npm install                                             # el lockfile recoge el nombre nuevo
```

Sustituye `app-template` (`package.json`, `angular.json`, docs) y `App Template` (`index.html`,
`es.json` → `app.name`, e2e, docs). Después:

- URLs reales de cada API en `src/environments/environment.{tst,prod}.ts`. Si no se conocen, se
  dejan los placeholders y sus filas en `docs/project/TODOS.md`.
- Paleta en `src/styles/base/_variables.scss` y favicon en `src/assets/images/` si hay marca.
- La carpeta del repo se renombra **a mano**: indícalo al usuario, no lo hagas.

## 4. Paso 2 — ¿Otro framework?

Si es **Angular**, salta al paso 3. Si no:

1. **Inventario**. Se conserva todo lo agnóstico: `docs/architecture/`, la convención de capas
   (`core/pages/shared`), las carpetas de API (`core/api/{api}/{familia}`), `environment.apis`, ids,
   claves i18n, `src/styles/` (Sass), `src/assets/i18n/`, el fake backend MSW (handlers y mocks),
   `e2e/` + Playwright, Prettier, Stylelint, dependency-cruiser, knip, TypeScript estricto, husky,
   CI, `scripts/` y la configuración de IA. Se sustituye lo de la tabla §1 de
   [`docs/stack/angular.md`](../../../docs/stack/angular.md): código de `src/app`, `main.ts`,
   `index.html`, `angular.json`, dependencias de Angular, angular-eslint, el runner de tests, el
   build y presupuestos, el mecanismo de entornos, la librería de i18n, el cliente HTTP y el
   interceptor.
2. **Pregunta las equivalencias antes de construir**: presenta una tabla Angular → propuesta
   (router, estado, cliente HTTP + interceptor, i18n, librería de test de componentes,
   encapsulación de estilos, plugin de lint del framework + a11y, build) y espera confirmación.
3. **Reconstruye el stack con los mismos gates**, nunca más débiles: mismos umbrales de cobertura
   por fichero, mismas métricas de lint, mismos presupuestos, MSW solo en desarrollo. Mantén **los
   mismos nombres de scripts npm** (`start`, `test`, `test:file`, `test:ci`, `e2e`, `e2e:ui`,
   `lint*`, `typecheck`, `format`, `check:static` y `check` con el sello
   `node scripts/ai/dod.mjs stamp …`) para que la documentación, los hooks y la CI sigan valiendo.
   Esto edita la configuración de los gates, y cada edición pide confirmación humana (en autopilot
   se deniega): hazlo en modo interactivo y explica al usuario cada cambio de configuración.
4. Reescribe primero el **ejemplo** (GET de `example-api` + página `main` + su e2e) en el nuevo
   framework y deja `npm run check` en verde antes de crear dominios.
5. Sustituye `docs/stack/angular.md` por `docs/stack/{framework}.md` (misma estructura de
   secciones) y actualiza las referencias en `AGENTS.md`, `README.md`, `docs/` y los ejemplos de
   código de las skills (`new-page`, `unit-testing`, `api-endpoint`, `i18n`).

## 5. Paso 3 — Sustituir el ejemplo por lo real

| Pieza | Acción |
|---|---|
| `src/environments/environment.types.ts` y los 3 `environment*.ts` | Sustituir `exampleApi` por las APIs reales |
| `src/app/core/api/example-api/` | Borrar; crear las APIs reales con la skill `api-endpoint` |
| `src/fake-backend/handlers/example-api/` y `browser.ts` | Borrar y registrar los mocks reales |
| `src/app/pages/main/` | Convertir en la primera pantalla real o borrar (ojo a `AppPath.MAIN` y la ruta `**`) |
| `src/assets/i18n/es.json` | Borrar `main.*` |
| `e2e/example.spec.ts` | Sustituir por los flujos reales |
| `src/app/app.routes.spec.ts` | Actualizar los mocks y rutas |
| `docs/project/TODOS.md` | Actualizar las filas de URLs pendientes |

Se conservan: el interceptor (`core/interceptors/`), i18n, `shared/` (header/footer adaptados),
`src/styles/` y la estructura del fake backend. `npm run lint:arch` (huérfanos) y
`npm run lint:unused` (knip) detectan cualquier resto.

## 6. Paso 4 — Construir los dominios

Por cada dominio, en este orden:

1. **Endpoints** → skill `api-endpoint` (servicio + tipos + test + mock MSW registrado).
2. **Pantallas y componentes** → skill `new-page` (vertical slice en `pages/{domain}/`, ruta lazy).
3. **Textos** → skill `i18n`.
4. **Tests** → skills `unit-testing` y `e2e-testing` (un e2e por flujo de usuario).
5. **Pendientes** → skill `track-todos` (lo que dependa del backend o del negocio).

Lo transversal que haya pedido el usuario (sesión, notificaciones, loader…) se diseña con él, se
implementa en `core/` (y en el interceptor si es HTTP) y se documenta en
`docs/architecture/api.md`; si es repetible, se crea su skill con `create-skill`.

## 7. Paso 5 — Documentación y limpieza del template

- `README.md`: título y descripción de la app; quitar "Arrancar un proyecto nuevo" y
  "Placeholders"; mantener desarrollo, comandos y quality gates.
- `AGENTS.md`: quitar la sección "Este repositorio es un template" y actualizar el mapa.
- Borrar lo que solo sirve al template: esta skill (`.claude/skills/new-project/`) y sus filas en
  `.claude/skills/README.md` y `AGENTS.md`; `scripts/rename-project.mjs`, el script `rename` de
  `package.json` y su fila en el README. Editar `package.json` pide confirmación humana: explica
  que es la limpieza del template.
- `docs/project/TODOS.md`: solo pendientes reales.

## 8. Paso 6 — Definition of Done

Skill `verify`: **`npm run check` en verde** de principio a fin, sin relajar ningún gate.

Resumen final al usuario: nombre y slug, framework, APIs, dominios y endpoints creados, decisiones
tomadas por defecto, pendientes registrados y pasos manuales (renombrar la carpeta, URLs reales).

## Checklist

- [ ] Entrevista hecha (incluido el framework); decisiones explicadas
- [ ] `npm run rename` + `npm install`; entornos, paleta y favicon revisados
- [ ] Si no es Angular: equivalencias confirmadas, stack reconstruido con los mismos gates y scripts
- [ ] Ejemplo sustituido (APIs, mocks, `main`, i18n, e2e) sin restos
- [ ] Dominios con endpoints, pantallas, textos, tests unitarios y e2e
- [ ] README, AGENTS.md, docs y TODOS al día; artefactos del template borrados
- [ ] **`npm run check` en verde**, sin ningún gate relajado
