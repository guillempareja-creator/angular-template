# Testing

> Estrategia agnóstica de framework. Las APIs de test de Angular (TestBed,
> `HttpTestingController`…) están en
> [`../stack/angular.md`](../stack/angular.md#11-tests). Paso a paso: skills
> `unit-testing` y `e2e-testing`.

## 1. Estrategia

| Nivel            | Herramienta        | Qué cubre                                                      | Dónde                        |
| ---------------- | ------------------ | -------------------------------------------------------------- | ---------------------------- |
| Unitario         | **Vitest** (jsdom) | Cada fichero con lógica: servicios, componentes, utils…        | `*.spec.ts` junto al fichero |
| End-to-end (e2e) | **Playwright**     | Cada flujo de usuario, en un navegador real contra el mock MSW | `e2e/{flujo}.spec.ts`        |

- **Todo fichero con lógica nace con su test** y **todo flujo de usuario nuevo o
  modificado, con su e2e** (camino feliz + validaciones o errores relevantes).
- Se prueba **comportamiento observable** (lo que se pinta, lo que se llama, el
  estado público), no la implementación. Nada de tests vacíos tipo "should
  create".
- Los tests no se saltan: prohibido `.only`, `.skip` y `.todo` (lo comprueba
  ESLint).

## 2. Tests unitarios (Vitest)

```bash
npm test                                   # modo watch
npm run test:file -- src/app/pages/main    # un fichero o carpeta, sin cobertura (bucle rápido)
npm run test:ci                            # todo + cobertura por fichero (lo que exige el DoD)
```

- **Cobertura por fichero** (no global): statements **90** · branches **85** ·
  functions **90** · lines **90**. Basta un fichero por debajo para que
  `test:ci` falle. Se excluyen tipos, enums, specs y la configuración/rutas raíz
  (las rutas se prueban igualmente). Informe HTML en `coverage/`.
- Organización: un `describe` por unidad, `describe` anidados por método o
  escenario, `it` en inglés describiendo el comportamiento
  (`'renders the data returned by the API'`), patrón **AAA** (Arrange, Act,
  Assert) e `it.each` para tablas de casos.
- **Mocks**: objetos planos con `vi.fn()` inyectados en lugar de la dependencia
  real; respuestas con `mockResolvedValue` / `mockRejectedValue`;
  `vi.resetAllMocks()` en el `beforeEach` si el mock se comparte. Espiar algo
  real: `vi.spyOn(obj, 'method')`. Tiempo: `vi.useFakeTimers()` +
  `vi.advanceTimersByTime(ms)`.
- Seleccionar el DOM por los `id` de los elementos ([`overview.md`](overview.md)
  §5).
- Textos: se asertan **claves** de traducción, no el texto
  ([`i18n.md`](i18n.md)).

## 3. Tests e2e (Playwright)

### Cómo funciona

[Playwright](https://playwright.dev) controla un navegador real (Chromium) y
ejecuta los specs de `e2e/` como lo haría un usuario. La configuración está en
`playwright.config.ts`:

| Opción                   | Valor en el template                    | Para qué                                                      |
| ------------------------ | --------------------------------------- | ------------------------------------------------------------- |
| `testDir`                | `./e2e`                                 | Dónde están los specs                                         |
| `webServer`              | `npx ng serve --port 4200`              | Arranca la app (con el mock MSW) antes de los tests           |
| `reuseExistingServer`    | `true` en local, `false` en CI          | En local reutiliza un `npm start` ya levantado (más rápido)   |
| `use.baseURL`            | `http://localhost:4200`                 | `page.goto('/main')` es relativo a la app                     |
| `projects`               | Chromium (Desktop Chrome)               | Navegadores en los que corre; se pueden añadir Firefox/WebKit |
| `fullyParallel`          | `true`                                  | Cada test en su propio contexto de navegador, en paralelo     |
| `retries` / `forbidOnly` | 2 / sí en CI                            | Absorber inestabilidad puntual en CI y prohibir `test.only`   |
| `trace` / `screenshot`   | solo en fallo                           | Evidencias para depurar en `test-results/`                    |
| `reporter`               | `list` (local) o `github` (CI) + `html` | Salida por consola + informe HTML en `playwright-report/`     |

Al ejecutar `npm run e2e`: Playwright levanta `ng serve` (o reutiliza el que
esté en marcha), espera a que responda, abre Chromium, ejecuta cada `test()` en
un contexto limpio y, si algo falla, guarda traza (línea de tiempo con DOM, red
y consola), captura y un `error-context.md` con la instantánea de la página.
Como la app corre con **MSW**, los datos que se ven son los de
`src/fake-backend/handlers/**/mocks.ts`: los e2e no dependen de ningún backend.

> **Ojo con el puerto 4200**: en local Playwright reutiliza **cualquier**
> servidor que ya escuche en él. Si es el de otro proyecto, los e2e fallarán de
> forma confusa: páralo antes de lanzarlos.

### Comandos

```bash
npm run e2e:install        # una vez por máquina: descarga Chromium
npm run e2e                # todos los e2e, sin interfaz
npm run e2e -- e2e/example.spec.ts   # un spec
npm run e2e:ui             # modo UI: lista de tests, viaje en el tiempo por cada paso, watch
npm run e2e:report         # abre el último informe HTML (con las trazas de los fallos)
npx playwright codegen http://localhost:4200   # graba interacciones y genera código (con npm start)
```

En VS Code, la extensión **Playwright Test** (recomendada en
`.vscode/extensions.json`) permite ejecutar y depurar cada test desde el editor.

### Cómo se escriben

```typescript
import { expect, test } from '@playwright/test';

test.describe('example page', () => {
  test('shows the data returned by the example API', async ({ page }) => {
    await page.goto('/main');

    await expect(
      page.getByText('Example data served by the MSW fake backend'),
    ).toBeVisible();
  });
});
```

- **Un spec por flujo de usuario** (`e2e/{flujo}.spec.ts`), con su camino feliz
  y las validaciones principales.
- **Selectores estables**: los `id` del patrón de ids
  (`page.locator('#main-btn-save')`) o roles y textos visibles (`getByRole`,
  `getByText`). Nunca clases CSS ni estructura del DOM.
- **Aserciones web-first** con auto-espera
  (`await expect(locator).toBeVisible()`, `toHaveURL`): nunca `waitForTimeout`.
- Los datos esperados salen de los mocks de `fake-backend/`; si un flujo
  necesita otros datos, se añaden al mock.
- El e2e está tipado (`e2e/tsconfig.json`) y pasa por ESLint como el resto del
  código.
- En CI, si falla, el informe (`playwright-report/`) se sube como artefacto de
  GitHub Actions.

## 4. Qué testear (resumen)

| Pieza                     | Unitario                                              | E2E                        |
| ------------------------- | ----------------------------------------------------- | -------------------------- |
| Servicio de API           | Método HTTP, URL, body y respuesta                    | —                          |
| Componente / pantalla     | Lo que pinta según el estado; interacción por `id`    | Si forma parte de un flujo |
| Util, pipe, validator     | Función pura con casos límite (`null`, vacío, bordes) | —                          |
| Interceptor, guard, rutas | Comportamiento con las dependencias simuladas         | Redirecciones clave        |
| Flujo de usuario          | —                                                     | Camino feliz + errores     |
