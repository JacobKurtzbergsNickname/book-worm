import { navigateTo } from "./routing";

function Header() {
  return (
    <header id="header" className="border-b border-gray-700">
      <div className="mx-auto max-w-5xl p-4 flex items-center justify-between">
        <h1 className="text-3xl">Books, Books, Books Galore</h1>
        <nav className="flex gap-6">
          <a
            href="/"
            className="underline text-blue-300"
            onClick={(event) => {
              event.preventDefault();
              navigateTo("/");
            }}
          >
            Home
          </a>
          <a
            href="/bookshelf"
            className="underline text-blue-300"
            onClick={(event) => {
              event.preventDefault();
              navigateTo("/bookshelf");
            }}
          >
            My Shelf
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
