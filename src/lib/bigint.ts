import { InvalidDecimalNumberError, parseUnits } from "viem";

export function strToBigInt(
  value: string,
  decimals: number
): bigint | undefined {
  try {
    return parseUnits(value, decimals);
  } catch (error) {
    if (error instanceof InvalidDecimalNumberError) return undefined;
    throw error;
  }
}
