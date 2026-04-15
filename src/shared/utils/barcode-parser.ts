/**
 * Barcode parser utilities
 *
 * NOTE: If you have a main POS project, copy the actual barcode-parser.ts file from:
 * Source: src/shared/utils/barcode-parser.ts
 *
 * Below is a minimal implementation for barcode parsing.
 */

/**
 * Parse a scanned barcode string
 * Handles various barcode formats (EAN-13, Code128, etc.)
 */
export function parseBarcode(barcode: string): {
  code: string;
  type: string;
  valid: boolean;
} {
  if (!barcode || barcode.trim().length === 0) {
    return {
      code: '',
      type: 'unknown',
      valid: false,
    };
  }

  const cleaned = barcode.trim();

  // EAN-13 (13 digits)
  if (/^\d{13}$/.test(cleaned)) {
    return {
      code: cleaned,
      type: 'EAN-13',
      valid: validateEAN13(cleaned),
    };
  }

  // EAN-8 (8 digits)
  if (/^\d{8}$/.test(cleaned)) {
    return {
      code: cleaned,
      type: 'EAN-8',
      valid: true,
    };
  }

  // Code128 or other formats
  return {
    code: cleaned,
    type: 'Code128',
    valid: cleaned.length > 0,
  };
}

/**
 * Validate EAN-13 checksum
 */
function validateEAN13(code: string): boolean {
  if (code.length !== 13) return false;

  const digits = code.split('').map(Number);
  const checkDigit = digits.pop()!;

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const calculatedCheck = (10 - (sum % 10)) % 10;
  return calculatedCheck === checkDigit;
}

/**
 * Format barcode for display
 */
export function formatBarcodeForDisplay(barcode: string): string {
  const parsed = parseBarcode(barcode);
  if (!parsed.valid) return barcode;

  if (parsed.type === 'EAN-13') {
    // Format as: 123 4567 890123
    return parsed.code.replace(/(\d{3})(\d{4})(\d{6})/, '$1 $2 $3');
  }

  return parsed.code;
}

/**
 * Generate a random EAN-13 barcode (for testing)
 */
export function generateRandomEAN13(): string {
  const digits: number[] = [];

  // Generate 12 random digits
  for (let i = 0; i < 12; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }

  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return digits.join('') + checkDigit;
}
