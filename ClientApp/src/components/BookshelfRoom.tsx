import { useEffect, useRef } from "react";
import kaplay from "kaplay";
import { getBooks } from "../api/booksApi";
import { navigateTo } from "../routing";
import {
  buildRoomBackground,
  GW, GH,
  SHELF_X, SHELF_W, SHELF_T, SHELF_ROWS, BOOK_GAP,
} from "./snesRoom";

// ── SNES book-spine palette ───────────────────────────────────────────────────
// Vibrant colours typical of SNES RPG item/book graphics.
const BOOK_COLORS: [number, number, number][] = [
  [200,  40,  40],  // red
  [ 40,  72, 200],  // blue
  [ 40, 120,  60],  // green
  [200, 160,  32],  // yellow
  [104,  32, 168],  // purple
  [ 32, 112, 160],  // teal
  [200,  96,  32],  // orange
  [120,  48,  40],  // dark red
  [ 32, 120, 120],  // dark teal
  [160, 140,  40],  // olive
  [168,  60,  96],  // pink
  [ 60,  80, 160],  // slate blue
];

// Slightly lighter highlight per colour (top 2px of spine)
const BOOK_HI: [number, number, number][] = BOOK_COLORS.map(
  ([r, g, b]) => [Math.min(255, r + 64), Math.min(255, g + 64), Math.min(255, b + 64)],
);

// Page-edge colour (right side of each book)
const PAGE: [number, number, number] = [240, 228, 200];

export default function BookshelfRoom() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Build the SNES room background BEFORE Kaplay starts ─────────────────
    const bgCanvas = buildRoomBackground();

    // ── Kaplay at SNES resolution; CSS doubles it to 880×540 ────────────────
    const k = kaplay({
      canvas,
      width:  GW,
      height: GH,
      background: [237, 217, 154] as [number, number, number], // matches wall colour
      global: false,
      crisp: true,          // pixel-perfect rendering
    });

    let cancelled = false;

    // ── Loading scene ────────────────────────────────────────────────────────
    k.scene("loading", () => {
      // Draw the background so it looks nice even while loading
      k.add([k.sprite("bg"), k.pos(0, 0), k.fixed()]);
      k.add([
        k.text("Loading...", { size: 8 }),
        k.pos(GW / 2, GH / 2),
        k.anchor("center"),
        k.color(80, 50, 14),
        k.fixed(),
      ]);
    });

    // Load background sprite then go to loading scene
    k.loadSprite("bg", bgCanvas).onLoad(() => {
      if (!cancelled) k.go("loading");
    });

    // ── Fetch books ──────────────────────────────────────────────────────────
    getBooks()
      .then((books) => {
        if (cancelled) return;

        k.scene("room", () => {
          // Static background
          k.add([k.sprite("bg"), k.pos(0, 0), k.fixed()]);

          // ── Room title ─────────────────────────────────────────────────────
          // Shadow layer (1px offset, dark brown) then main text
          k.add([
            k.text("My Library", { size: 9 }),
            k.pos(GW / 2 + 1, 3),
            k.anchor("top"),
            k.color(40, 24, 6),
            k.opacity(0.6),
            k.fixed(),
          ]);
          k.add([
            k.text("My Library", { size: 9 }),
            k.pos(GW / 2, 2),
            k.anchor("top"),
            k.color(248, 224, 128),
            k.fixed(),
          ]);

          // ── Books ──────────────────────────────────────────────────────────
          let bookIdx = 0;

          for (const shelfY of SHELF_ROWS) {
            let curX = SHELF_X + 4;
            const maxX = SHELF_X + SHELF_W - 4;

            while (bookIdx < books.length) {
              const book = books[bookIdx];

              // Pseudo-random but deterministic book dimensions
              const bookW = 13 + ((book.id * 7)  % 7);  // 13–19 px
              const bookH = 30 + ((book.id * 11) % 15); // 30–44 px
              const bookX = curX;
              const bookY = shelfY - bookH;

              if (bookX + bookW > maxX) break;

              const ci = book.id % BOOK_COLORS.length;
              const [r, g, b] = BOOK_COLORS[ci];
              const [hr, hg, hb] = BOOK_HI[ci];

              // ── Spine body ────────────────────────────────────────────────
              const spine = k.add([
                k.rect(bookW, bookH),
                k.pos(bookX, bookY),
                k.color(r, g, b),
                k.area(),
                k.fixed(),
                "book",
              ]);

              // Spine top highlight (2px)
              k.add([
                k.rect(bookW, 2),
                k.pos(bookX, bookY),
                k.color(hr, hg, hb),
                k.fixed(),
              ]);

              // Bottom shadow (2px)
              k.add([
                k.rect(bookW, 2),
                k.pos(bookX, bookY + bookH - 2),
                k.color(
                  Math.max(0, r - 60),
                  Math.max(0, g - 60),
                  Math.max(0, b - 60),
                ),
                k.fixed(),
              ]);

              // Page edge (right side, 3px)
              k.add([
                k.rect(3, bookH - 4),
                k.pos(bookX + bookW - 3, bookY + 2),
                k.color(...PAGE),
                k.opacity(0.55),
                k.fixed(),
              ]);

              // ── SNES-style dialog tooltip (hidden until hover) ────────────
              const TTW = 110;
              const TTH = 44;

              // Outer box (dark)
              const ttOuter = k.add([
                k.rect(TTW, TTH),
                k.pos(0, 0),
                k.color(16, 8, 4),
                k.outline(2, k.rgb(216, 196, 144)),
                k.opacity(0),
                k.z(20),
                k.fixed(),
              ]);

              const ttTitle = k.add([
                k.text("", { size: 7, width: TTW - 12 }),
                k.pos(0, 0),
                k.color(248, 224, 128),
                k.opacity(0),
                k.z(21),
                k.fixed(),
              ]);

              const ttSub = k.add([
                k.text("", { size: 6, width: TTW - 12 }),
                k.pos(0, 0),
                k.color(196, 180, 136),
                k.opacity(0),
                k.z(21),
                k.fixed(),
              ]);

              const ttPrompt = k.add([
                k.text("▶ Open", { size: 6 }),
                k.pos(0, 0),
                k.color(160, 220, 160),
                k.opacity(0),
                k.z(21),
                k.fixed(),
              ]);

              function showTip() {
                const ttx = Math.min(bookX, GW - TTW - 4);
                const tty = Math.max(bookY - TTH - 4, 2);
                ttOuter.pos  = k.vec2(ttx, tty);
                ttTitle.pos  = k.vec2(ttx + 5, tty + 4);
                ttSub.pos    = k.vec2(ttx + 5, tty + 14);
                ttPrompt.pos = k.vec2(ttx + 5, tty + TTH - 12);

                ttOuter.opacity  = 0.96;
                ttTitle.opacity  = 1;
                ttSub.opacity    = 1;
                ttPrompt.opacity = 1;

                ttTitle.text = book.title.length > 20
                  ? book.title.slice(0, 18) + "…"
                  : book.title;

                const author = book.author
                  ? `${book.author.firstName} ${book.author.lastName}`
                  : "Unknown";
                const genre = book.genres?.slice(0, 2).join("/") ?? "";
                ttSub.text = genre ? `${author}\n${genre}` : author;
              }

              function hideTip() {
                ttOuter.opacity  = 0;
                ttTitle.opacity  = 0;
                ttSub.opacity    = 0;
                ttPrompt.opacity = 0;
              }

              spine.onHover(showTip);
              spine.onHoverEnd(hideTip);
              spine.onClick(() => navigateTo(`/books/${book.id}`));

              curX += bookW + BOOK_GAP;
              bookIdx++;
            }
          }

          // ── Overflow note ──────────────────────────────────────────────────
          if (bookIdx < books.length) {
            k.add([
              k.text(`(${books.length - bookIdx} more books in list)`, { size: 6 }),
              k.pos(GW / 2, GH - SHELF_T - 6),
              k.anchor("center"),
              k.color(192, 160, 88),
              k.fixed(),
            ]);
          }

          // ── Empty state ────────────────────────────────────────────────────
          if (books.length === 0) {
            k.add([
              k.text("Your shelves are empty!\nAdd books to fill them.", {
                size: 8,
                align: "center",
              }),
              k.pos(GW / 2, GH / 2 - 16),
              k.anchor("center"),
              k.color(148, 112, 48),
              k.fixed(),
            ]);
          }
        });

        k.go("room");
      })
      .catch(() => {
        if (cancelled) return;
        k.scene("error", () => {
          k.add([k.sprite("bg"), k.pos(0, 0), k.fixed()]);
          k.add([
            k.text("Could not load books.\nCheck your connection.", {
              size: 8,
              align: "center",
            }),
            k.pos(GW / 2, GH / 2),
            k.anchor("center"),
            k.color(200, 48, 38),
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
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "1rem",
        width: "100%",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          // CSS doubles the 440×270 canvas to 880×540 when space allows; scales down on smaller screens
          width: "100%",
          maxWidth: GW * 2,
          aspectRatio: `${GW} / ${GH}`,
          height: "auto",
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </div>
  );
}
