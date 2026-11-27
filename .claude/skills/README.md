# Skills

Procedimientos paso a paso que los agentes de IA cargan cuando la tarea lo pide. Cada skill vive en
`.claude/skills/{nombre}/SKILL.md`, la carpeta que leen de forma nativa **GitHub Copilot** (VS Code,
CLI y agente cloud) y **Claude Code**: una sola copia para las dos herramientas. Se invocan con
`/nombre` en el chat o se cargan solas cuando la petición encaja con su `description`.

Todas asumen la Definition of Done de [`AGENTS.md`](../../AGENTS.md): la tarea no termina hasta que
`npm run check` pasa en verde. Cómo encajan con el resto de la configuración de IA:
[`docs/ai/workflow.md`](../../docs/ai/workflow.md).

| Skill          | Qué hace                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `new-project`  | Convierte el template en el proyecto real: entrevista (incluido el framework), renombrado, sustitución del ejemplo, dominios con sus tests, documentación y `npm run check` en verde |
| `new-page`     | Crea una pantalla o componente: ubicación, anatomía, plantilla con ids/i18n/a11y, SCSS con tokens, ruta lazy, test unitario y e2e |
| `api-endpoint` | Conecta un endpoint o una API nueva: tipos `{Method}Request/Response`, método con la URL de la API, test con `HttpTestingController` y mock MSW registrado |
| `i18n`         | Textos visibles: claves en `es.json`, `\| translate` en plantillas y `translateText()` en TS              |
| `unit-testing` | Tests unitarios con Vitest y TestBed (zoneless), mocks, HTTP, rutas, guards, timers y cobertura por fichero |
| `e2e-testing`  | Tests e2e con Playwright contra el mock MSW: selectores, aserciones y depuración (UI, trazas, informe)     |
| `verify`       | Definition of Done: `npm run check` → corregir la primera fase que falla → repetir hasta verde, sin relajar gates |
| `track-todos`  | Registra cada `// TODO` en `docs/project/TODOS.md` y lo elimina al resolverse                             |
| `create-skill` | Crea una skill nueva con el frontmatter correcto y la añade a este índice                                  |
