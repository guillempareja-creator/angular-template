---
name: new-page
description: >
  Use when creating a new screen (page) or component in this Angular project, or a new business
  domain under pages/. Also use when the user asks in Spanish to crear una pantalla, crear una
  página, añadir una vista, crear un componente, nuevo dominio, nueva ruta, listado, detalle or
  formulario. Covers where the files go (vertical slices, lowest level possible), the strict
  component anatomy (inject, readonly signals, input/output, OnPush, section order), templates with
  ids, i18n and a11y, component SCSS with shared tokens, lazy routes with AppPath, the unit spec and
  the e2e spec of the new flow.
user-invocable: true
---

# Skill: Crear una pantalla o un componente

## 1. Cuándo usar esta skill

Al crear una pantalla, un componente o un dominio nuevo. Reglas y razones:
[`docs/architecture/overview.md`](../../../docs/architecture/overview.md) (dónde va cada cosa) y
[`docs/stack/angular.md`](../../../docs/stack/angular.md) (anatomía del componente).

## 2. Dónde va

| Qué                                              | Dónde                                             |
| ------------------------------------------------ | ------------------------------------------------- |
| Pantalla de un dominio                           | `pages/{domain}/{screen}/` (o `pages/{domain}/` si el dominio tiene una sola) |
| Componente que solo usa una pantalla             | `pages/{domain}/{screen}/components/{name}/`      |
| Componente compartido por pantallas del dominio  | `pages/{domain}/components/{name}/`               |
| Componente que usan 2+ dominios                  | `shared/components/{name}/`                       |

Cada componente en su carpeta: `{name}.component.ts`, `.html`, `.scss` y `.spec.ts`. Sin prefijos
redundantes (`components/form/`, no `expedient-form/`). Un dominio nunca importa otro.

## 3. Ejemplo: listado de expedientes (`pages/expedients/list/`)

Supone un servicio de API ya creado con la skill `api-endpoint`.

### `list.component.ts`

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnInit,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ExpedientsService } from '@core/api/main-api/expedients/expedients.service';
import type { Expedient } from '@core/api/main-api/expedients/expedients.types';

@Component({
  selector: 'app-expedients-list',
  imports: [TranslatePipe],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ListComponent implements OnInit {
  // Injections
  private expedientsService = inject(ExpedientsService);

  // Data
  public readonly expedients = signal<Expedient[]>([]);
  public readonly isLoaded = signal<boolean>(false);

  // Computeds
  public readonly hasExpedients = computed(() => this.expedients().length > 0);

  // Methods
  public ngOnInit(): void {
    void this.loadExpedients();
  }

  private async loadExpedients(): Promise<void> {
    const expedients = await this.expedientsService.getExpedients();
    this.expedients.set(expedients);
    this.isLoaded.set(true);
  }

  public handleRefresh(): void {
    void this.loadExpedients();
  }
}
```

- Secciones en orden estricto (`Injections` → `ViewChilds` → `Models` → `Inputs` → `Outputs` →
  `Data` → `Computeds` → `Effects` → `Methods`); solo las que se usan.
- `private` por defecto, `public` si lo usa la plantilla; signals `readonly`; páginas con
  `export default`; hooks nunca `async` (`void this.load()`).
- Componentes que no son página: `export class`, datos por `input()` y eventos por `output()`; no
  llaman a la API si el padre puede hacerlo.

### `list.component.html`

```html
<h1>{{ 'expedients.list.title' | translate }}</h1>

<div class="buttons-group">
  <button id="expedients-list-btn-refresh" type="button" (click)="handleRefresh()">
    {{ 'expedients.list.buttons.refresh' | translate }}
  </button>
</div>

@if (isLoaded()) {
  @if (hasExpedients()) {
    <table id="expedients-list-table-results">
      <thead>
        <tr>
          <th scope="col">{{ 'expedients.list.columns.number' | translate }}</th>
          <th scope="col">{{ 'expedients.list.columns.holder' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        @for (expedient of expedients(); track expedient.id) {
          <tr>
            <td>{{ expedient.number }}</td>
            <td>{{ expedient.holder }}</td>
          </tr>
        }
      </tbody>
    </table>
  } @else {
    <p>{{ 'expedients.list.noResults' | translate }}</p>
  }
} @else {
  <p>{{ 'expedients.list.loading' | translate }}</p>
}
```

- `id="{domain}-{component}-{type}-{element}"` en todo lo interactuable; `type` en los botones.
- Todo texto con `| translate` (claves en `es.json`, skill `i18n`); `@if`/`@for` con `track`.
- Condicionar con `isLoaded()`, nunca con el dato; derivados con `computed`, no en la plantilla.
- Clases globales de `src/styles/ui/` (`buttons-group`, `grid-template`…) se usan, no se redefinen.

### `list.component.scss`

```scss
@use 'imports' as *;

:host {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: $spacing-3xs $spacing-xs;
  text-align: left;
}

th {
  background-color: $color-primary-50;
}
```

Siempre tokens y mixins (`$spacing-*`, `$color-*`, `rem()`, `@include breakpoint(...)`); nada de
valores a pelo ni estilos inline.

### `list.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ExpedientsService } from '@core/api/main-api/expedients/expedients.service';
import ListComponent from './list.component';

describe('ListComponent', () => {
  const expedientsService = { getExpedients: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: ExpedientsService, useValue: expedientsService },
      ],
    });
  });

  async function render(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(ListComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders one row per expedient', async () => {
    expedientsService.getExpedients.mockResolvedValue([
      { id: 1, number: 'EXP-1', holder: 'Ana' },
      { id: 2, number: 'EXP-2', holder: 'Luis' },
    ]);

    const host = await render();

    expect(
      host.querySelectorAll('#expedients-list-table-results tbody tr'),
    ).toHaveLength(2);
  });

  it('shows the empty state when there are no expedients', async () => {
    expedientsService.getExpedients.mockResolvedValue([]);

    const host = await render();

    expect(host.textContent).toContain('expedients.list.noResults');
  });

  it('shows the loading text until the API answers', async () => {
    expedientsService.getExpedients.mockReturnValue(new Promise(() => undefined));

    const host = await render();

    expect(host.textContent).toContain('expedients.list.loading');
  });

  it('reloads the list on refresh', async () => {
    expedientsService.getExpedients.mockResolvedValue([]);
    const host = await render();

    host.querySelector<HTMLButtonElement>('#expedients-list-btn-refresh')?.click();

    expect(expedientsService.getExpedients).toHaveBeenCalledTimes(2);
  });
});
```

Más patrones (inputs, outputs, rutas, timers): skill `unit-testing`.

## 4. Ruta

1. Path en `AppPath` (`shared/enums/app-path.enum.ts`): `EXPEDIENTS = 'expedientes'`.
2. Dominio con varias pantallas → `pages/expedients/expedients.routes.ts`:

   ```typescript
   import type { Routes } from '@angular/router';

   const routes: Routes = [
     { path: '', loadComponent: () => import('./list/list.component') },
     { path: ':id', loadComponent: () => import('./detail/detail.component') },
   ];

   export default routes;
   ```

   y en `app.routes.ts`:
   `{ path: AppPath.EXPEDIENTS, loadChildren: () => import('./pages/expedients/expedients.routes') }`.
   Dominio de una sola pantalla → `loadComponent` directo en `app.routes.ts`.
3. Actualizar `app.routes.spec.ts` con la navegación nueva.

## 5. E2E del flujo

Todo flujo de usuario nuevo o modificado tiene su `e2e/{flujo}.spec.ts` contra los mocks MSW (skill
`e2e-testing`).

## Checklist

- [ ] Carpeta en el nivel más bajo posible; sin imports entre dominios
- [ ] Anatomía: orden de secciones, visibilidad, signals `readonly`, `inject()`, `OnPush`
- [ ] Plantilla con ids, `| translate`, `@if`/`@for`, accesibilidad (`type`, `alt`, `<label>`)
- [ ] SCSS con `@use 'imports' as *;` + `:host` y tokens
- [ ] Ruta lazy con `AppPath` + test de rutas
- [ ] Test unitario (cobertura por fichero) y e2e del flujo
- [ ] Claves en `es.json` (skill `i18n`)
- [ ] **`npm run check` en verde** (skill `verify`)
