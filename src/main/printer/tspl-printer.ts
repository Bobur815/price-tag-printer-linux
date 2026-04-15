import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PrintItem {
  productNameRu?: string;
  productNameUz?: string;
  price: number;
  barcode?: string;
  unit?: string;
  productType?: string;
  articleId?: number;
  pluCode?: string;
  amount?: number;
  copies: number;
  productionDate?: string;
  expiryDate?: string;
}

export interface PrintJobRequest {
  printerName: string;
  items: PrintItem[];
  widthMm: number;
  heightMm: number;
  lang: string;
  fontSize: number;
  fontWeight: number;
  elements: {
    name: boolean;
    price: boolean;
    unit: boolean;
    barcode: boolean;
    articleId: boolean;
    pluCode: boolean;
    productionDate: boolean;
    expiryDate: boolean;
    customText1: boolean;
    customText2: boolean;
    customText1Value?: string;
    customText2Value?: string;
  };
}

// ── TSPL Font Specs ───────────────────────────────────────────────────────────

const DOTS_PER_MM = 8; // 203 DPI ≈ 8 dots/mm

interface FontSpec {
  id: string;
  charWidth: number;
  charHeight: number;
}

const TSPL_FONTS: FontSpec[] = [
  { id: '1', charWidth: 8,  charHeight: 12 },
  { id: '2', charWidth: 12, charHeight: 20 },
  { id: '3', charWidth: 16, charHeight: 24 },
  { id: '4', charWidth: 24, charHeight: 32 },
  { id: '5', charWidth: 32, charHeight: 48 },
];

function selectFont(sizePx: number): FontSpec {
  if (sizePx <= 10) return TSPL_FONTS[0];
  if (sizePx <= 13) return TSPL_FONTS[1];
  if (sizePx <= 16) return TSPL_FONTS[2];
  if (sizePx <= 20) return TSPL_FONTS[3];
  return TSPL_FONTS[4];
}

function smallerFont(f: FontSpec): FontSpec {
  return TSPL_FONTS[Math.max(0, TSPL_FONTS.indexOf(f) - 1)];
}

function largerFont(f: FontSpec): FontSpec {
  return TSPL_FONTS[Math.min(TSPL_FONTS.length - 1, TSPL_FONTS.indexOf(f) + 1)];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function mm(val: number): number {
  return Math.round(val * DOTS_PER_MM);
}

function esc(text: string): string {
  return text.replace(/"/g, '\\"').replace(/[\r\n]+/g, ' ').trim();
}

function truncate(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : text.substring(0, maxChars - 1) + '~';
}

function splitLines(text: string, maxChars: number, maxLines = 2): string[] {
  if (text.length <= maxChars) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (lines.length >= maxLines) break;
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = truncate(word, maxChars);
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  return lines.length > 0 ? lines : [truncate(text, maxChars)];
}

const EDGE_MARGIN = 6;  // dots (~0.75 mm) — prevents text being clipped at label edge
const LEFT_BIAS   = 24; // dots (~1.5 mm) — compensates for printer's right-side hardware offset

/** Center x position for a text string within the printable label width */
function centerX(text: string, font: FontSpec, labelWidth: number): number {
  const printable = labelWidth - EDGE_MARGIN * 2;
  const textWidth = text.length * font.charWidth;
  if (textWidth >= printable) return EDGE_MARGIN;
  return Math.max(EDGE_MARGIN, EDGE_MARGIN + Math.round((printable - textWidth) / 2) - LEFT_BIAS);
}

/** Max characters that fit within the printable width for a given font */
function maxChars(font: FontSpec, labelWidth: number): number {
  return Math.floor((labelWidth - EDGE_MARGIN * 2) / font.charWidth);
}

function formatPrice(price: number): string {
  return `${price.toLocaleString('ru-RU')} so'm`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const dd = d.getDate().toString().padStart(2, '0');
    const mm2 = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dd}.${mm2}.${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

/** Convert UTF-8 string to Windows-1251 Buffer for Cyrillic support */
function toWin1251(text: string): Buffer {
  const win1251Map: Record<number, number> = {
    0x0410: 0xC0, 0x0411: 0xC1, 0x0412: 0xC2, 0x0413: 0xC3, 0x0414: 0xC4,
    0x0415: 0xC5, 0x0416: 0xC6, 0x0417: 0xC7, 0x0418: 0xC8, 0x0419: 0xC9,
    0x041A: 0xCA, 0x041B: 0xCB, 0x041C: 0xCC, 0x041D: 0xCD, 0x041E: 0xCE,
    0x041F: 0xCF, 0x0420: 0xD0, 0x0421: 0xD1, 0x0422: 0xD2, 0x0423: 0xD3,
    0x0424: 0xD4, 0x0425: 0xD5, 0x0426: 0xD6, 0x0427: 0xD7, 0x0428: 0xD8,
    0x0429: 0xD9, 0x042A: 0xDA, 0x042B: 0xDB, 0x042C: 0xDC, 0x042D: 0xDD,
    0x042E: 0xDE, 0x042F: 0xDF,
    0x0430: 0xE0, 0x0431: 0xE1, 0x0432: 0xE2, 0x0433: 0xE3, 0x0434: 0xE4,
    0x0435: 0xE5, 0x0436: 0xE6, 0x0437: 0xE7, 0x0438: 0xE8, 0x0439: 0xE9,
    0x043A: 0xEA, 0x043B: 0xEB, 0x043C: 0xEC, 0x043D: 0xED, 0x043E: 0xEE,
    0x043F: 0xEF, 0x0440: 0xF0, 0x0441: 0xF1, 0x0442: 0xF2, 0x0443: 0xF3,
    0x0444: 0xF4, 0x0445: 0xF5, 0x0446: 0xF6, 0x0447: 0xF7, 0x0448: 0xF8,
    0x0449: 0xF9, 0x044A: 0xFA, 0x044B: 0xFB, 0x044C: 0xFC, 0x044D: 0xFD,
    0x044E: 0xFE, 0x044F: 0xFF,
    0x0401: 0xA8, 0x0451: 0xB8, // Ё ё
  };

  const bytes: number[] = [];
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0x3F;
    if (code < 0x80) {
      bytes.push(code);
    } else if (win1251Map[code] !== undefined) {
      bytes.push(win1251Map[code]);
    } else {
      bytes.push(0x3F); // '?' for unmapped characters
    }
  }
  return Buffer.from(bytes);
}

// ── Label Builder ─────────────────────────────────────────────────────────────

function buildOneLabelTSPL(item: PrintItem, req: Omit<PrintJobRequest, 'items' | 'printerName'>): string {
  const { widthMm, heightMm, lang, fontSize, elements } = req;
  const W = mm(widthMm);
  const H = mm(heightMm);
  const LINE_GAP = 8;

  const mainFont = selectFont(fontSize);
  const smallFont = smallerFont(mainFont);
  const largeFont = largerFont(mainFont);

  const mainMax = maxChars(mainFont, W);
  const smallMax = maxChars(smallFont, W);
  const largeMax = maxChars(largeFont, W);

  const cmds: string[] = [];
  cmds.push(`SIZE ${widthMm} mm, ${heightMm} mm`);
  cmds.push(`GAP 3 mm, 0 mm`);
  cmds.push(`CODEPAGE 1251`);
  cmds.push(`CLS`);

  let y = 8;
  const fits = (h: number) => y + h <= H - 8;

  const text = (str: string, font: FontSpec) => {
    const x = centerX(str, font, W);
    return `TEXT ${x},${y},"${font.id}",0,1,1,"${esc(str)}"`;
  };

  // Custom text 1
  if (elements.customText1 && elements.customText1Value) {
    const lineH = smallFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      cmds.push(text(truncate(elements.customText1Value, smallMax), smallFont));
      y += lineH;
    }
  }

  // Product name
  const name = lang === 'uz'
    ? (item.productNameUz || item.productNameRu || '')
    : (item.productNameRu || item.productNameUz || '');

  if (elements.name && name) {
    for (const line of splitLines(name, mainMax, 2)) {
      const lineH = mainFont.charHeight + LINE_GAP;
      if (!fits(lineH)) break;
      cmds.push(text(line, mainFont));
      y += lineH;
    }
  }

  // Unit / amount
  if (elements.unit && item.unit) {
    const lineH = smallFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      const amtStr = item.amount && item.amount !== 1 ? `${item.amount} ` : '';
      cmds.push(text(truncate(amtStr + item.unit, smallMax), smallFont));
      y += lineH;
    }
  }

  // PLU code
  if (elements.pluCode && item.pluCode) {
    const lineH = smallFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      cmds.push(text(truncate(`PLU: ${item.pluCode}`, smallMax), smallFont));
      y += lineH;
    }
  }

  // Article ID
  if (elements.articleId && item.articleId != null) {
    const lineH = smallFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      cmds.push(text(truncate(`KOD: ${item.articleId}`, smallMax), smallFont));
      y += lineH;
    }
  }

  // Production date
  if (elements.productionDate && item.productionDate) {
    const lineH = smallFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      cmds.push(text(formatDate(item.productionDate), smallFont));
      y += lineH;
    }
  }

  // Expiry date
  if (elements.expiryDate && item.expiryDate) {
    const lineH = smallFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      cmds.push(text(formatDate(item.expiryDate), smallFont));
      y += lineH;
    }
  }

  // Price — centered, large font
  if (elements.price) {
    const priceText = formatPrice(item.price);
    const lineH = largeFont.charHeight + LINE_GAP;
    if (fits(lineH)) {
      cmds.push(text(truncate(priceText, largeMax), largeFont));
      y += lineH;
    }
  }

  // Barcode — centered using printable width
  if (elements.barcode && item.barcode) {
    const printableW = W - EDGE_MARGIN * 2;
    const barcodeH = Math.min(60, H - y - 24);
    if (barcodeH >= 18) {
      // Code128: start(11) + n×char(11) + checksum(11) + stop(13) = 35 + 11×n modules
      const modules = 35 + 11 * item.barcode.length;
      // Find largest narrow width that fits within printable area
      const narrow = Math.max(1, Math.floor(printableW / modules));
      const barcodeW = modules * narrow;
      const barcodeX = Math.max(EDGE_MARGIN, EDGE_MARGIN + Math.round((printableW - barcodeW) / 2) - LEFT_BIAS);
      cmds.push(`BARCODE ${barcodeX},${y},"128",${barcodeH},1,0,${narrow},${narrow},"${esc(item.barcode)}"`);
      y += barcodeH + 24;
    }
  }

  // Custom text 2
  if (elements.customText2 && elements.customText2Value) {
    if (fits(smallFont.charHeight)) {
      cmds.push(text(truncate(elements.customText2Value, smallMax), smallFont));
    }
  }

  cmds.push(`PRINT ${item.copies},1`);
  return cmds.join('\r\n') + '\r\n';
}

// ── CUPS Printing ─────────────────────────────────────────────────────────────

function sendRawToPrinter(printerName: string, data: Buffer): void {
  const tmpFile = path.join(os.tmpdir(), `prtag_${Date.now()}.prn`);
  fs.writeFileSync(tmpFile, data);
  try {
    spawnSync('lp', ['-d', printerName, '-o', 'raw', tmpFile], { stdio: 'pipe' });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

// ── Main Export ───────────────────────────────────────────────────────────────

export async function printPriceTagsTSPL(req: PrintJobRequest): Promise<void> {
  if (!req.printerName) throw new Error('Printer name is required');
  if (!req.items || req.items.length === 0) throw new Error('No items to print');

  const { items, printerName, ...jobConfig } = req;
  const tspl = items.map((item) => buildOneLabelTSPL(item, jobConfig)).join('');

  // Encode as Windows-1251 for correct Cyrillic rendering on TSPL printers
  sendRawToPrinter(printerName, toWin1251(tspl));
}
