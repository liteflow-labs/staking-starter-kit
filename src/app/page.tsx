import Staking from "@/components/staking";

export default function Home() {
  const chainId = process.env.NEXT_PUBLIC_STAKING_CHAIN
    ? parseInt(process.env.NEXT_PUBLIC_STAKING_CHAIN, 10)
    : null;
  const address = process.env.NEXT_PUBLIC_STAKING_CONTRACT ?? "";
  if (!chainId) throw new Error("Missing staking chain ID");
  if (!address) throw new Error("Missing staking contract address");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
      <Staking chainId={chainId} address={address} />
    </div>
  );
}
