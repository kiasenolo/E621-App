export interface RGBObject {
  r: number;
  g: number;
  b: number;
}

function isRGBObject(obj: any): obj is RGBObject {
  return typeof obj === 'object' && obj !== null
    && 'r' in obj && typeof obj.r === 'number'
    && 'g' in obj && typeof obj.g === 'number'
    && 'b' in obj && typeof obj.b === 'number';
}

function isHex(hex: any): hex is string {
  if (typeof hex !== 'string') return false;
  const regex = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
  return regex.test(hex);
}

function normalizeHex(hex: string) {
  let cleanHex = hex.replace('#', '').toLowerCase();

  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }

  return `#${cleanHex}`;
}

function hexToRgb(hex: string): RGBObject {
  const removePrefix = hex.replace(/^#|^0x/i, "");
  let fullHex: string = "";

  if (removePrefix.length === 3) {
    fullHex = removePrefix.split("").map(e => e + e).join("");
  } else if (removePrefix.length === 6) {
    fullHex = removePrefix;
  } else {
    return { r: 255, g: 255, b: 255 };
  }

  return {
    r: parseInt(fullHex.substring(0, 2), 16),
    g: parseInt(fullHex.substring(2, 4), 16),
    b: parseInt(fullHex.substring(4, 6), 16),
  };
}

function rgbToHex(color: RGBObject): string {
  const r = Math.min(255, Math.max(0, Math.round(color.r)));
  const g = Math.min(255, Math.max(0, Math.round(color.g)));
  const b = Math.min(255, Math.max(0, Math.round(color.b)));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function bright(color: string, multiplier: number): string
function bright(color: RGBObject, multiplier: number): RGBObject
function bright(color: string | RGBObject, multiplier: number): string | RGBObject {
  const shouldReturnHex = isHex(color);

  let rgb: RGBObject;
  if (shouldReturnHex) {
    rgb = hexToRgb(color as string);
  } else if (isRGBObject(color)) {
    rgb = color as RGBObject;
  } else {
    return color;
  }

  const adjusted: RGBObject = {
    r: Math.min(255, Math.max(0, Math.round(rgb.r * multiplier))),
    g: Math.min(255, Math.max(0, Math.round(rgb.g * multiplier))),
    b: Math.min(255, Math.max(0, Math.round(rgb.b * multiplier))),
  };

  return shouldReturnHex ? rgbToHex(adjusted) : adjusted;
}

type ColorOp = '+' | '-' | '*' | '/';

function mixColor(c1: string, op: ColorOp, c2: string | RGBObject, weight?: number): string;
function mixColor(c1: RGBObject, op: ColorOp, c2: string | RGBObject, weight?: number): RGBObject;
function mixColor(
  c1: string | RGBObject,
  op: ColorOp,
  c2: string | RGBObject,
  weight: number = 0.5
): string | RGBObject {
  const rgb1 = typeof c1 === "string" ? hexToRgb(c1) : c1;
  const rgb2 = typeof c2 === "string" ? hexToRgb(c2) : c2;

  const w = Math.min(1, Math.max(0, weight));

  const calculate = (v1: number, v2: number, operator: ColorOp): number => {
    let res: number;
    switch (operator) {
      case '+': res = v1 + v2; break;
      case '-': res = v1 - v2; break;
      case '*': res = v1 * v2; break;
      case '/': res = v2 === 0 ? 255 : v1 / v2; break;
      default: res = v1;
    }

    let finalValue: number;
    if (w <= 0.5) {
      const factor = w * 2;
      finalValue = v1 + (res - v1) * factor;
    } else {
      const factor = (w - 0.5) * 2;
      finalValue = res + (v2 - res) * factor;
    }

    return Math.min(255, Math.max(0, Math.round(finalValue)));
  };

  const mixedRGB: RGBObject = {
    r: calculate(rgb1.r, rgb2.r, op),
    g: calculate(rgb1.g, rgb2.g, op),
    b: calculate(rgb1.b, rgb2.b, op),
  };

  return typeof c1 === "string" ? rgbToHex(mixedRGB) : mixedRGB;
}

export default {
  isRGBObject,
  isHex,
  normalizeHex,
  hexToRgb,
  rgbToHex,
  bright,
  mixColor,
}
