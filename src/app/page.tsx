import Staking from "@/components/staking";

export default function Home() {
  const chainId = process.env.NEXT_PUBLIC_STAKING_CHAIN
    ? parseInt(process.env.NEXT_PUBLIC_STAKING_CHAIN, 10)
    : null;
  const address = process.env.NEXT_PUBLIC_STAKING_CONTRACT ?? "";
  if (!chainId) throw new Error("Missing staking chain ID");
  if (!address) throw new Error("Missing staking contract address");

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto text-center flex flex-col items-center">
          <Staking chainId={chainId} address={address} />
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Liteflow. All rights reserved.</p>
      </footer>
    </div>
  );
}
