---
name: i18n
description: >
  Use when adding, updating or reviewing any user-visible text: labels, titles, placeholders,
  button texts, aria-labels, alt texts, table headers, modal texts, validation or notification
  messages. Also use when the user asks in Spanish about traducciones, i18n, internacionalización,
  textos traducibles, claves de traducción, añadir texto, cambiar un texto visible, etiquetas,
  títulos or mensajes. Covers the key convention {domain}.{component}.{grupo}.{clave}, the JSON in
  src/assets/i18n/es.json, common.* for shared actions, TranslatePipe in templates, the typed
  translateText() helper in TypeScript and how to assert texts in unit and e2e tests.
user-invocable: true
---

# Skill: Textos visibles (i18n)

## 1. Cuándo usar esta skill

Siempre que aparezca texto visible para el usuario, incluidos `placeholder`, `aria-label`, `alt`,
`title` y mensajes. **Cero texto hardcodeado** en plantillas o TypeScript. Reglas y razones:
[`docs/architecture/i18n.md`](../../../docs/architecture/i18n.md).

Stack (Angular): `@ngx-translate/core` + `http-loader`, configurado en `provideI18n()`
(`core/i18n/i18n.providers.ts`), que carga `./assets/i18n/es.json` y bloquea el primer render hasta
tener las traducciones.

## 2. Claves (`src/assets/i18n/es.json`)

```json
{
  "common": { "accept": "Aceptar", "cancel": "Cancelar", "close": "Cerrar" },
  "app": { "name": "App Template" },
  "main": {
    "welcomeMessage": "¡Hola! Bienvenido a {{appName}}",
    "exampleTitle": "Llamada de ejemplo a la API",
    "exampleLoading": "Cargando…"
  },
  "expedients": {
    "list": {
      "title": "Expedientes",
      "columns": { "number": "Número", "holder": "Titular" },
      "noResults": "No hay expedientes"
    }
  }
}
```

- Formato `{domain}.{component}.{grupo}.{clave}`, solo los niveles necesarios; claves en inglés y
  camelCase, valores en español; interpolación `{{param}}`.
- `common.*` para acciones compartidas: **reutilizar antes de crear**.
- Componentes de `shared/` usan su nombre como raíz (`header.*`).
- Al borrar un componente o dominio, borrar sus claves.

## 3. En plantillas

```html
<h1>{{ 'main.welcomeMessage' | translate: { appName: 'app.name' | translate } }}</h1>

<input
  id="expedients-list-input-search"
  type="search"
  [placeholder]="'expedients.list.searchPlaceholder' | translate"
/>

<button id="expedients-list-btn-close" type="button" [attr.aria-label]="'common.close' | translate">
  &times;
</button>
```

- El componente importa `TranslatePipe` de `@ngx-translate/core` (solo si la plantilla lo usa).
- En atributos, siempre _binding_ (`[placeholder]="… | translate"`): ESLint prohíbe la
  interpolación en atributos.

## 4. En TypeScript: `translateText()`

`TranslateService.instant()` devuelve `any` (prohibido por el lint estricto). Usa siempre el helper
tipado de `@shared/utils/i18n.utils`, que devuelve `string` (la clave si falta la traducción):

```typescript
// Injections
private translate = inject(TranslateService);

// Data
public readonly columns = [
  { field: 'number', header: translateText(this.translate, 'expedients.list.columns.number') },
  { field: 'holder', header: translateText(this.translate, 'expedients.list.columns.holder') },
];
```

## 5. Tests

- **Unitarios**: `provideTranslateService()` sin cargador → el pipe y `translateText()` devuelven
  la **clave**: se aserta `'main.exampleLoading'`, no el texto.
- **E2E**: ven el texto real en español (`page.getByText('Llamada de ejemplo a la API')`).

## Checklist

- [ ] Ningún texto visible hardcodeado (incluye `placeholder`, `aria-label`, `alt`, mensajes)
- [ ] Claves con la convención, en camelCase, en `es.json`; `common.*` reutilizado
- [ ] `| translate` en plantillas (binding en atributos) y `translateText()` en TS
- [ ] Claves huérfanas eliminadas
- [ ] **`npm run check` en verde** (skill `verify`)
