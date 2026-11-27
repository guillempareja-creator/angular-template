---
name: create-skill
description: >
  Use when the user wants to create a new local skill for this project or turn a repeatable
  procedure into one. Also use when the user asks in Spanish to crear una skill, añadir una skill,
  nueva skill, hacer una skill or empaquetar un procedimiento. Covers the location
  .claude/skills/{name}/SKILL.md (read natively by GitHub Copilot and Claude Code), the frontmatter
  (name, description with Spanish keywords, user-invocable), the body structure with real code
  from the repo, and the mandatory row in .claude/skills/README.md and in the AGENTS.md skills table.
user-invocable: true
---

# Skill: Crear una skill local

## 1. Cuándo usar esta skill

Cuando un **procedimiento paso a paso** se repite (crear algo, migrar algo, depurar algo) y merece
una guía que la IA cargue solo cuando la tarea lo pida. Antes, comprobar el orden de
[`docs/ai/workflow.md`](../../../docs/ai/workflow.md) §3: si la regla se puede **automatizar** (lint,
test, hook), se automatiza; si es **detalle de referencia**, va a `docs/`; las skills son para
procedimientos.

## 2. Ubicación

```
.claude/skills/
├── README.md              ← índice (fila obligatoria)
└── {nombre-skill}/
    ├── SKILL.md           ← nombre exacto
    └── (opcional) plantillas, ejemplos o scripts que el SKILL.md enlaza
```

`.claude/skills/` es la carpeta que leen de forma nativa **GitHub Copilot** (VS Code, CLI, agente
cloud) y **Claude Code**: no se crean copias en otras carpetas. Nombre de carpeta en kebab-case e
inglés, igual que el `name` del frontmatter.

## 3. Frontmatter

```yaml
---
name: form-submit
description: >
  Use when a reactive form must be validated and submitted. Also use when the user asks in Spanish
  to enviar un formulario, validar un formulario, guardar un formulario or foco en el primer error.
  Covers markAllAsTouched, focusing the first invalid control and the early-return save flow.
user-invocable: true
---
```

- `name`: igual que la carpeta.
- `description`: lo que usa la IA para decidir si carga la skill. En inglés, empezando por
  "Use when…", con **palabras clave en español** que diría el usuario y lo que cubre. Máximo 1024
  caracteres.
- `user-invocable: true`: siempre (se puede invocar con `/nombre`).

## 4. Cuerpo

```markdown
# Skill: {Nombre legible}

## 1. Cuándo usar esta skill
Contexto breve y enlace al documento de `docs/` con las reglas y razones.

## 2. Pasos / patrón principal
Código real y completo del propio proyecto (nunca pseudocódigo).

## 3. Reglas clave
Solo las decisiones propias de este procedimiento.

## Checklist
- [ ] …
- [ ] **`npm run check` en verde** (skill `verify`)
```

- **Concisa**: una skill larga que nadie lee vale menos que una corta y precisa.
- **Sin repetir** lo que ya está en `AGENTS.md` o `docs/`: se enlaza (rutas relativas desde el
  `SKILL.md`: la raíz del repo es `../../../`).
- Los ejemplos de código deben **compilar y pasar los gates** tal cual (pruébalos aplicándolos en el
  repo y revirtiendo).
- Comentarios del código en inglés; textos de la skill en español.

## 5. Registrar la skill — OBLIGATORIO

1. Fila en `.claude/skills/README.md`: `` | `{nombre}` | qué hace, qué genera, cuándo usarla | ``.
2. Fila en la tabla "Skills" de `AGENTS.md` si es una tarea frecuente.

## Checklist

- [ ] Procedimiento (no automatizable ni mero detalle de referencia)
- [ ] `.claude/skills/{nombre}/SKILL.md` con `name`, `description` (con palabras clave en español) y `user-invocable: true`
- [ ] Código real que pasa los gates; enlaces a `docs/` en vez de repetir reglas
- [ ] Fila en `.claude/skills/README.md` (y en `AGENTS.md` si aplica)
