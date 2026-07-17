const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
const VALID_PREFIXES = ["10", "15", "16", "17", "20"];

export function isValidRuc(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false;
  if (!VALID_PREFIXES.includes(ruc.slice(0, 2))) return false;
  const digits = ruc.split("").map(Number);
  const sum = WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0);
  let d = 11 - (sum % 11);
  if (d === 10) d = 0;
  if (d === 11) d = 1;
  return d === digits[10];
}
