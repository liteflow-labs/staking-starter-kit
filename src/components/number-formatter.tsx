import { formatUnits as baseFormatUnit, maxUint256 } from "viem";

const formatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 4,
});

export function NumberFormatter({
  value,
  decimals = 0,
}: {
  value: number | bigint | string | null | undefined;
  decimals?: number;
}) {
  if (value === null) return "--";
  if (value === undefined) return "--";
  return (
    <span title={value.toString()} className="font-mono">
      {BigInt(value) === maxUint256 ? (
        <>&infin;</>
      ) : (
        formatter.format(parseFloat(baseFormatUnit(BigInt(value), decimals)))
      )}
    </span>
  );
}
