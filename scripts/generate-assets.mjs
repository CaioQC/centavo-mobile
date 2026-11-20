// Gera o ícone, o ícone adaptativo, a splash e o favicon em assets/ (node scripts/generate-assets.mjs).
// Marca própria da identidade "Caderneta": um "C" branco (a moeda do centavo) sobre o azul `accent`.
// Sem dependências: desenha com supersampling e grava PNG com o zlib do Node.
import { Buffer } from 'node:buffer';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const ACCENT = [0x2f, 0x54, 0xeb];
const WHITE = [0xff, 0xff, 0xff];
const SAMPLES = 4;
const GAP_HALF_ANGLE = (42 * Math.PI) / 180; // abertura do "C", virada para a direita

/** Cobertura (0 ou 1) do "C" no ponto (x, y), com o centro em (cx, cy), raio médio `r` e traço `w`. */
function insideC(x, y, cx, cy, r, w) {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  if (Math.abs(dist - r) <= w / 2 && Math.abs(angle) >= GAP_HALF_ANGLE) return true;
  // pontas arredondadas nas duas extremidades do arco
  for (const sign of [1, -1]) {
    const ex = cx + r * Math.cos(sign * GAP_HALF_ANGLE);
    const ey = cy + r * Math.sin(sign * GAP_HALF_ANGLE);
    if (Math.hypot(x - ex, y - ey) <= w / 2) return true;
  }
  return false;
}

function insideRoundedRect(x, y, left, top, size, radius) {
  if (x < left || x > left + size || y < top || y > top + size) return false;
  const nx = Math.min(x - left, left + size - x);
  const ny = Math.min(y - top, top + size - y);
  if (nx >= radius || ny >= radius) return true;
  return Math.hypot(radius - nx, radius - ny) <= radius;
}

/** Renderiza `size` x `size` px; `shade(x, y)` devolve [r, g, b, a] (cor de 0 a 255, opacidade de 0 a 1) para um ponto. */
function render(size, shade) {
  const pixels = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const [cr, cg, cb, ca] = shade(px + (sx + 0.5) / SAMPLES, py + (sy + 0.5) / SAMPLES);
          // média ponderada pela opacidade, para as bordas não escurecerem
          r += cr * ca;
          g += cg * ca;
          b += cb * ca;
          a += ca;
        }
      }
      const i = (py * size + px) * 4;
      const n = SAMPLES * SAMPLES;
      if (a > 0) {
        pixels[i] = Math.round(r / a);
        pixels[i + 1] = Math.round(g / a);
        pixels[i + 2] = Math.round(b / a);
      }
      pixels[i + 3] = Math.round((a / n) * 255);
    }
  }
  return pixels;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits por canal
  header[9] = 6; // RGBA
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filtro "nenhum"
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
mkdirSync(outDir, { recursive: true });

function save(name, size, shade) {
  writeFileSync(join(outDir, name), encodePng(size, render(size, shade)));
  console.log(`assets/${name} (${size}x${size})`);
}

const S = 1024;
const C = S / 2;

// Ícone do app (iOS recorta os cantos sozinho): fundo azul cheio e o "C" grande.
save('icon.png', S, (x, y) => (insideC(x, y, C, C, 270, 130) ? [...WHITE, 1] : [...ACCENT, 1]));

// Primeiro plano do ícone adaptativo (Android): fundo transparente, "C" dentro dos 66% centrais da zona segura.
save('android-icon-foreground.png', S, (x, y) => (insideC(x, y, C, C, 200, 96) ? [...WHITE, 1] : [0, 0, 0, 0]));

// Splash: o mesmo quadrado arredondado azul da tela de desbloqueio, com o "C"; o fundo vem do app.json (claro e escuro).
save('splash-icon.png', S, (x, y) => {
  if (!insideRoundedRect(x, y, 152, 152, 720, 180)) return [0, 0, 0, 0];
  return insideC(x, y, C, C, 200, 96) ? [...WHITE, 1] : [...ACCENT, 1];
});

// Favicon da versão web.
save('favicon.png', 48, (x, y) => {
  const k = 48 / S;
  return insideC(x / k, y / k, C, C, 270, 130) ? [...WHITE, 1] : [...ACCENT, 1];
});
