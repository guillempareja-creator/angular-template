---
name: e2e-testing
description: >
  Use when writing, updating, running or debugging end-to-end tests with Playwright under e2e/, for
  any new or modified user flow. Also use when the user asks in Spanish to crear un test e2e, test
  end to end, probar el flujo, Playwright, test de navegador or depurar un e2e. Covers how the
  Playwright setup works here (webServer with ng serve + MSW fake backend, Chromium, baseURL),
  one spec per user flow, stable selectors (element ids, roles, visible text), web-first
  assertions, data coming from the MSW mocks, and debugging with e2e:ui, traces, error-context.md,
  the HTML report and codegen.
user-invocable: true
---

# Skill: Tests e2e (Playwright)

## 1. Cuándo usar esta skill

**Todo flujo de usuario nuevo o modificado tiene su e2e** (camino feliz + validaciones o errores
relevantes). Cómo funciona Playwright en este repo:
[`docs/architecture/testing.md`](../../../docs/architecture/testing.md) §3.

En resumen: `npm run e2e` levanta `ng serve` (o reutiliza un `npm start` en marcha), la app corre
con el **fake backend MSW** y Chromium ejecuta los specs de `e2e/`. Los datos que se ven son los de
`src/fake-backend/handlers/**/mocks.ts`: no hay backend real.

## 2. Escribir el spec (`e2e/{flujo}.spec.ts`)

```typescript
import { expect, test } from '@playwright/test';

test.describe('expedients list', () => {
  test('shows the expedients returned by the API', async ({ page }) => {
    await page.goto('/expedientes');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Expedientes');
    await expect(page.locator('#expedients-list-table-results tbody tr')).toHaveCount(2);
  });

  test('reloads the list on refresh', async ({ page }) => {
    await page.goto('/expedientes');

    await page.locator('#expedients-list-btn-refresh').click();

    await expect(page.getByText('EXP-1')).toBeVisible();
  });
});
```

Referencia real: [`e2e/example.spec.ts`](../../../e2e/example.spec.ts).

- **Un fichero por flujo** de usuario; un `test` por escenario, nombres en inglés.
- **Selectores estables**: `#id` del patrón de ids, o `getByRole` / `getByLabel` / `getByText` con
  el texto real (en español). Nunca clases CSS ni estructura del DOM.
- **Aserciones web-first** (`await expect(locator).toBeVisible()`, `toHaveText`, `toHaveCount`,
  `toHaveURL`): esperan solas. **Nunca** `page.waitForTimeout`.
- Los datos esperados salen de los mocks MSW; si el flujo necesita otros datos o un error, se añade
  al mock/handler (skill `api-endpoint`), no se inventa en el test.
- Cada test es independiente (contexto de navegador limpio): no dependas del orden.
- Prohibido `test.only` / `test.skip` (ESLint y `forbidOnly` en CI).

## 3. Ejecutar y depurar

```bash
npm run e2e:install                    # una vez por máquina (Chromium)
npm run e2e                            # todos
npm run e2e -- e2e/example.spec.ts     # uno
npm run e2e:ui                         # modo UI: paso a paso con DOM, red y consola
npm run e2e:report                     # informe HTML del último run (con trazas)
npx playwright codegen http://localhost:4200   # con `npm start` en marcha: graba y genera código
```

Cuando un e2e falla, lee en este orden: el error de la consola (línea y aserción) →
`test-results/**/error-context.md` (instantánea de la página en el momento del fallo) → la traza
(`npm run e2e:report`, o `npx playwright show-trace test-results/<test>/trace.zip`). Si falla por
datos, revisa los mocks; si es por selector, revisa los `id` del componente. Si todo falla de forma
extraña, comprueba que el puerto 4200 no lo ocupa otro proyecto (en local se reutiliza el servidor
que encuentre).

## Checklist

- [ ] Un `e2e/{flujo}.spec.ts` por flujo nuevo o modificado (feliz + errores relevantes)
- [ ] Selectores por `id`, rol o texto visible; aserciones web-first; sin esperas fijas
- [ ] Datos alineados con los mocks MSW
- [ ] `npm run e2e` en verde y **`npm run check` en verde** (skill `verify`)
