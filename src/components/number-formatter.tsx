import { formatUnits as baseFormatUnit } from "viem";

const formatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 3,
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
      {formatter.format(parseFloat(baseFormatUnit(BigInt(value), decimals)))}
    </span>
  );
}
