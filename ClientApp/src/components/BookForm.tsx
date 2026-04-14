import { type FormEvent, useReducer } from "react";
import { bookFormSchema, type Book, type BookFormRaw, type BookFormValues } from "../models";
import { bookToFormRaw, emptyFormRaw } from "../logic";
import { lookupBookByIsbn, formatAppError } from "../api/booksApi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FieldErrors = Partial<Record<keyof BookFormRaw, string>>;

type IsbnLookupState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string };

type Model = {
  readonly values: BookFormRaw;
  readonly errors: FieldErrors;
  readonly status: "idle" | "saving";
  readonly isbnLookup: IsbnLookupState;
};

type Msg =
  | { readonly type: "FieldChanged"; readonly field: keyof BookFormRaw; readonly value: string }
  | { readonly type: "ValidationFailed"; readonly errors: FieldErrors }
  | { readonly type: "SaveStarted" }
  | { readonly type: "SaveFinished" }
  | { readonly type: "IsbnLookupStarted" }
  | { readonly type: "IsbnLookupSucceeded"; readonly title: string; readonly description: string }
  | { readonly type: "IsbnLookupNotFound" }
  | { readonly type: "IsbnLookupFailed"; readonly message: string };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function update(model: Model, msg: Msg): Model {
  switch (msg.type) {
    case "FieldChanged":
      return {
        ...model,
        values: { ...model.values, [msg.field]: msg.value },
        errors: { ...model.errors, [msg.field]: undefined },
      };
    case "ValidationFailed":
      return { ...model, errors: msg.errors, status: "idle" };
    case "SaveStarted":
      return { ...model, errors: {}, status: "saving" };
    case "SaveFinished":
      return { ...model, status: "idle" };
    case "IsbnLookupStarted":
      return { ...model, isbnLookup: { status: "loading" } };
    case "IsbnLookupSucceeded":
      return {
        ...model,
        isbnLookup: { status: "idle" },
        values: {
          ...model.values,
          title: msg.title,
          description: msg.description,
        },
      };
    case "IsbnLookupNotFound":
      return { ...model, isbnLookup: { status: "error", message: "No book found for this ISBN." } };
    case "IsbnLookupFailed":
      return { ...model, isbnLookup: { status: "error", message: msg.message } };
  }
}

function initialModel(book: Book | undefined): Model {
  return {
    values: book ? bookToFormRaw(book) : emptyFormRaw(),
    errors: {},
    status: "idle",
    isbnLookup: { status: "idle" },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractZodErrors(schema: typeof bookFormSchema, raw: BookFormRaw): FieldErrors | null {
  const result = schema.safeParse(raw);
  if (result.success) return null;

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type FieldProps = {
  readonly label: string;
  readonly error?: string;
  readonly children: React.ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <div className="grid gap-1">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {error && <p className="text-red-400 text-sm" role="alert">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookForm
// ---------------------------------------------------------------------------

type BookFormProps = {
  readonly initialBook?: Book;
  readonly onSubmit: (values: BookFormValues) => Promise<void>;
  readonly submitText: string;
};

export default function BookForm({ initialBook, onSubmit, submitText }: BookFormProps) {
  const [model, dispatch] = useReducer(update, initialBook, initialModel);

  const { values, errors, status, isbnLookup } = model;
  const isSaving = status === "saving";
  const isLookingUp = isbnLookup.status === "loading";

  function field(name: keyof BookFormRaw) {
    return {
      value: values[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        dispatch({ type: "FieldChanged", field: name, value: e.target.value }),
    };
  }

  async function handleIsbnLookup() {
    dispatch({ type: "IsbnLookupStarted" });
    await lookupBookByIsbn(values.isbn).match(
      (book) => {
        dispatch({
          type: "IsbnLookupSucceeded",
          title: book.title ?? "",
          description: book.subtitle ?? "",
        });
      },
      (err) => {
        if (err.kind === "NotFound") {
          dispatch({ type: "IsbnLookupNotFound" });
        } else {
          dispatch({ type: "IsbnLookupFailed", message: formatAppError(err) });
        }
      },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = extractZodErrors(bookFormSchema, values);
    if (validationErrors) {
      dispatch({ type: "ValidationFailed", errors: validationErrors });
      return;
    }

    const parsed = bookFormSchema.parse(values);
    dispatch({ type: "SaveStarted" });
    await onSubmit(parsed);
    dispatch({ type: "SaveFinished" });
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
      <Field label="Title" error={errors.title}>
        <input aria-label="Title" className="border rounded p-2" {...field("title")} />
      </Field>

      <Field label="ISBN" error={errors.isbn}>
        <div className="flex gap-2">
          <input aria-label="ISBN" className="border rounded p-2 flex-1" {...field("isbn")} />
          <button
            type="button"
            aria-label="Lookup book by ISBN"
            className="border rounded px-3 py-2 text-sm whitespace-nowrap"
            onClick={handleIsbnLookup}
            disabled={!values.isbn || isLookingUp}
          >
            {isLookingUp ? "Looking up…" : "Lookup"}
          </button>
        </div>
        {isbnLookup.status === "error" && (
          <p className="text-amber-500 text-sm" role="status">{isbnLookup.message}</p>
        )}
      </Field>

      <Field label="Price" error={errors.price}>
        <input
          aria-label="Price"
          className="border rounded p-2"
          type="number"
          step="0.01"
          {...field("price")}
        />
      </Field>

      <Field label="Published Date" error={errors.publishedDate}>
        <input
          aria-label="Published Date"
          className="border rounded p-2"
          type="date"
          {...field("publishedDate")}
        />
      </Field>

      <Field label="Description" error={errors.description}>
        <textarea aria-label="Description" className="border rounded p-2" {...field("description")} />
      </Field>

      <Field label="Author First Name" error={errors.authorFirstName}>
        <input aria-label="Author First Name" className="border rounded p-2" {...field("authorFirstName")} />
      </Field>

      <Field label="Author Last Name" error={errors.authorLastName}>
        <input aria-label="Author Last Name" className="border rounded p-2" {...field("authorLastName")} />
      </Field>

      <Field label="Genres (comma-separated)" error={errors.genresCsv}>
        <input
          aria-label="Genres"
          className="border rounded p-2"
          placeholder="fantasy, fiction"
          {...field("genresCsv")}
        />
      </Field>

      <button className="bg-blue-600 px-4 py-2 rounded" type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : submitText}
      </button>
    </form>
  );
}
