import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import { getBooks } from "../api/booksApi";
import { navigateTo } from "../routing";

// Warm, varied book spine colors
const BOOK_COLORS: [number, number, number][] = [
  [178, 52,  38 ],
  [38,  92,  172],
  [52,  142, 52 ],
  [152, 112, 22 ],
  [118, 42,  152],
  [172, 102, 22 ],
  [42,  132, 132],
  [152, 72,  72 ],
  [52,  92,  142],
  [132, 152, 38 ],
  [172, 88,  38 ],
  [42,  112, 82 ],
];

const W = 880;
const H = 540;
const SHELF_X = 52;
const SHELF_W = W - SHELF_X * 2;
const SHELF_T = 14;
const BOOK_GAP = 3;

// Rows: shelf board y-position (books sit above)
const SHELF_ROWS = [188, 320, 452];

export default function BookshelfRoom() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const k = kaplay({
      root: container,
      width: W,
      height: H,
      background: [242, 232, 210] as [number, number, number],
      global: false,
      crisp: false,
    });

    let cancelled = false;

    // ── Loading scene ──────────────────────────────────────────────
    k.scene("loading", () => {
      // Wall
      k.add([k.rect(W, H - 90), k.pos(0, 0), k.color(235, 220, 195), k.fixed()]);
      // Floor
      k.add([k.rect(W, 90), k.pos(0, H - 90), k.color(118, 78, 32), k.fixed()]);
      k.add([k.rect(W, 5),  k.pos(0, H - 90), k.color(68, 42, 12),  k.fixed()]);

      k.add([
        k.text("Loading your library…", { size: 18 }),
        k.pos(W / 2, H / 2),
        k.anchor("center"),
        k.color(100, 68, 28),
        k.fixed(),
      ]);
    });

    k.go("loading");

    // ── Fetch books then build room ────────────────────────────────
    getBooks()
      .then((books) => {
        if (cancelled) return;

        k.scene("room", () => {
          // ── Background ──────────────────────────────────────────
          k.add([k.rect(W, H - 90), k.pos(0, 0), k.color(235, 220, 195), k.fixed()]);
          k.add([k.rect(W, 90), k.pos(0, H - 90), k.color(118, 78, 32),  k.fixed()]);
          k.add([k.rect(W, 5),  k.pos(0, H - 90), k.color(68, 42, 12),   k.fixed()]);

          // ── Window (decorative) ──────────────────────────────────
          // Glass pane
          k.add([k.rect(100, 125), k.pos(715, 42), k.color(168, 208, 248), k.fixed()]);
          // Frame top/bottom/left/right
          k.add([k.rect(108, 7), k.pos(711, 38),  k.color(98, 62, 28), k.fixed()]);
          k.add([k.rect(108, 7), k.pos(711, 160), k.color(98, 62, 28), k.fixed()]);
          k.add([k.rect(7, 132), k.pos(711, 38),  k.color(98, 62, 28), k.fixed()]);
          k.add([k.rect(7, 132), k.pos(812, 38),  k.color(98, 62, 28), k.fixed()]);
          // Window cross-bars
          k.add([k.rect(4, 125), k.pos(763, 42), k.color(98, 62, 28), k.fixed()]);
          k.add([k.rect(100, 4), k.pos(715, 104), k.color(98, 62, 28), k.fixed()]);

          // ── Shelf unit side supports ─────────────────────────────
          const supportTop = SHELF_ROWS[0];
          const supportBot = SHELF_ROWS[2] + SHELF_T;
          k.add([k.rect(12, supportBot - supportTop), k.pos(SHELF_X - 10, supportTop), k.color(92, 58, 22), k.fixed()]);
          k.add([k.rect(12, supportBot - supportTop), k.pos(SHELF_X + SHELF_W - 2, supportTop), k.color(92, 58, 22), k.fixed()]);

          // ── Shelves & books ──────────────────────────────────────
          let bookIndex = 0;

          for (const shelfY of SHELF_ROWS) {
            // Shelf board
            k.add([k.rect(SHELF_W, SHELF_T), k.pos(SHELF_X, shelfY), k.color(108, 70, 26), k.fixed()]);
            // Drop-shadow strip below board
            k.add([k.rect(SHELF_W, 5), k.pos(SHELF_X, shelfY + SHELF_T), k.color(58, 36, 10), k.opacity(0.45), k.fixed()]);

            let curX = SHELF_X + 8;
            const maxX = SHELF_X + SHELF_W - 8;

            while (bookIndex < books.length) {
              const book = books[bookIndex];

              // Deterministic pseudo-random dimensions keyed on book id
              const bookW = 26 + ((book.id * 7)  % 14); // 26–39 px
              const bookH = 60 + ((book.id * 11) % 30); // 60–89 px
              const bookX = curX;
              const bookY = shelfY - bookH;

              if (bookX + bookW > maxX) break;

              const [r, g, b] = BOOK_COLORS[book.id % BOOK_COLORS.length];

              // ── Spine body ────────────────────────────────────────
              const bookObj = k.add([
                k.rect(bookW, bookH),
                k.pos(bookX, bookY),
                k.color(r, g, b),
                k.area(),
                k.fixed(),
                "book",
              ]);

              // Spine top highlight
              k.add([
                k.rect(Math.max(2, bookW - 6), 5),
                k.pos(bookX + 3, bookY + 3),
                k.color(Math.min(255, r + 72), Math.min(255, g + 72), Math.min(255, b + 72)),
                k.opacity(0.45),
                k.fixed(),
              ]);

              // Page-edge strip on right
              k.add([
                k.rect(4, bookH - 4),
                k.pos(bookX + bookW - 6, bookY + 2),
                k.color(228, 218, 198),
                k.opacity(0.38),
                k.fixed(),
              ]);

              // ── Tooltip (hidden until hover) ──────────────────────
              const TTW = 205;
              const TTH = 82;

              const ttBg = k.add([
                k.rect(TTW, TTH),
                k.pos(0, 0),
                k.color(24, 14, 7),
                k.opacity(0),
                k.z(20),
                k.fixed(),
              ]);

              const ttText = k.add([
                k.text("", { size: 9, width: TTW - 18 }),
                k.pos(0, 0),
                k.color(238, 226, 208),
                k.opacity(0),
                k.z(21),
                k.fixed(),
              ]);

              const ttHint = k.add([
                k.text("click to open →", { size: 8 }),
                k.pos(0, 0),
                k.color(180, 158, 118),
                k.opacity(0),
                k.z(21),
                k.fixed(),
              ]);

              bookObj.onHover(() => {
                const ttx = Math.min(bookX, W - TTW - 10);
                const tty = Math.max(bookY - TTH - 8, 4);
                ttBg.pos   = k.vec2(ttx, tty);
                ttText.pos = k.vec2(ttx + 9, tty + 8);
                ttHint.pos = k.vec2(ttx + 9, tty + TTH - 18);
                ttBg.opacity   = 0.92;
                ttText.opacity = 1;
                ttHint.opacity = 1;

                const authorName = book.author
                  ? `${book.author.firstName} ${book.author.lastName}`
                  : "Unknown author";
                const genres = book.genres?.slice(0, 3).join(", ") ?? "";
                ttText.text =
                  `${book.title.slice(0, 38)}\n${authorName}` +
                  (genres ? `\n${genres}` : "");
              });

              bookObj.onHoverEnd(() => {
                ttBg.opacity   = 0;
                ttText.opacity = 0;
                ttHint.opacity = 0;
              });

              bookObj.onClick(() => navigateTo(`/books/${book.id}`));

              curX += bookW + BOOK_GAP;
              bookIndex++;
            }
          }

          // ── Room title ───────────────────────────────────────────
          k.add([
            k.text("My Library", { size: 28 }),
            k.pos(W / 2, 16),
            k.anchor("top"),
            k.color(78, 48, 16),
            k.fixed(),
          ]);

          // Overflow note if books were cut off
          if (bookIndex < books.length) {
            k.add([
              k.text(`(${books.length - bookIndex} more in your list)`, { size: 11 }),
              k.pos(W / 2, H - 82),
              k.anchor("center"),
              k.color(148, 108, 58),
              k.fixed(),
            ]);
          }

          // ── Empty state ──────────────────────────────────────────
          if (books.length === 0) {
            k.add([
              k.text("Your shelves are empty.\nAdd some books to fill them up!", {
                size: 16,
                align: "center",
              }),
              k.pos(W / 2, H / 2 - 30),
              k.anchor("center"),
              k.color(128, 98, 52),
              k.fixed(),
            ]);
          }
        });

        k.go("room");
      })
      .catch(() => {
        if (cancelled) return;
        k.scene("error", () => {
          k.add([k.rect(W, H - 90), k.pos(0, 0), k.color(235, 220, 195), k.fixed()]);
          k.add([k.rect(W, 90), k.pos(0, H - 90), k.color(118, 78, 32),  k.fixed()]);
          k.add([
            k.text("Could not load books.\nCheck your connection and try again.", {
              size: 16,
              align: "center",
            }),
            k.pos(W / 2, H / 2),
            k.anchor("center"),
            k.color(168, 48, 38),
            k.fixed(),
          ]);
        });
        k.go("error");
      });

    return () => {
      cancelled = true;
      k.quit();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ display: "flex", justifyContent: "center", width: "100%", maxWidth: W, margin: "0 auto" }}
    />
  );
}
