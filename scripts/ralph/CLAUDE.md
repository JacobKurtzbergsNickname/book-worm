# Ralph Agent Instructions

You are an autonomous coding agent working through a structured product backlog one user story at a time.

## Your inputs

- `scripts/ralph/prd.json` — the full backlog. Each user story has `"passes": false` until you complete it.
- `scripts/ralph/progress.txt` — the append-only log of everything done so far. Read this first to understand what has already been implemented and what patterns have been established.

## Your job this iteration

1. **Read** `scripts/ralph/prd.json` and `scripts/ralph/progress.txt`.
2. **Find** the lowest-numbered user story where `"passes": false`. Work on exactly that one story — do not skip ahead.
3. **Explore** the codebase as needed to understand the relevant files before making any changes.
4. **Implement** the story so that every acceptance criterion is met.
5. **Run quality checks** (see below). All checks must pass before you commit anything.
6. **Update** `scripts/ralph/prd.json` — set `"passes": true` on the completed story.
7. **Commit** all changed files with a descriptive message that references the story ID (e.g. `feat: [US-001] OpenLibrary ISBN auto-fill`).
8. **Append** a summary to `scripts/ralph/progress.txt` (see format below).
9. **Check** if all stories now have `"passes": true`. If so, reply with `<promise>COMPLETE</promise>` as the final line of your output.

## Quality checks

Run these after implementing a story. Fix any failures before committing.

```bash
# Backend
dotnet build

# Frontend (includes TypeScript typecheck via tsc -b)
cd ClientApp && npm run build
```

If lint is relevant to your changes, also run:

```bash
cd ClientApp && npm run lint
```

## Codebase quick-reference

| Layer | Key files |
|---|---|
| Backend controller | `Controllers/BooksController.cs` |
| Backend service | `Services/BooksService.cs`, `Services/OpenLibraryService.cs` |
| DB entities | `Models/Entities/Book.cs`, `Author.cs`, `Genre.cs` |
| DTOs | `Dtos/BookReadDto.cs`, `Dtos/BookCreateDto.cs` |
| Mappings | `Mappings/MapsterConfig.cs` |
| DB context | `Data/AppDbContext.cs` |
| Migrations | `Migrations/` — generate with `dotnet ef migrations add <Name>` |
| Frontend models | `ClientApp/src/models/book.ts`, `author.ts` |
| Frontend API | `ClientApp/src/api/booksApi.ts` |
| Pages | `ClientApp/src/pages/BooksPage.tsx`, `BookDetailPage.tsx` |
| Components | `ClientApp/src/components/BookForm.tsx`, `BookshelfRoom.tsx`, `Header.tsx` |
| Form logic | `ClientApp/src/logic/books.ts` |

## Key architectural patterns (read before touching code)

- **Elm-style reducers**: `BooksPage` and `BookDetailPage` use `useReducer` with discriminated-union `Msg` types. When adding UI state changes, add a new `Msg` variant and handle it in the reducer.
- **Result error handling**: API calls use `neverthrow` — chain with `.match()` and return `ResultAsync`. Do not use `try/catch` for expected errors.
- **Form field pattern**: `BookForm.tsx` has a `Field` sub-component. Add new fields by composing it — do not introduce new input primitives.
- **Mapster mappings**: After changing a DTO or entity, check `MapsterConfig.cs` to see if any explicit mapping configuration needs updating.
- **No ISBN = no problem**: All book fields except `title` are optional. Do not add required-field constraints unless the acceptance criteria explicitly require them.
- **EF Core migrations**: Always run `dotnet ef migrations add <DescriptiveName>` and verify the generated migration file looks correct before committing.

## progress.txt append format

```
## [US-XXX] Story Title — YYYY-MM-DD

### What was done
- Bullet-point summary of files changed and why

### Learnings & gotchas
- Anything a future agent iteration should know to avoid mistakes
- Include specific file paths and line numbers where relevant

### Quality checks
- dotnet build: PASS
- npm run build: PASS

---
```

## Rules

- Work on **one story per iteration** — do not implement multiple stories in a single run.
- **Never overwrite** `progress.txt` — always append.
- **All commits must pass quality checks** — do not commit broken code.
- If a quality check fails and you cannot fix it, document the blocker in `progress.txt` and stop — do not mark the story as `passes: true`.
- Keep changes **minimal and focused** — only touch code required by the current story's acceptance criteria.
- Do **not** refactor surrounding code, add comments, or improve things beyond the story scope.
