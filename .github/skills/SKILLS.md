# Skills locales

Skills invocables por los agentes de IA (Copilot con `@nombre`, Claude Code las lee desde aquí).
Cada una vive en `.github/skills/{nombre}/SKILL.md`. Todas asumen la
[Definition of Done](../copilot-instructions.md): la tarea no termina hasta que **`npm run check`**
pasa en verde.

| Skill | Invocación | Qué hace |
|---|---|---|
| `new-project` | `@new-project` | Convierte el template en el proyecto real: renombra placeholders, purga el dominio de ejemplo, decide el flujo de auth, monta los dominios con sus mocks, tests unitarios y e2e, y cierra con `npm run check` en verde |
| `api-endpoint` | `@api-endpoint` | Crea un endpoint: método en `core/api/{familia}/` con `firstValueFrom` + URL relativa + `requestContext`, tipos `{Method}Request/Response`, spec con `HttpTestingController` y mock MSW (`handlers.ts` + `mocks.ts` + `index.ts`, registrado en `browser.ts`) |
| `success-notifications` | `@success-notifications` | Notificaciones de llamadas HTTP vía `HttpContext` (`requestContext({ successMessage, showLoader })`, `SUCCESS_MESSAGE`, `SHOW_LOADER`), aviso del backend por header de respuesta, tags de error y toasts programáticos con `NotificationService` |
| `i18n` | `@i18n` | Textos visibles traducibles: claves en `es.json`, `\| translate` en templates, `translateText()` en TS, `common.*`, `httpRequest.*` y `form.*` |
| `testing` | `@testing` | Tests unitarios con Vitest (`vi.fn`, `vi.spyOn`, `whenStable`, `HttpTestingController`, `RouterTestingHarness`), cobertura por fichero y e2e con Playwright |
| `track-todos` | `@track-todos` | Registra cada `// TODO` del código en `TODOS.md` y lo elimina al resolverse |
| `create-skill` | `@create-skill` | Crea una skill local nueva con el frontmatter correcto y la añade a este índice |
