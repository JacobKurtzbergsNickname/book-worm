/**
 * SNES-RPG-style room background generator.
 *
 * Renders a 440×270 canvas (meant to be CSS-scaled 2× to 880×540 with
 * image-rendering:pixelated) inspired by Earthbound / Breath of Fire /
 * Final Fantasy VI interior aesthetics.
 *
 * Everything is hand-drawn with Canvas 2D so no external assets are needed.
 */

export const GW = 440;   // game-world width  (canvas pixels)
export const GH = 270;   // game-world height (canvas pixels)
export const FLOOR_H = 45;
export const SHELF_X = 26;
export const SHELF_W = GW - SHELF_X * 2; // 388
export const SHELF_T = 7;                 // shelf-board thickness (px)
export const BOOK_GAP = 2;
export const SHELF_ROWS = [90, 152, 214] as const; // board top y

// ── colour palette ────────────────────────────────────────────────────────────
// All values chosen from the SNES 15-bit palette range (0-248 per channel in
// steps of 8), giving an authentic look without post-process gradients.

const PAL = {
  // Wall  – warm cream, Earthbound-style
  WL: '#EDD99A',   // wall light
  WM: '#CCBC74',   // wall mid  / dot pattern
  WT: '#8A7230',   // wall trim (wainscoting top border)
  WW: '#C8AA5A',   // wallpaper dot
  WS: '#C0A048',   // wainscoting highlight line

  // Floor – wood planks
  FB: '#A86030',   // plank body
  FL: '#C87838',   // plank highlight (top edge)
  FD: '#5C3010',   // plank shadow  (bottom joint)
  FG: '#8C4E22',   // wood grain line

  // Shelf wood
  SH: '#D09050',   // shelf highlight
  SM: '#9C6830',   // shelf mid body
  SD: '#5A3418',   // shelf dark
  SS: '#3A2010',   // shelf shadow
  SG: '#6A4418',   // shelf grain line
  SB: '#5A3A1A',   // shelf back panel
  SK: '#3A2810',   // shelf back grain

  // Window
  WF: '#5A3418',   // frame wood
  WFH: '#8A5830',  // frame highlight
  WFK: '#2A1808',  // frame shadow
  WG1: '#B8E0FF',  // glass top
  WG2: '#F0F8FF',  // glass bottom
  WGH: '#FFFFFF',  // glass reflection
} as const;

// ── helpers ───────────────────────────────────────────────────────────────────
function fill(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ── wall ──────────────────────────────────────────────────────────────────────
function drawWall(ctx: CanvasRenderingContext2D) {
  const H = GH - FLOOR_H; // 225

  // Base cream
  fill(ctx, PAL.WL, 0, 0, GW, H);

  // Subtle horizontal grid – 1-px line every 16 rows
  ctx.fillStyle = PAL.WM;
  for (let y = 16; y < H; y += 16) ctx.fillRect(0, y - 1, GW, 1);

  // Wainscoting band (bottom 24 px of wall area)
  const wY = H - 24;
  fill(ctx, PAL.WM, 0, wY, GW, 24);
  fill(ctx, PAL.WT,  0, wY - 3, GW, 3);   // top border
  fill(ctx, PAL.WS,  0, wY - 4, GW, 1);   // highlight above border

  // Dot wallpaper – 2×2 px dots on an 8×8 grid, two offset rows
  ctx.fillStyle = PAL.WW;
  for (let y = 7; y < wY - 8; y += 16) {
    for (let x = 7; x < GW; x += 16) ctx.fillRect(x, y, 2, 2);
  }
  for (let y = 15; y < wY - 8; y += 16) {
    for (let x = 15; x < GW; x += 16) ctx.fillRect(x, y, 2, 2);
  }
}

// ── floor ─────────────────────────────────────────────────────────────────────
function drawFloor(ctx: CanvasRenderingContext2D) {
  const fy = GH - FLOOR_H;
  const PLANK = 16;

  fill(ctx, PAL.FB, 0, fy, GW, FLOOR_H);

  for (let row = 0; row < FLOOR_H; row += PLANK) {
    const py = fy + row;
    // plank top highlight
    fill(ctx, PAL.FL, 0, py, GW, 2);
    // bottom joint shadow
    fill(ctx, PAL.FD, 0, py + PLANK - 2, GW, 2);
    // wood grain (offset per plank row for variety)
    ctx.fillStyle = PAL.FG;
    const off = (row / PLANK) * 13;
    for (let x = 0; x < GW; x += 48) {
      const gx = (x + off) % GW;
      ctx.fillRect(gx, py + 5, 14, 1);
      ctx.fillRect((gx + 8) % GW, py + 9, 9, 1);
    }
  }
}

// ── shelf: horizontal board ───────────────────────────────────────────────────
function drawShelfBoard(ctx: CanvasRenderingContext2D, sy: number) {
  const x = SHELF_X;
  const W = SHELF_W;
  const T = SHELF_T;

  fill(ctx, PAL.SM, x, sy,     W, T);
  fill(ctx, PAL.SH, x, sy,     W, 1);           // top highlight line
  fill(ctx, PAL.SM, x, sy + 1, W, 2);           // lighter top band
  fill(ctx, PAL.SD, x, sy + T - 2, W, 2);       // bottom shadow
  // drop-shadow below board
  ctx.fillStyle = 'rgba(40,20,8,0.45)';
  ctx.fillRect(x, sy + T, W, 3);
  // grain
  ctx.fillStyle = PAL.SG;
  for (let gx = x + 20; gx < x + W; gx += 40) ctx.fillRect(gx, sy + 2, 1, T - 4);
}

// ── shelf: vertical side panel ────────────────────────────────────────────────
function drawShelfSide(ctx: CanvasRenderingContext2D, sx: number) {
  const topY = SHELF_ROWS[0];
  const botY = SHELF_ROWS[SHELF_ROWS.length - 1] + SHELF_T;
  const W = 10;
  const H = botY - topY;

  fill(ctx, PAL.SM, sx, topY, W, H);
  fill(ctx, PAL.SH, sx, topY, 2, H);        // left highlight
  fill(ctx, PAL.SM, sx + 2, topY, 1, H);
  fill(ctx, PAL.SD, sx + W - 2, topY, 2, H); // right shadow
  // grain
  ctx.fillStyle = PAL.SG;
  for (let gy = topY + 18; gy < botY; gy += 28) ctx.fillRect(sx + 2, gy, W - 4, 1);
}

// ── shelf: back panels (dark wood behind books) ───────────────────────────────
function drawShelfBacks(ctx: CanvasRenderingContext2D) {
  const zones: [number, number][] = [
    [50,           SHELF_ROWS[0]],
    [SHELF_ROWS[0] + SHELF_T, SHELF_ROWS[1]],
    [SHELF_ROWS[1] + SHELF_T, SHELF_ROWS[2]],
  ];

  for (const [y1, y2] of zones) {
    const h = y2 - y1;
    fill(ctx, PAL.SB, SHELF_X, y1, SHELF_W, h);
    // subtle vertical wood grain
    ctx.fillStyle = PAL.SK;
    for (let x = SHELF_X; x < SHELF_X + SHELF_W; x += 6) {
      for (let y = y1; y < y2; y += 8) {
        if ((x + y) % 5 === 0) ctx.fillRect(x, y, 1, 3);
      }
    }
  }
}

// ── window ────────────────────────────────────────────────────────────────────
function drawWindow(ctx: CanvasRenderingContext2D) {
  // Position: right side of wall, clear of bookshelves
  const wx = 358, wy = 18, wW = 54, wH = 62;
  const F = 5; // frame thickness

  // Glass gradient
  const grad = ctx.createLinearGradient(wx + F, wy + F, wx + F, wy + wH - F);
  grad.addColorStop(0,   PAL.WG1);
  grad.addColorStop(1,   PAL.WG2);
  ctx.fillStyle = grad;
  ctx.fillRect(wx + F, wy + F, wW - F * 2, wH - F * 2);

  // Curtain hints (soft warm tint on sides of glass)
  ctx.fillStyle = 'rgba(240,200,120,0.3)';
  ctx.fillRect(wx + F, wy + F, 6, wH - F * 2);
  ctx.fillRect(wx + wW - F - 6, wy + F, 6, wH - F * 2);

  // Frame: dark wood
  fill(ctx, PAL.WF, wx, wy,      wW, F);             // top
  fill(ctx, PAL.WF, wx, wy+wH-F, wW, F);             // bottom
  fill(ctx, PAL.WF, wx, wy,      F,  wH);             // left
  fill(ctx, PAL.WF, wx+wW-F, wy, F,  wH);             // right
  // cross-bar H
  fill(ctx, PAL.WF, wx+F, wy + Math.floor(wH/2)-1, wW-F*2, 3);
  // cross-bar V
  fill(ctx, PAL.WF, wx + Math.floor(wW/2)-1, wy+F, 3, wH-F*2);

  // Frame highlight (top-left edges)
  fill(ctx, PAL.WFH, wx, wy, wW, 1);
  fill(ctx, PAL.WFH, wx, wy, 1, wH);
  // Frame shadow (bottom-right edges)
  fill(ctx, PAL.WFK, wx, wy+wH-1, wW, 1);
  fill(ctx, PAL.WFK, wx+wW-1, wy, 1, wH);

  // Glass reflection (bright corner)
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(wx + F + 2, wy + F + 2, Math.floor((wW-F*2)*0.4), Math.floor((wH-F*2)*0.3));
}

// ── title text overlay ────────────────────────────────────────────────────────
// We draw a thin drop-shadow for the title so it stands out over the wallpaper.
// The actual text is rendered by Kaplay, but Kaplay can't do drop-shadows;
// instead we paint a translucent rectangle as a "title plaque" here.
function drawTitlePlaque(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(60,36,12,0.22)';
  ctx.fillRect(0, 0, GW, 14);
}

// ── floor/wall divider ────────────────────────────────────────────────────────
function drawDivider(ctx: CanvasRenderingContext2D) {
  fill(ctx, '#4A2C0C', 0, GH - FLOOR_H,     GW, 2);
  fill(ctx, '#6A4010', 0, GH - FLOOR_H - 1, GW, 1);  // highlight above
}

// ── public entry-point ────────────────────────────────────────────────────────
/**
 * Returns a 440×270 HTMLCanvasElement containing the static room background.
 * Pair with Kaplay at width=440, height=270 and CSS scale 2× +
 * image-rendering:pixelated for an authentic SNES appearance.
 */
export function buildRoomBackground(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width  = GW;
  canvas.height = GH;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  drawWall(ctx);
  drawFloor(ctx);
  drawDivider(ctx);
  drawWindow(ctx);
  drawShelfBacks(ctx);
  // Side panels drawn OVER backs
  drawShelfSide(ctx, SHELF_X - 11);
  drawShelfSide(ctx, SHELF_X + SHELF_W + 1);
  // Boards drawn last so they sit on top
  for (const sy of SHELF_ROWS) drawShelfBoard(ctx, sy);
  drawTitlePlaque(ctx);

  return canvas;
}
