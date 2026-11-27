# AGENTS.md — App Template

> Instrucciones para agentes de IA (GitHub Copilot, Claude Code y cualquier agente compatible con
> `AGENTS.md`). Es la **fuente única**: no se duplican en otros ficheros. Cómo está montada la IA en
> este repo: [`docs/ai/workflow.md`](docs/ai/workflow.md).

## Este repositorio es un template

Mientras exista la skill `new-project` (`.claude/skills/new-project/`), el repo es un cascarón sin
dominio propio. Si el usuario describe la aplicación que quiere construir o pide arrancar el
proyecto, **carga la skill `new-project` antes de tocar nada**.

## Definition of Done — leer antes de empezar

- Una tarea **no está terminada hasta que `npm run check` termina en verde** de principio a fin
  (exit code 0). Si solo cambiaste documentación (`*.md`), basta `npm run check:static`.
- Cierra cada tarea con la skill `verify` (bucle check → corregir → repetir). Un hook bloquea el
  cierre si hay cambios sin verificar.
- Todo fichero con lógica lleva su test unitario (cobertura **por fichero** 90/85/90/90) y todo
  flujo de usuario nuevo o modificado, su e2e de Playwright.
- **Nunca relajes un gate**: prohibido desactivar o rebajar reglas, `eslint-disable`, `@ts-ignore`,
  `@ts-expect-error`, bajar umbrales, subir presupuestos, excluir ficheros, `.skip`/`.only` o borrar
  tests que fallan. Si una regla bloquea un patrón legítimo, **para y explícaselo al humano** (qué
  regla, dónde, por qué). Editar la configuración de los gates pide confirmación humana.
- Primera vez en una máquina: `npm run e2e:install`. Node según `engines` de `package.json`.

## Comandos

```bash
npm start                      # app con el fake backend MSW → http://localhost:4200
npm run test:file -- <ruta>    # bucle rápido: tests de un fichero o carpeta, sin cobertura
npx eslint <ruta>              # bucle rápido: lint de lo que estás tocando
npm run format                 # Prettier + arreglos de Stylelint
npm run check:static           # formato, lints, arquitectura, código muerto y tipos
npm run check                  # DoD: check:static + test:ci + build + e2e
```

## Mapa

```
src/app/core/      api/{api}/{familia}/ (servicios HTTP) · interceptors/ (interceptor único) · i18n/ · guards/ · services/
src/app/pages/     dominios de negocio (vertical slices); main/ es el ejemplo
src/app/shared/    reutilizables entre 2+ dominios (components, enums, models, pipes, utils…)
src/fake-backend/  mock MSW, espejo de core/api (handlers/{api}/{familia}/)
src/environments/  URL de cada API por entorno (environment.apis)
src/styles/        estilos compartidos: tokens, reset neutro, clases ui, mixins
e2e/               Playwright: un spec por flujo de usuario
docs/              architecture/ · stack/ · ai/ · project/ (siempre en subcarpetas)
```

## Reglas que aplican siempre

- Ficheros en el **nivel más bajo posible**; suben a `shared/` solo con un 2º consumidor real. Un
  dominio no importa otro; `core/` y `shared/` no importan `pages/`; la app no importa
  `fake-backend/`.
- **API**: `core/api/{api}/{familia}/`; URL = constante de la API (`EXAMPLE_API_URL`) + ruta;
  devuelve `Promise`; tipos `{Method}Request`/`{Method}Response`; test + mock MSW registrado.
- **TypeScript**: `type` (nunca `interface` para datos), `import type`, sin `any` (`unknown` + type
  guard), sin `!`, sin _magic strings/numbers_ (enum o constante).
- **Angular**: standalone y zoneless; estado de la vista en signals `readonly`; `inject()`;
  `input()`/`output()`/`model()`/`viewChild()`; `OnPush`; `@if`/`@for`; sin `subscribe()`
  (`firstValueFrom` + `async/await`); orden de secciones del componente
  ([`docs/stack/angular.md`](docs/stack/angular.md) §3).
- **Textos**: cero texto visible hardcodeado; `| translate` en plantillas y `translateText()` en TS;
  claves `{domain}.{component}.{grupo}.{clave}` en `src/assets/i18n/es.json`.
- **Estilos**: hoja de componente con `@use 'imports' as *;` + `:host`; siempre tokens y mixins de
  `src/styles/`; sin valores hardcodeados ni estilos inline; las clases de `src/styles/ui/` se usan,
  no se redefinen.
- `id="{domain}-{component}-{type}-{element}"` en todo elemento interactuable; `type` en los
  botones, `alt` en las imágenes y `<label>` asociado a cada control.
- Early returns, llaves siempre y funciones pequeñas (complejidad ≤ 10, ≤ 60 líneas).
- Código, comentarios y nombres de fichero en **inglés**; textos de usuario en español vía i18n.
- Todo `// TODO` se registra en `docs/project/TODOS.md` (skill `track-todos`).
- Commits: conventional commits (`feat:`, `fix:`, `refactor:`…).

## Skills (`.claude/skills/`)

| Tarea                                                       | Skill          |
| ----------------------------------------------------------- | -------------- |
| Convertir el template en el proyecto real                   | `new-project`  |
| Crear una pantalla o un componente                          | `new-page`     |
| Conectar un endpoint (servicio, tipos, test y mock MSW)     | `api-endpoint` |
| Añadir o cambiar textos visibles                            | `i18n`         |
| Escribir tests unitarios                                    | `unit-testing` |
| Escribir tests e2e                                          | `e2e-testing`  |
| Cerrar una tarea (Definition of Done)                       | `verify`       |
| Registrar o resolver un TODO                                | `track-todos`  |
| Crear una skill nueva                                       | `create-skill` |

## Antes de…

| Vas a…                                         | Lee                                                                    |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| Crear ficheros o carpetas                      | [`docs/architecture/overview.md`](docs/architecture/overview.md)       |
| Tocar llamadas HTTP, entornos o el mock        | [`docs/architecture/api.md`](docs/architecture/api.md)                 |
| Escribir estilos                               | [`docs/architecture/styles.md`](docs/architecture/styles.md)           |
| Escribir componentes, rutas o formularios      | [`docs/stack/angular.md`](docs/stack/angular.md)                       |
| Escribir tests                                 | [`docs/architecture/testing.md`](docs/architecture/testing.md)         |
| Tocar gates, git hooks o CI                    | [`docs/architecture/quality.md`](docs/architecture/quality.md)         |
