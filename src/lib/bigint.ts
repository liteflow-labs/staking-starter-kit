import { InvalidDecimalNumberError, parseUnits } from "viem";

export function strToBigInt(value: string, decimals: number = 18): bigint {
  try {
    return parseUnits(value, decimals);
  } catch (error) {
    if (error instanceof InvalidDecimalNumberError) return BigInt(0);
    throw error;
  }
}
