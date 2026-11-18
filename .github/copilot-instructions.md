# Copilot Instructions — App Template

## Fuente de verdad

La guía completa de arquitectura, forma de programar y quality gates está en
[`ARCHITECTURE.md`](../ARCHITECTURE.md) (raíz del repo). Ante cualquier duda de estructura, patrón o
convención, consultarla. Este fichero es solo el resumen operativo.

Para tareas concretas existen **skills locales** en [`.github/skills/`](./skills/SKILLS.md):
`@new-project`, `@api-endpoint`, `@success-notifications`, `@i18n`, `@testing`, `@track-todos`,
`@create-skill`. Cargar la skill correspondiente antes de generar código de ese tipo.

---

## ✅ Definition of Done — leer antes de empezar

**Una tarea NO está terminada hasta que `npm run check` termina en verde de principio a fin**
(exit code 0). El humano solo revisa funcionalidad: la calidad la garantizan los gates. Por tanto:

1. Escribir el código siguiendo `ARCHITECTURE.md`.
2. Specs unitarios (Vitest) de todo fichero con lógica, cumpliendo la cobertura **por fichero**.
3. Spec e2e (Playwright, `e2e/`) de todo flujo de usuario nuevo o modificado.
4. Ejecutar `npm run check`. Si falla, leer el error, **arreglar el código** y repetir hasta verde.
   (La primera vez en una máquina: `npm run e2e:install`.)

`npm run check` = `check:static` (Prettier, ESLint, Stylelint, dependency-cruiser, knip, `tsc`) →
`test:ci` (Vitest + cobertura) → `build` (presupuestos de bundle) → `e2e` (Playwright).

**Nunca relajar un gate para que pase**: prohibido desactivar o rebajar reglas, añadir
`eslint-disable` / `@ts-ignore` / `@ts-expect-error`, bajar umbrales de cobertura, subir
presupuestos, excluir ficheros, usar `.skip`/`.only` o borrar tests que fallan. Si una regla bloquea
de verdad un patrón legítimo, **parar y explicárselo al humano** (qué regla, dónde, por qué).

---

## Este repo es un template

Mientras el proyecto siga llamándose `App Template` / `app-template`, es un **cascarón sin dominio
propio**. Si el usuario describe la aplicación que quiere construir, cargar `@new-project` antes de
tocar nada: renombra los placeholders, purga el dominio `example` y monta los dominios reales.
Placeholders y pasos manuales: [`README.md`](../README.md) § Placeholders.

---

## Proyecto

SPA **Angular 22 zoneless** (standalone + signals, sin `zone.js`) con npm, Node 24 y Angular CLI.
Sin librerías corporativas: estilos propios en `src/styles/`, mock backend con MSW en
`src/fake-backend/`, i18n con @ngx-translate, toasts con el `NotificationService` propio.
Tests unitarios con **Vitest** (`ng test`) y e2e con **Playwright**. Dependencias de runtime
permitidas: Angular, `rxjs`, `@ngx-translate/*`, `date-fns`, `ngx-pipes` — nada más sin justificación.

```
core/      Infraestructura: api/ (servicios HTTP), guards/, i18n/, interceptors/, services/
pages/     Dominios de negocio (login/, main/ — de ejemplo) — vertical slices
shared/    Reutilizables entre 2+ dominios: components/, enums/, models/, pipes/, services/, utils/, validations/
```

- Los ficheros viven en el nivel más bajo posible; suben a `shared/` solo con un 2º consumidor real.
- Sin prefijos redundantes en carpetas (`form/`, no `login-form/`).
- Alias: `@core/`, `@shared/`, `@pages/`.
- Capas (las comprueba `lint:arch`): `core`/`shared` no importan `pages`; un dominio no importa
  otro; `src/app` no importa `fake-backend`; sin ciclos ni ficheros huérfanos.

## Capa API (`core/api/`)

- Un folder por familia de endpoint (primer segmento de URL): `core/api/example/` con
  `example.service.ts` + `example.types.ts` + `example.service.spec.ts`. Segmentos más profundos =
  métodos, nunca subcarpetas.
- Siempre `firstValueFrom(this.http.METHOD<Response>(...))` — la capa API devuelve `Promise`.
- **URLs relativas** (`'/example'`): los interceptores añaden `environment.api` y el token.
- Tipos calcan el método: `updateExample` → `UpdateExampleRequest` / `UpdateExampleResponse`.
- Átomos semánticos en `shared/models/` (ej. `Token`) — no `string`/`number` a pelo si existe alias.
- Opciones por llamada como **`HttpContext`**: `context: requestContext({ successMessage, showLoader })`
  (`core/interceptors/http-context.tokens.ts`). Toast de éxito = tag de `httpRequest.success.*`
  (`DEFAULT_SUCCESS_MESSAGE` para el genérico). Errores y avisos del backend se notifican solos.
  Skill `@success-notifications`.
- Todo endpoint tiene su spec con `HttpTestingController` y su mock MSW espejo en
  `fake-backend/handlers/{familia}/`, registrado en `browser.ts` (skill `@api-endpoint`).

## Componentes

Orden de secciones **estricto** con comentarios separadores:
`// Injections` → `// ViewChilds` → `// Models` → `// Inputs` → `// Outputs` → `// Data` →
`// Computeds` → `// Effects` → `// Methods` (lifecycle primero, luego privados, luego públicos).

- `inject()` siempre — nunca constructor. Visibilidad explícita: `private` por defecto,
  `public` solo si el template lo usa. Los `effect` siempre `private`.
- **Zoneless**: todo estado que pinte la vista es un signal (`signal`/`computed`/`effect`); nunca
  mutar contenido de un signal — siempre `set`/`update`. APIs nuevas: `input()`, `output()`,
  `viewChild()`, `model()`.
- `ChangeDetectionStrategy.OnPush` siempre; `styleUrl` singular; sin `standalone: true`;
  componentes de página con `export default`.
- Control flow moderno: `@if` / `@for` / `@switch`.
- async/await sobre RxJS: nada de `subscribe()` fuera de interceptores. Llamadas independientes
  en paralelo con `Promise.all`. Lifecycle hooks no `async`: `void this.loadData()`.
- Early returns, llaves siempre, sin `await` en la última llamada de una función `void`.
- Funciones pequeñas: complejidad ≤ 10, profundidad ≤ 3, ≤ 4 parámetros, ≤ 60 líneas; ficheros ≤ 300.
- Handlers `handle{Acción}`; navegación `navTo{Destino}` / `navBack`; booleans `is/has/should/can`.
- Toasts programáticos (no HTTP) con `NotificationService.success/warning/error(textoTraducido)`.

## TypeScript

- `type` siempre — nunca `interface` para datos. `import type` para imports solo de tipos.
- Sin `any` (usar `unknown` + type guard), sin `!`. Nada de magic strings/numbers → enum o constante.
- Código, comentarios y nombres de fichero en **inglés**; términos de dominio en español.
- Ficheros kebab-case: `*.component.ts`, `*.service.ts`, `*.types.ts` (nunca `.model.ts`),
  `*.enum.ts`, `*.pipe.ts`, `*.utils.ts`, `*.validators.ts`.

## Estilos (SCSS)

Guía completa del sistema de estilos: [`src/styles/README.md`](../src/styles/README.md).

- Todo SCSS de componente empieza con `@use 'imports' as *;` y scopa con `:host`
  (encapsulación por defecto — no se usa `ViewEncapsulation.None`).
- Variables y mixins de `src/styles/` siempre: `$spacing-md`, `$color-primary-500`, `rem(24)`,
  `@include breakpoint('tablet')`… Nunca valores hardcodeados ni estilos inline.
- Clases globales (`grid-template` + `col-*`, `field-group`, `buttons-group`) se usan,
  jamás se redefinen. Sin `!important`, sin selectores de id, anidamiento ≤ 3.

## i18n — obligatorio

Cero texto visible hardcodeado: `| translate` en template; en TS
`translateText(this.translate, 'clave', params?)` de `@shared/utils/i18n.utils` (tipado; no usar
`TranslateService.instant()` directamente, devuelve `any`). Claves `{domain}.{component}.{grupo}.{clave}`
en camelCase, en `src/assets/i18n/es.json`. Acciones comunes desde `common.*`. Detalles: skill `@i18n`.

## TODOs

Todo `// TODO` se registra en `TODOS.md` (raíz). Detalles: skill `@track-todos`.

## Tests

- **Unitarios — Vitest** (`ng test`, jsdom; `describe/it/expect/vi` globales). Todo fichero con
  lógica nace con su spec. Cobertura **por fichero**: statements 90 · branches 85 · functions 90 ·
  lines 90. Mocks con `vi.fn()` / `vi.spyOn()`, `await fixture.whenStable()` (zoneless),
  `provideTranslateService()` (devuelve las claves), `HttpTestingController` para HTTP.
- **E2E — Playwright** (`e2e/`): todo flujo de usuario nuevo o modificado tiene su spec, contra
  `ng serve` + MSW, seleccionando por los `id` de los elementos.
- Detalles: skill `@testing`.

## Comandos

```bash
npm start                       # dev server con MSW (http://localhost:4200)
npm run start:tst               # dev server contra la API de test
npm run rename -- "Nombre App"  # sustituir los placeholders del template
npm test                        # Vitest en modo watch
npm run test:ci                 # una pasada + cobertura por fichero
npm run e2e:install             # una vez por máquina: Chromium para Playwright
npm run e2e                     # Playwright
npm run lint                    # ESLint (--max-warnings=0)
npm run lint:styles             # Stylelint
npm run lint:arch               # dependency-cruiser
npm run lint:unused             # knip
npm run typecheck               # tsc (app, specs, e2e)
npm run format                  # prettier + stylelint --fix
npm run check:static            # formato + lints + typecheck
npm run check                   # TODO lo de CI: check:static + test:ci + build + e2e  ← DoD
```

## Git

Conventional commits (`feat:`, `fix:`, `refactor:`…), validados por el hook `commit-msg`.
Hook `pre-commit` (husky + lint-staged) formatea/valida los ficheros staged. Hook `pre-push` ejecuta
`npm run check:static` + `npm run test:ci`. CI (`.github/workflows/ci.yml`) repite todos los gates
(más `npm run audit:prod`) en cada push a `main` y en cada PR.

---

## Checklist rápido

- [ ] Fichero en la carpeta correcta y al nivel más bajo posible; sin imports entre dominios
- [ ] Orden de secciones del componente + visibilidad explícita
- [ ] `inject()`, signals, `input()`/`output()`/`viewChild()`; nada de APIs legacy
- [ ] `type` (no `interface`); átomos de `shared/models/`; `{Method}Request/Response`
- [ ] API: `firstValueFrom` + URL relativa + `requestContext`; spec con `HttpTestingController`; mock MSW registrado
- [ ] SCSS con `@use 'imports' as *` + `:host`; variables/mixins; sin redefinir clases globales
- [ ] Todo texto visible con `| translate` / `translateText()`
- [ ] Accesibilidad: `type` en `<button>`, `alt` en imágenes, `<label>` asociado, interactivos con teclado
- [ ] `id="{domain}-{component}-{type}-{element}"` en elementos interactuables
- [ ] Early returns; llaves siempre; sin `subscribe()`; sin mutar signals
- [ ] Specs unitarios con cobertura por fichero + spec e2e del flujo
- [ ] TODOs registrados en `TODOS.md`; commit con conventional commits
- [ ] **`npm run check` en verde**, sin ningún gate relajado
