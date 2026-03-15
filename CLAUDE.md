# CLAUDE.md — KirbysBooks

This file provides context for AI assistants working in this repository.

---

## Project Overview

**KirbysBooks** is a full-stack book management application with:
- **Backend**: ASP.NET Core 9.0 Web API (.NET 9.0)
- **Frontend**: React 19 + TypeScript + Vite (in `ClientApp/`)
- **Database**: PostgreSQL via Entity Framework Core 8

Users can create, read, update, and delete books, associate them with authors and genres, and look up books from the Open Library API by ISBN.

---

## Repository Structure

```
book-worm/
├── Controllers/          # ASP.NET Core API controllers
├── Models/               # EF Core entities + external API models
│   ├── Entities/         # Book, Author, Genre
│   ├── OpenLibrary/      # DTOs for Open Library API responses
│   └── Configuration/    # BookDatabaseSettings
├── Services/             # Business logic (BooksService, OpenLibraryService)
├── Interfaces/           # IBooksService, IOpenLibraryService
├── Dtos/                 # BookCreateDto, BookReadDto, AuthorReadDto
├── Mappings/             # Mapster configuration (MapsterConfig.cs)
├── Data/                 # AppDbContext (EF Core)
├── Migrations/           # EF Core database migrations
├── Extensions/           # LoggingExtensions (Serilog setup)
├── Properties/           # launchSettings.json
├── Postman/              # Postman collection for manual API testing
├── ClientApp/            # React frontend (separate npm project)
│   ├── src/
│   │   ├── api/          # booksApi.ts — Axios calls to /api/books
│   │   ├── pages/        # BooksPage.tsx, BookDetailPage.tsx
│   │   ├── components/   # BookForm.tsx
│   │   ├── types.ts      # Shared TypeScript types
│   │   ├── routing.ts    # navigateTo() helper (history API)
│   │   ├── App.tsx       # Client-side router
│   │   └── main.tsx      # Entry point
│   ├── tests/            # Playwright E2E tests
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.js
│   └── package.json
├── Program.cs            # App startup, DI, middleware
├── appsettings.json      # Base configuration (Serilog, empty connection string)
├── appsettings.Development.json
├── appsettings.Production.json
├── KirbysBooks.csproj    # .NET project file
├── run-dev.sh            # Linux/macOS dev startup script
└── run-dev.cmd           # Windows dev startup script
```

---

## Development Setup

### Prerequisites
- .NET 9 SDK
- Node.js 20+
- PostgreSQL running locally

### Database
Default connection string (set in `Program.cs` and overridable via `.env`):
```
Host=localhost;Database=KirbysBooks;Username=postgres;Password=postgres
```

Create a `.env` file at the repo root for local overrides (not committed):
```
ConnectionStrings__DefaultConnection=Host=...;Database=...;Username=...;Password=...
```

### Running in Development

**Option 1 — scripts:**
```bash
./run-dev.sh       # Linux/macOS
run-dev.cmd        # Windows
```

**Option 2 — manual:**
```bash
# Terminal 1: backend
dotnet run

# Terminal 2: frontend (hot reload)
cd ClientApp
npm install
npm run dev
```

Backend listens on `http://localhost:5012`.
Frontend dev server on `http://localhost:5173` and proxies `/api` → `http://localhost:5012`.

### Database Migrations
```bash
dotnet ef migrations add <MigrationName>
dotnet ef database update
```

---

## Build

The .NET build automatically triggers the frontend build via MSBuild target `BuildClientApp`, which runs `node scripts/manage_client_build.cjs` in the `ClientApp/` directory. The compiled Vite output is copied to `wwwroot/`.

To build the frontend independently:
```bash
cd ClientApp
npm run build    # runs: tsc -b && vite build
```

---

## API Reference

**Base path**: `/api/books`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/books` | List all books (includes author + genres) |
| GET | `/api/books/{id}` | Get book by ID |
| POST | `/api/books` | Create a new book |
| PUT | `/api/books/{id}` | Update an existing book |
| DELETE | `/api/books/{id}` | Delete a book |
| GET | `/api/books/openlibrary/{isbn}` | Look up a book on Open Library by ISBN |

**POST/PUT body shape** (`BookCreateDto`):
```json
{
  "title": "string",
  "isbn": "string (max 20)",
  "price": 0.00,
  "publishedDate": "2024-01-01",
  "description": "string",
  "author": {
    "firstName": "string",
    "lastName": "string",
    "birthDate": "1980-01-01"
  },
  "genre": ["Fiction", "Drama"]
}
```

---

## Data Model

### Entities

**Book**
`Id`, `ISBN` (max 20), `Title` (max 200), `AuthorId` (FK, nullable), `Price`, `PublishedDate`, `Description`, `CreatedAt`, `UpdatedAt`
→ belongs to one `Author`, has many `Genre` (many-to-many)

**Author**
`Id`, `FirstName`, `LastName`, `BirthDate`
→ has many `Book` (cascade delete)

**Genre**
`Id`, `Name`, `Description`, `SuperGenre`
→ has many `Book` (many-to-many via join table)

### Key Behaviors
- **Author deduplication**: `BooksService` checks for an existing author by first+last name before inserting a new one.
- **Genre recreation**: On update, the full genre collection is replaced.
- **Cascade delete**: Deleting an author deletes their books.

---

## Architecture Conventions

### Backend

- **DTOs**: Use `BookCreateDto` for writes and `BookReadDto` for reads. Never expose EF entities directly from controllers.
- **Mapping**: Use [Mapster](https://github.com/MapsterMapper/Mapster) configured in `Mappings/MapsterConfig.cs`. Do not use AutoMapper.
- **Services**: Business logic lives in `Services/`. Controllers are thin — they call services and return results.
- **Interfaces**: Every service has a matching interface in `Interfaces/`. Register both in `Program.cs` with DI.
- **Logging**: Use Serilog via `ILogger<T>` injection. Configuration is in `Extensions/LoggingExtensions.cs`.
- **Error handling**: Return appropriate HTTP status codes (`NotFound`, `BadRequest`, etc.) from controllers. Avoid swallowing exceptions.
- **EF Core**: Load related entities with `.Include()`. Use `AsNoTracking()` for read-only queries where performance matters.

### Frontend

- **API calls**: All HTTP calls go through `src/api/booksApi.ts` using a shared Axios instance. Do not call `fetch` directly.
- **Types**: Shared TypeScript types are in `src/types.ts`. Keep them in sync with backend DTOs.
- **Routing**: Uses a minimal history-API router (`src/routing.ts` + `src/App.tsx`). No React Router. Add routes by extending the `switch` in `App.tsx`.
- **Styling**: Tailwind CSS 4. Use utility classes; do not write custom CSS except in `src/index.css` for globals.
- **Forms**: Reuse `BookForm` component for both create and edit flows. It accepts an optional `book` prop to prefill.
- **State**: Local `useState` / `useEffect` only — no global state library.

---

## Testing

### E2E Tests (Playwright)
Located in `ClientApp/tests/`.

```bash
cd ClientApp
npm run test:e2e   # or: npx playwright test
```

Tests cover full CRUD flows and use route interception to mock API responses. Base URL: `http://127.0.0.1:4174`.

### Manual API Testing
A Postman collection is available at `Postman/KirbysBooks.postman_collection.json`.

---

## Key Dependencies

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Microsoft.EntityFrameworkCore | 8.0.8 | ORM |
| Npgsql.EntityFrameworkCore.PostgreSQL | 8.0.8 | PostgreSQL driver |
| Mapster | 7.4.0 | Object-to-object mapping |
| Serilog.AspNetCore | 7.0.0 | Structured logging |
| DotNetEnv | 3.1.1 | `.env` file loading |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.1.0 | UI framework |
| typescript | 5.8.3 | Type safety |
| vite | 7.0.4 | Build tool / dev server |
| tailwindcss | 4.1.11 | Styling |
| axios | 1.11.0 | HTTP client |
| @playwright/test | (latest) | E2E testing |

---

## External Integrations

- **Open Library API** (`https://openlibrary.org/`): Used by `OpenLibraryService` to fetch book metadata by ISBN. Handled with an `HttpClient` registered in DI. Returns `null` gracefully on 404.

---

## Environment & Configuration

| File | Purpose |
|------|---------|
| `appsettings.json` | Base config: Serilog sinks, empty connection string |
| `appsettings.Development.json` | Debug-level logging |
| `appsettings.Production.json` | Production logging overrides |
| `.env` (gitignored) | Local secrets / connection string override |

The app loads `.env` automatically in Development via `DotNetEnv` in `Program.cs`.

---

## What Does NOT Exist (yet)

- Authentication / authorization
- Unit tests for backend services
- Docker / docker-compose setup
- CI/CD pipeline (no `.github/workflows/`)
- Pagination or filtering on the books list endpoint
