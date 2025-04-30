import Staking from "@/components/staking";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import liteflow from "@/lib/liteflow";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";

export default async function Home() {
  const chainId = process.env.NEXT_PUBLIC_STAKING_CHAIN
    ? parseInt(process.env.NEXT_PUBLIC_STAKING_CHAIN, 10)
    : null;
  if (!chainId) throw new Error("Missing staking chain ID");

  const res = await liteflow.staking.list({
    chain: chainId,
  });
  const stakings = res.data?.data.toSorted(
    (a, b) => Number(a.lockPeriod) - Number(b.lockPeriod)
  );

  const id = (staking: GetStakingsByChainIdByAddressResponse) =>
    [staking.chainId.toString(), staking.contractAddress].join("-");

  return (
    <div className="mx-auto flex w-full max-w-4xl">
      {res.error ? (
        <p className="text-center text-destructive">{res.error.message}</p>
      ) : !stakings || stakings.length === 0 || !stakings[0] ? (
        <p className="text-center text-muted-foreground">No stakings found</p>
      ) : (
        <Tabs defaultValue={id(stakings[0])} className="w-full">
          <TabsList className="mb-20 h-auto w-full flex-col justify-between gap-4 md:flex-row">
            {stakings.map((staking, i) => (
              <TabsTrigger
                key={i}
                value={id(staking)}
                className="w-full py-2 font-semibold"
              >
                {staking.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {stakings.map((staking, i) => (
            <TabsContent key={i} value={id(staking)}>
              <Staking
                chainId={staking.chainId}
                address={staking.contractAddress}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
