# Trabajar con IA (GitHub Copilot y Claude Code)

> Cómo está preparado el repositorio para que **GitHub Copilot y Claude Code**
> trabajen igual, con una **única fuente de verdad**, y para que **se validen
> solos** antes de dar una tarea por terminada.

## 1. La idea

- La IA implementa; el humano revisa la **funcionalidad**; la **calidad del
  código** la garantizan los gates
  ([`../architecture/quality.md`](../architecture/quality.md)) y los hooks de
  este documento.
- Nada es una caja negra: cada convención está documentada en `docs/` y
  ejemplificada en el código, para que el humano entienda siempre cómo funciona
  y cómo escala el proyecto.

## 2. Qué lee cada herramienta

| Fichero                                     | Para qué                                        | Copilot (VS Code / CLI) | Copilot cloud agent |        Claude Code        |
| ------------------------------------------- | ----------------------------------------------- | :---------------------: | :-----------------: | :-----------------------: |
| `AGENTS.md`                                 | Instrucciones siempre cargadas (fuente única)   |            ✓            |          ✓          | ✓ vía `.claude/CLAUDE.md` |
| `.claude/CLAUDE.md`                         | Importa `AGENTS.md` (`@../AGENTS.md`)           |            —            |          —          |             ✓             |
| `.claude/skills/*/SKILL.md`                 | Procedimientos bajo demanda                     |            ✓            |          ✓          |             ✓             |
| `.claude/settings.json` → `hooks`           | Auto-validación determinista (§5)               | ✓ (en VS Code, preview) |          ✗          |             ✓             |
| `.claude/settings.json` → `permissions`     | Comandos seguros sin confirmación               |            —            |          —          |             ✓             |
| `.github/workflows/copilot-setup-steps.yml` | Entorno del agente cloud (Node, deps, Chromium) |            —            |          ✓          |             —             |
| `docs/`                                     | Referencia detallada (se lee cuando toca)       |            ✓            |          ✓          |             ✓             |

Por qué así:

- **`AGENTS.md`** es el estándar abierto de instrucciones para agentes: lo leen
  Copilot (VS Code, CLI, agente cloud) y Claude Code (que además lo importa
  desde `.claude/CLAUDE.md`, así funciona en cualquier versión). Ya no existe
  `.github/copilot-instructions.md`: tener dos ficheros de instrucciones solo
  sirve para que diverjan.
- **`.claude/skills/`** es la única carpeta de skills que leen **ambas**
  herramientas de forma nativa (Copilot busca skills de proyecto en
  `.github/skills/`, `.agents/skills/` y `.claude/skills/`; Claude Code solo en
  `.claude/skills/`). Una sola copia, sin sincronizar nada.
- **Hooks en `.claude/settings.json`**: el runtime de Copilot también lee ese
  fichero (formato de Claude), así que un único fichero de hooks sirve para las
  dos herramientas.

## 3. Dónde vive cada cosa

| Tipo de conocimiento                            | Dónde                                              | Cuándo se carga                       |
| ----------------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| Lo que se puede comprobar automáticamente       | Gates (ESLint, tests, dependency-cruiser…) y hooks | Siempre: se ejecuta, no se lee        |
| Lo imprescindible en **todas** las tareas       | `AGENTS.md` (breve)                                | En cada petición                      |
| Procedimientos paso a paso (crear un endpoint…) | Skills (`.claude/skills/`)                         | Cuando la tarea lo pide               |
| Detalle y razones                               | `docs/`                                            | Cuando la IA o el humano lo necesitan |

**Regla para añadir conocimiento**, en este orden: ¿se puede **automatizar**
(regla de lint, test, hook)? → hazlo. ¿Es un **procedimiento** repetible? →
skill (`create-skill`). ¿Es **detalle** de referencia? → `docs/`. ¿Hace falta
**siempre** y en pocas palabras? → `AGENTS.md`. Cada regla vive en un solo
sitio; los demás enlazan.

## 4. Skills

El índice está en [`.claude/skills/README.md`](../../.claude/skills/README.md).
Se invocan escribiendo `/nombre` en el chat (Copilot y Claude Code) o se cargan
solas cuando la petición encaja con su descripción. La primera de todas es
`/new-project`, que convierte el template en el proyecto real.

## 5. Auto-validación por capas

Que la IA "se acuerde" de validar no basta: el DoD se apoya en mecanismos que no
dependen de su memoria.

| Capa | Mecanismo                | Qué garantiza                                                                                        |
| ---- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1    | `AGENTS.md`              | La IA conoce el DoD y la regla de no relajar gates                                                   |
| 2    | Skill `verify`           | Bucle `npm run check` → leer errores → corregir → repetir hasta verde                                |
| 3    | Hook **Stop**            | La IA no puede cerrar con cambios sin verificar (ver abajo)                                          |
| 4    | Hook **PreToolUse**      | No puede editar la configuración de los gates sin tu confirmación                                    |
| 5    | Gates sin vías de escape | Los `eslint-disable`/`stylelint-disable` no tienen efecto; `@ts-ignore` y similares están prohibidos |
| 6    | Hooks de git             | `pre-commit`, `commit-msg` y `pre-push` (`check:static` + `test:ci`)                                 |
| 7    | CI (`ci.yml`)            | Todos los gates en GitHub en cada push y PR; no se puede saltar                                      |

### Cómo funcionan los hooks (`scripts/ai/`)

- **Sello DoD** ([`scripts/ai/dod.mjs`](../../scripts/ai/dod.mjs)):
  `npm run check` y `npm run check:static`, al terminar en verde, guardan la
  **huella** del estado de los ficheros (un hash de árbol de git: cambia si se
  edita cualquier fichero, no si se hace commit) en
  `node_modules/.cache/ai-dod/`. Si tras un `npm run check` en verde solo se
  retoca documentación (`*.md`), basta un `npm run check:static` encima.
  `node scripts/ai/dod.mjs status` dice si el estado actual está verificado.
- **SessionStart** (`hooks/session-start.mjs`): guarda la huella al empezar la
  sesión, para no exigir a la IA que verifique cambios que ya eran tuyos.
- **Stop** (`hooks/stop.mjs`): cuando la IA termina un turno, si ha cambiado
  ficheros durante la sesión y no hay un sello válido para el estado actual,
  **bloquea el cierre una vez** pidiéndole que ejecute `verify`
  (`npm run check`; si solo cambió `*.md`, basta `check:static`). Si la IA no
  había terminado (por ejemplo, te está haciendo una pregunta), lo dice y vuelve
  a parar: entonces se le deja terminar y **tú ves un aviso** de cambios sin
  verificar.
- **PreToolUse** (`hooks/guard-gates.mjs`): antes de que la IA edite
  `eslint.config.mjs`, `stylelint.config.js`, `knip.json`,
  `.dependency-cruiser.cjs`, `tsconfig*.json`, `angular.json`,
  `playwright.config.ts`, `package.json`, `.prettier*`, `.husky/`,
  `.github/workflows/`, `.claude/settings*.json` o `scripts/ai/`, te pide
  confirmación. En modos sin humano (autopilot, agente cloud) la edición se
  deniega y la IA debe parar y explicártelo.

Los hooks nunca rompen el trabajo: si algo falla (sin git, sin Node…), dejan
pasar.

## 6. Flujo de trabajo recomendado

1. **Describe la tarea con criterios de aceptación** (qué ve y hace el usuario).
   Para trabajo planificado, guarda las historias en `docs/project/` (cada tipo
   en su subcarpeta).
2. **Modo plan** para todo lo que no sea trivial: la IA explora, pregunta y
   propone; tú apruebas.
3. **E2E primero** para un flujo nuevo: define "terminado" desde el punto de
   vista del usuario.
4. **Implementación + tests unitarios** con el bucle rápido
   (`npm run test:file -- <ruta>`).
5. **`verify`**: `npm run check` completo en verde.
6. **Tu revisión funcional**: `npm start` y probar el flujo. En el diff, mira
   sobre todo la ubicación de los ficheros, los nombres y que los tests prueban
   comportamiento real.
7. **Commit convencional** y PR; la CI repite todos los gates.

## 7. Buenas prácticas

- **Tareas pequeñas y concretas**, una por conversación. Contexto limpio =
  mejores resultados.
- **Abre la sesión en la raíz del repositorio** (los hooks usan rutas relativas
  a la raíz).
- **Si la IA repite un error, no lo corrijas otra vez en el chat**: conviértelo
  en una regla automática o, si no se puede, en la skill o el documento que
  corresponda.
- No pegues en el chat reglas que ya están en `AGENTS.md`, las skills o `docs/`.
- Pide a la IA que **explique qué ha hecho y por qué**, y que actualice la
  documentación cuando cambie una convención.
- Mantén `AGENTS.md` corto: cada línea se carga en todas las peticiones.
- Un patrón nuevo que se repite → skill nueva con `/create-skill`.

## 8. Workflows de GitHub y opcionales

- **Incluidos**: `ci.yml` y `copilot-setup-steps.yml` (explicados en
  [`../architecture/quality.md`](../architecture/quality.md) §4).
- **Opcional — Claude Code en GitHub** (`claude.yml`): responde a `@claude` en
  issues y PRs. No se incluye porque necesita la app de Claude en el repositorio
  y el secreto `ANTHROPIC_API_KEY` (facturación aparte). Se instala desde Claude
  Code con `/install-github-app`.
- **Opcional — MCP de Playwright**: permite a la IA abrir la app en un navegador
  e inspeccionarla. No se incluye por defecto (los e2e, las trazas y
  `error-context.md` ya cubren la validación). Para activarlo:

  ```jsonc
  // .vscode/mcp.json (Copilot en VS Code)
  { "servers": { "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] } } }

  // .mcp.json (Claude Code)
  { "mcpServers": { "playwright": { "command": "npx", "args": ["@playwright/mcp@latest"] } } }
  ```

- **Opcional — formatear tras cada edición** (hook `PostToolUse` con Prettier):
  no se incluye porque el `pre-commit` ya formatea y `format:check` lo detecta;
  añadiría latencia a cada edición.

## 9. Limitaciones conocidas

- Los hooks de Copilot en VS Code están en _preview_ y requieren que el
  workspace sea de confianza.
- El agente cloud de Copilot solo lee hooks de `.github/hooks/`: allí la
  garantía son `AGENTS.md`, la skill `verify` y la CI. No se duplican los hooks
  en `.github/hooks/` porque Copilot CLI ejecutaría los dos.
- La protección de los gates cubre las herramientas de edición, no comandos de
  shell que escriban ficheros: la CI y la revisión humana son la última red.
- Copilot en Visual Studio, JetBrains y Eclipse (y la code review de Copilot
  dentro del IDE) solo leen `.github/copilot-instructions.md`. Si el equipo los
  usa, crea ese fichero con una sola línea que remita a `AGENTS.md`; nunca
  copies las reglas.
- `npm run check` necesita la versión de Node de `engines` (`package.json`).

## 10. Comprobar que todo se carga

- **Copilot en VS Code**: _Chat: Open Customizations_ → pestañas _Instructions_,
  _Skills_ y _Hooks_; escribir `/` en el chat lista las skills.
- **Copilot CLI**: `/instructions` y `/skills`.
- **Claude Code**: `/context` (debe aparecer `AGENTS.md` entre los ficheros de
  memoria), `/skills` y `/hooks`.

## 11. Mantener la configuración de IA

- **Skill nueva**: `/create-skill` (carpeta `.claude/skills/{nombre}/SKILL.md` +
  fila en el índice).
- **Regla nueva**: primero intentar automatizarla; si no, a la skill o al
  documento de `docs/` que corresponda; solo si hace falta siempre, una línea en
  `AGENTS.md`.
- **Hooks**: `.claude/settings.json` + `scripts/ai/hooks/` (protegidos: piden
  confirmación).
