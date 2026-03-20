import { useEffect, useMemo, useState } from "react";
import Header from "./Header";
import BooksPage from "./pages/BooksPage";
import BookDetailPage from "./pages/BookDetailPage";

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const match = useMemo(() => {
    const detailMatch = path.match(/^\/books\/(\d+)$/);
    if (detailMatch) {
      return { type: "detail" as const, id: detailMatch[1] };
    }
    return { type: "list" as const };
  }, [path]);

  return (
    <>
      <Header />
      {match.type === "detail" ? <BookDetailPage id={match.id} /> : <BooksPage />}
    </>
  );
}

export default App;
