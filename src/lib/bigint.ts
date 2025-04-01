import { parseUnits } from "viem";

export function strToBigInt(value: string, decimals: number = 18): bigint {
  if (!value) return BigInt(0);
  return parseUnits(Number(value).toFixed(decimals), decimals);
}
