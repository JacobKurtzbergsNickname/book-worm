import { useEffect, useMemo, useState } from "react";
import { Header } from "./components";
import { BookDetailPage, BooksPage } from "./pages";

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

type Route =
  | { readonly type: "list" }
  | { readonly type: "detail"; readonly id: string };

function matchRoute(path: string): Route {
  const detailMatch = path.match(/^\/books\/(\d+)$/);
  if (detailMatch) return { type: "detail", id: detailMatch[1]! };
  return { type: "list" };
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const route = useMemo(() => matchRoute(path), [path]);

  return (
    <>
      <Header />
      {route.type === "detail"
        ? <BookDetailPage id={route.id} />
        : <BooksPage />}
    </>
  );
}
