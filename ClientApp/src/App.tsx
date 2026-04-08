import { lazy, Suspense, useMemo, useSyncExternalStore } from "react";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";
import { Header } from "./components";

const BookshelfRoom = lazy(() => import("./components/BookshelfRoom"));

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

type Route =
  | { readonly type: "list" }
  | { readonly type: "detail"; readonly id: string }
  | { readonly type: "bookshelf" };

function matchRoute(path: string): Route {
  if (path === "/bookshelf") return { type: "bookshelf" };
  const detailMatch = path.match(/^\/books\/(\d+)$/);
  if (detailMatch) return { type: "detail", id: detailMatch[1]! };
  return { type: "list" };
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const path = useSyncExternalStore(
    (callback) => {
      window.addEventListener("popstate", callback);
      return () => window.removeEventListener("popstate", callback);
    },
    () => window.location.pathname,
  );

  const route = useMemo(() => matchRoute(path), [path]);

  return (
    <>
      <Header />
      {(() => {
        switch (route.type) {
          case "bookshelf":
            return (
              <Suspense fallback={<div>Loading bookshelf...</div>}>
                <BookshelfRoom />
              </Suspense>
            );
          case "detail":
            return <BookDetailPage id={route.id} />;
          case "list":
          default:
            return <BooksPage />;
        }
      })()}
    </>
  );
}
