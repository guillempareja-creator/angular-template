---
name: track-todos
description: >
  Use when adding a TODO comment to the code or when a task is identified as pending during code
  generation. ALWAYS invoke it after writing any TODO comment in any file (TypeScript, HTML, SCSS),
  and when a TODO is resolved. Also use when the user asks in Spanish to registrar un todo, apuntar una
  tarea pendiente, añadir al seguimiento, actualizar el fichero de todos or actualizar TODOS.md.
  Covers docs/project/TODOS.md: sections, row format with relative links and line numbers, status
  icons and the removal workflow when a TODO is resolved.
user-invocable: true
---

# Skill: Registrar TODOs en `docs/project/TODOS.md`

## 1. Cuándo usar esta skill

**Siempre** que se escriba un `// TODO` o `<!-- TODO -->` en cualquier fichero, o se identifique un
pendiente durante la generación de código, se actualiza
[`docs/project/TODOS.md`](../../../docs/project/TODOS.md) (crearlo si no existe). Un TODO en el
código sin su fila queda huérfano.

## 2. Secciones

Cada TODO va a la sección que le corresponde (se crea si no existe; se borra si queda vacía):

| Sección                         | Cuándo                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| **1. Pendiente de Backend**     | Espera un endpoint, un contrato, una URL o un dato que aún no existe |
| **2. Funcionalidades pendientes** | Lógica de negocio sin implementar                                 |
| **3. Fake Backend**             | Mock o handler MSW pendiente en `src/fake-backend/`                 |
| **4. Otros**                    | Lo que no encaje arriba (crear sección propia si el tema se repite) |

Un `// TODO` en un `.scss` que solo acompaña a un selector vacío **no se registra**; solo los que
describen el estilo concreto que falta.

## 3. Formato de la fila

```markdown
| ⏳ | [example.service.ts](../../src/app/core/api/example-api/example/example.service.ts#L42) | Descripción literal del TODO |
```

- **Estado**: `⏳` pendiente, `🚫` bloqueado por terceros.
- **Enlace**: ruta **relativa desde `docs/project/`** (empieza por `../../`) con la línea `#Lnnn`.
  Nunca rutas absolutas.
- **Descripción**: el texto del TODO sin el prefijo `TODO:`; si necesita contexto ("cuando backend
  publique X"), se añade.

## 4. Cuando un TODO se resuelve

`TODOS.md` solo contiene **pendientes vivos**; nunca se marcan filas como completadas:

1. Borrar la fila.
2. Borrar el comentario `// TODO` del código.
3. Si la sección queda vacía, borrarla.

Si se edita un TODO sin resolverlo, o se mueve de línea, se actualiza su fila: nunca filas apuntando
a líneas que ya no existen.

## Checklist

- [ ] Cada `// TODO` del código tiene su fila (y viceversa)
- [ ] Enlace relativo desde `docs/project/` con número de línea correcto
- [ ] TODOs resueltos eliminados del código y de la tabla
