export function strToBigInt(value: string, decimals: number = 18): bigint {
  if (!value) return BigInt(0);
  return BigInt(Math.floor(parseFloat(value) * 10 ** decimals));
}
