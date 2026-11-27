# Calidad: quality gates, CI y Definition of Done

> Todo lo que se puede comprobar, se comprueba. Este template está pensado para
> que **agentes de IA implementen** y el humano revise la funcionalidad: la
> calidad del código la garantizan estos gates, que aplican igual a humanos y a
> IA.

## 1. Los gates

`npm run check` ejecuta todo, en este orden, y se detiene en el primer fallo:

| Fase          | Script         | Qué valida                                                                                                                                    |
| ------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Formato       | `format:check` | Prettier en todo el repo                                                                                                                      |
| Lint          | `lint`         | ESLint, `--max-warnings=0` (§2)                                                                                                               |
| Estilos       | `lint:styles`  | Stylelint en `src/**/*.scss`                                                                                                                  |
| Arquitectura  | `lint:arch`    | dependency-cruiser: capas, dominios aislados, ciclos, huérfanos, fake backend aislado, sin imports de tests ni de `devDependencies` en la app |
| Código muerto | `lint:unused`  | knip: ficheros, exports y dependencias sin usar                                                                                               |
| Tipos         | `typecheck`    | `tsc --noEmit` sobre app, specs y e2e                                                                                                         |
| Tests         | `test:ci`      | Vitest + cobertura mínima **por fichero** ([`testing.md`](testing.md))                                                                        |
| Build         | `build`        | Build de producción con presupuestos: inicial 350 kB aviso / 500 kB error; cualquier script 250/350 kB; hoja de componente 3/6 kB             |
| E2E           | `e2e`          | Playwright contra la app con el mock MSW                                                                                                      |

`npm run check:static` agrupa las seis primeras (sin tests, build ni e2e). Al
terminar en verde, ambos scripts dejan un **sello DoD** que usan los hooks de
los agentes de IA ([`../ai/workflow.md`](../ai/workflow.md)).

### Bucle rápido mientras se trabaja

```bash
npm run test:file -- <fichero|carpeta>   # tests de lo que estás tocando, sin cobertura (segundos)
npx eslint <fichero|carpeta>             # ESLint solo de lo que estás tocando
npm run e2e:ui                           # e2e con interfaz para depurar
npm run format                           # Prettier + arreglos automáticos de Stylelint
```

El bucle rápido no sustituye al DoD: la tarea se cierra con `npm run check`
completo.

## 2. Qué comprueba ESLint (`eslint.config.mjs`, todo es error)

- **TypeScript**: `strictTypeChecked` + `stylisticTypeChecked` (sin `any` ni
  operaciones `unsafe`, sin promesas flotantes —`void` explícito si se dispara y
  se olvida—, sin `!`, `??` para nulos, `switch` exhaustivos), `type` en vez de
  `interface`, `import type`, visibilidad explícita, tipos de retorno explícitos
  en exports y naming (booleans `is/has/should/can`, tipos `PascalCase`).
- **Base**: `curly`, `eqeqeq`, `no-console` (solo `warn`/`error`),
  `no-else-return`, `no-nested-ternary`, `no-param-reassign`,
  `object-shorthand`, `prefer-template`.
- **Métricas**: complejidad ciclomática y cognitiva ≤ 10, profundidad ≤ 3, ≤ 4
  parámetros, ≤ 4 callbacks anidados, ≤ 60 líneas por función y ≤ 300 por
  fichero. Más las reglas de `sonarjs`.
- **Framework**: reglas de angular-eslint para Angular moderno
  ([`../stack/angular.md`](../stack/angular.md#12-reglas-de-lint-de-angular)).
- **Plantillas**: recomendadas + **accesibilidad** (`alt-text`,
  `label-has-associated-control`, `click-events-have-key-events`,
  `interactive-supports-focus`, `valid-aria`…), `button-has-type`, sin estilos
  inline, sin interpolación en atributos, sin `tabindex` positivo y complejidad
  condicional ≤ 4. Es un chequeo estático: no valida contraste ni el DOM
  renderizado.
- **Arquitectura**: `subscribe()` prohibido fuera de `core/interceptors/`;
  `core/` y `shared/` no importan `@pages/*`.
- **Tests**: sin `.only/.skip/.todo`; relajan solo lo que la ergonomía de test
  exige (visibilidad, naming, `!`, longitud).
- **Sin vías de escape**: los comentarios `eslint-disable` en línea **no tienen
  efecto** y se reportan (`linterOptions.noInlineConfig`), y `@ts-ignore`,
  `@ts-expect-error` y `@ts-nocheck` están prohibidos. Una regla solo cambia en
  el fichero de configuración.

**TypeScript estricto** (`tsconfig.json`): `strict`, `noImplicitOverride`,
`noPropertyAccessFromIndexSignature`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`,
`noUncheckedIndexedAccess`, `isolatedModules` (+ las comprobaciones estrictas de
plantillas del framework).

**Stylelint**: ver [`styles.md`](styles.md) §5; también ignora los comentarios
`stylelint-disable`.

## 3. Git

- **Conventional commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`,
  `chore:`… (scope opcional).
- **Hooks de git** (husky; `npm install` los activa):
  - `pre-commit` → `lint-staged`: Prettier + `eslint --fix` sobre `.ts`/`.html`,
    Prettier sobre `.js/.mjs/.cjs/.json/.md/.yml` y Prettier + Stylelint sobre
    `.scss`, solo en lo staged.
  - `commit-msg` → rechaza mensajes que no sigan conventional commits.
  - `pre-push` → `npm run check:static` + `npm run test:ci`.
- Los hooks de git se pueden saltar con `--no-verify`; la CI no.

## 4. CI: `.github/workflows/`

Son **GitHub Actions**: GitHub ejecuta estos ficheros en sus servidores. No
dependen de quién (ni de qué IA) haya escrito el código.

| Workflow                  | Cuándo se ejecuta                                                            | Qué hace                                                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                  | Cada push a `main` y cada pull request                                       | Repite **todos los gates** en 4 jobs en paralelo: `static` (+ `npm run audit:prod`), `test` (sube la cobertura), `build` y `e2e` (sube el informe de Playwright si falla) |
| `copilot-setup-steps.yml` | Antes de que el agente cloud de Copilot empiece una tarea (y al modificarlo) | Prepara su máquina: Node de `.nvmrc`, `npm ci` y Chromium, para que pueda pasar `npm run check` antes de abrir su PR                                                      |

Recomendación al crear el repositorio del proyecto: proteger `main` en GitHub
(_Settings → Branches_) exigiendo que los jobs de `ci.yml` estén en verde para
poder hacer merge.

## 5. Regla de oro: nunca relajar un gate

Está **prohibido** relajar un gate para que pase: desactivar o rebajar reglas,
añadir `eslint-disable`/`@ts-ignore`/`@ts-expect-error`, bajar umbrales de
cobertura, subir presupuestos, excluir ficheros, marcar tests como `.skip` o
borrar tests que fallan. Se arregla el código.

Si una regla bloquea de verdad un patrón legítimo, se **para y se explica al
humano** (qué regla, dónde, por qué) antes de tocar ninguna configuración. Para
los agentes de IA esto está además forzado técnicamente: los comentarios de
desactivación no tienen efecto y un hook pide confirmación humana antes de
editar la configuración de los gates ([`../ai/workflow.md`](../ai/workflow.md)).

## 6. Definition of Done

Una tarea (feature, fix, refactor) **no está terminada** hasta que:

1. El código sigue la arquitectura ([`overview.md`](overview.md) y los
   documentos enlazados).
2. Cada fichero nuevo o modificado con lógica tiene su test y cumple la
   cobertura por fichero.
3. Cada flujo de usuario nuevo o modificado tiene su e2e.
4. Cada endpoint nuevo tiene su mock MSW registrado.
5. Los textos están en el fichero de traducciones, los `TODO` registrados en
   `docs/project/TODOS.md` y la documentación actualizada si cambia una
   convención.
6. **`npm run check` termina en verde de principio a fin** (exit code 0), sin
   relajar ningún gate. Si el build muestra avisos de presupuesto nuevos, se
   resuelven.

Si solo cambia documentación (`*.md`), basta `npm run check:static` (también
para retoques de documentación hechos después de un `npm run check` en verde).

## 7. Checklist de revisión (PR o generación de IA)

- [ ] Ficheros en la carpeta correcta y al nivel más bajo posible; sin imports
      entre dominios
- [ ] API: carpeta `{api}/{familia}`, URL desde la constante de la API, tipos
      `{Method}Request/Response`, test y mock MSW registrado
- [ ] Tipos con `type`, átomos de `shared/models/`, sin `any` ni `!`
- [ ] Componentes según la anatomía del framework
      ([`../stack/angular.md`](../stack/angular.md))
- [ ] Estilos con tokens y mixins de `src/styles/`; sin redefinir clases
      globales
- [ ] Cero texto visible hardcodeado; claves con la convención
- [ ] `id` en todo elemento interactuable; accesibilidad mínima
- [ ] Early returns, llaves siempre, funciones pequeñas
- [ ] Tests unitarios (cobertura por fichero) y e2e del flujo
- [ ] TODOs registrados; commit convencional
- [ ] **`npm run check` en verde**, sin gates relajados
