---
name: new-project
description: >
  Use when this template repository is being turned into a real application for the first time.
  ALWAYS invoke this skill when the user describes the app they want to build on top of the template
  ("quiero una app que...", "este proyecto va a ser...", "monta una aplicación de..."), or when the
  user asks in Spanish to arrancar el proyecto, iniciar el proyecto, renombrar el proyecto, quitar el
  ejemplo, personalizar el template, empezar de cero, or bootstrap. Covers renaming the placeholders,
  purging the example/demo code (API family, MSW handlers, main page, i18n keys, e2e spec), deciding
  whether to keep the auth flow, scaffolding the real domains with the rest of the local skills,
  writing unit (Vitest) and e2e (Playwright) tests, and finishing with npm run check fully green.
user-invocable: true
---

# Skill: Arrancar un proyecto nuevo desde el template

## 1. Cuándo usar esta skill

La primera vez que este repositorio (todavía `App Template` / `app-template`) se convierte en una
aplicación real. El resultado es un proyecto sin rastro del ejemplo, con sus dominios reales, sus
tests y **`npm run check` en verde**. El humano revisará funcionalidad, no código: los quality gates
son la garantía de calidad, así que no se relaja ninguno (ver `ARCHITECTURE.md` §18–§19).

## 2. Paso 0 — Entender el proyecto

De la descripción del usuario extraer:

- **Nombre visible** (ej. "Gestión de Expedientes") y, si lo da, slug técnico.
- **Dominios / pantallas** y sus flujos de usuario (listado, alta, detalle…).
- **Endpoints** que necesita cada pantalla (familia = primer segmento de URL).
- **¿Hay login?** Si no lo dice, conservar el flujo de auth de ejemplo y anotarlo en el resumen.
- URLs de API de test/producción si las conoce.

Si falta el nombre o el propósito de la app, preguntarlo antes de tocar nada. El resto se decide
con criterio y se explica al final.

## 3. Paso 1 — Renombrar placeholders

```bash
npm run rename -- "Gestión de Expedientes"              # slug derivado
npm run rename -- "Gestión de Expedientes" --slug exp   # slug explícito
```

Sustituye `app-template` (package.json, angular.json, docs) y `App Template` (`index.html`,
`es.json` → `app.name`, docs). Después:

- `npm install` para que `package-lock.json` recoja el nombre nuevo (el script no lo toca).
- URLs reales en `src/environments/environment.tst.ts` y `environment.prod.ts` (líneas
  `// PLACEHOLDER`). Si no se conocen, dejarlas y registrarlas en `TODOS.md` (ya lo están).
- Paleta en `src/styles/base/_variables.scss` y favicon en `src/assets/images/favicon.ico` si el
  usuario aporta marca; si no, se dejan.
- La carpeta del repo se renombra **a mano**: indicarlo al usuario, no hacerlo.

## 4. Paso 2 — Purgar el dominio de ejemplo

| Pieza | Acción |
|---|---|
| `src/app/core/api/example/` | Borrar (service, types, spec) |
| `src/fake-backend/handlers/example/` | Borrar y quitar `...exampleHandlers` de `src/fake-backend/browser.ts` |
| `src/app/pages/main/` | Convertir en la primera pantalla real o borrarla |
| `AppPath.MAIN` (`shared/enums/app-path.enum.ts`) | Renombrar/sustituir por la ruta real; actualizar la ruta `**`, el `guestGuard` (redirige a `MAIN`) y `AuthService.login` (navega a `MAIN`) |
| `src/assets/i18n/es.json` | Borrar `main.*` y los tags de demo `httpRequest.error.customError`, `httpRequest.warning.customWarning`, `httpRequest.success.exampleUpdated` (conservar cada `default` y `sessionExpired`) |
| `e2e/auth.spec.ts` | Adaptar: tras el login ya no aparece `'Example data served by the MSW fake backend'`; asertar contenido real |
| Specs que referencian el ejemplo | `app.routes.spec.ts` (mock de `ExampleService`), `main.component.spec.ts` |

Se **conservan** (infraestructura genérica): interceptores y `http-context.tokens.ts`
(`SHOW_LOADER`, `SUCCESS_MESSAGE`, `requestContext`), `NotificationService` +
`NotificationsComponent`, `LoaderService` + `GlobalLoaderComponent`, `HttpResponseHandlerService`,
`HttpCustomHeader` (header de aviso del backend), `provideI18n()`, `shared/` (utils, pipes,
validators, `FormService`), header/footer, `fake-backend/utils/` y `src/styles/`.

## 5. Paso 3 — ¿Flujo de autenticación?

**Se conserva** (por defecto, o si hay login): adaptar `pages/login` y `core/api/login` al contrato
real (campos, tipos `LoginRequest/LoginResponse`, mocks). El refresh token
(`core/api/refresh-token`, `authInterceptor`) se conserva si el backend lo soporta.

**Se elimina** (app sin login), borrar de una pieza:

- `pages/login/`, `core/guards/auth.guard.ts` (+ spec), `AppPath.LOGIN` y los `canActivate` de `app.routes.ts`.
- `core/api/login/`, `core/api/refresh-token/`, `core/services/auth.service.ts`, `shared/models/auth.types.ts` (+ specs).
- `core/interceptors/auth.interceptor.ts` (+ spec) y su entrada en `withInterceptors` de `app.config.ts`.
- `handleSessionExpired()` de `HttpResponseHandlerService` (+ su test) y la clave `httpRequest.error.sessionExpired`.
- `fake-backend/handlers/login/`, `fake-backend/handlers/refresh-token/` (y su registro en `browser.ts`),
  `fake-backend/utils/auth.ts` (`requireAuth`), su export en `utils/index.ts` y cada uso en los handlers.
- Bloque de usuario del header (`session`, botón `#header-btn-logout`), `NgStringPipesModule` y la
  dependencia `ngx-pipes` (`npm uninstall ngx-pipes`) si nada más la usa.
- Claves `login.*` y `common.logout`; specs y `e2e/auth.spec.ts` sustituidos por los flujos reales.

`npm run lint:arch` (huérfanos) y `npm run lint:unused` (knip) detectan cualquier resto.

## 6. Paso 4 — Montar los dominios reales

Por cada dominio, con las skills correspondientes:

1. **Endpoints** → `@api-endpoint`: `core/api/{familia}/` (service + types + spec con
   `HttpTestingController`) y mock MSW en `fake-backend/handlers/{familia}/` registrado en `browser.ts`.
2. **Notificaciones** → `@success-notifications`: `requestContext({ successMessage, showLoader })`
   en las mutaciones; tags en `httpRequest.*`.
3. **Páginas** en `pages/{dominio}/` (vertical slice, `export default`, lazy en `app.routes.ts`
   con su `AppPath`); componentes internos en subcarpetas del dominio. Nada sube a `shared/` sin
   un segundo consumidor real; los dominios no se importan entre sí.
4. **Textos** → `@i18n`: claves `{dominio}.{componente}.{grupo}.{clave}`, `translateText()` en TS.
5. **Estilos** con variables/mixins de `src/styles/` (`src/styles/README.md`).
6. **TODOs** → `@track-todos`: lo que dependa del backend o del negocio y no pueda resolverse.

Seguir `ARCHITECTURE.md` en todo (orden de secciones, signals, `inject()`, `type`, a11y, ids).

## 7. Paso 5 — Tests

Skill `@testing`:

- **Unitarios (Vitest)** para todo fichero con lógica: servicios de API, componentes, guards,
  utils, validators… con la cobertura **por fichero** (90/85/90/90).
- **E2E (Playwright)** en `e2e/`: un spec por flujo de usuario real (happy path + validaciones o
  errores relevantes), contra el fake backend MSW.

## 8. Paso 6 — Documentación

- `README.md`: título, descripción de la app, quitar la sección de placeholders (ya sustituidos) y
  la vía rápida de arranque; mantener desarrollo, comandos y quality gates.
- `ARCHITECTURE.md` y `.github/copilot-instructions.md`: sustituir menciones al dominio de ejemplo
  (`example`, `main`, y `login` si se eliminó) por los dominios reales; quitar el aviso de
  "este repo es un template" de `copilot-instructions.md` y `CLAUDE.md`.
- `TODOS.md`: solo pendientes reales.

## 9. Paso 7 — Definition of Done

```bash
npm run format
npm run check
```

**La tarea no termina hasta que `npm run check` pasa en verde de principio a fin** (formato,
ESLint, Stylelint, dependency-cruiser, knip, typecheck, tests con cobertura, build con presupuestos
y e2e). Si algo falla, se arregla el código; nunca se desactiva una regla, se baja un umbral, se
sube un presupuesto, se añade un `eslint-disable` ni se salta un test. Si una regla bloquea algo
legítimo, parar y explicárselo al usuario.

Resumen final al usuario: nombre y slug aplicados, dominios y endpoints creados, si se conservó la
auth, decisiones tomadas por defecto, pendientes registrados en `TODOS.md` y recordatorio de
renombrar la carpeta del repo.

## Checklist

- [ ] `npm run rename` aplicado; environments, paleta y favicon revisados
- [ ] Dominio `example` purgado (API, MSW + `browser.ts`, `main`, `es.json`, specs, e2e)
- [ ] Decisión sobre la auth aplicada de forma completa (sin restos: `lint:arch` / `lint:unused`)
- [ ] Dominios reales con API + tipos + spec + mock MSW, páginas, i18n y estilos
- [ ] Specs unitarios con cobertura por fichero y un spec e2e por flujo de usuario
- [ ] README, ARCHITECTURE, copilot-instructions, CLAUDE y TODOS actualizados
- [ ] **`npm run check` en verde**, sin ningún gate relajado
