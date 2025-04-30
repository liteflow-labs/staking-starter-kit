"use client";

import StakingSimulation from "@/components/staking/simulation";
import StakingForm from "@/components/staking/staking-form";
import Toolbar from "@/components/staking/toolbar";
import WithdrawForm from "@/components/staking/withdraw-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useStaking from "@/hooks/useStaking";
import useStakingPosition from "@/hooks/useStakingPosition";
import { useDebounce } from "@uidotdev/usehooks";
import { LoaderPinwheelIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

export default function Staking({
  chainId,
  address,
}: {
  chainId: number;
  address: string;
}) {
  const account = useAccount();
  const staking = useStaking(chainId, address);
  const position = useStakingPosition(chainId, address, account.address);
  const [tab, setTab] = useState<"stake" | "withdraw">("stake");
  const [simulation, setSimulation] = useState<{
    amount: string;
    nftIds: string[];
  }>();
  const debouncedSimulation = useDebounce(simulation, 500);

  if (staking.isLoading || position.isLoading)
    return (
      <div className="flex size-full min-h-[500px] items-center justify-center">
        <LoaderPinwheelIcon className="size-20 animate-spin text-muted-foreground" />
      </div>
    );
  if (staking.error || position.error)
    return (
      <p className="text-destructive">
        Error: {staking.error?.message || position.error?.message}
      </p>
    );
  if (!staking.data) return <p>No data</p>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Toolbar staking={staking.data} position={position.data} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <Tabs
            defaultValue="stake"
            value={tab}
            onValueChange={(value) => setTab(value as "stake" | "withdraw")}
          >
            <CardHeader>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="stake">
                  <PlusIcon className="mr-2 size-4" /> Stake
                </TabsTrigger>
                <TabsTrigger value="withdraw">
                  <MinusIcon className="mr-2 size-4" /> Withdraw
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="stake">
                <StakingForm
                  staking={staking.data}
                  position={position.data}
                  onChange={setSimulation}
                />
              </TabsContent>
              <TabsContent value="withdraw">
                <WithdrawForm
                  staking={staking.data}
                  position={position.data}
                  onChange={setSimulation}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <StakingSimulation
          staking={staking.data}
          position={position.data}
          tokenAmount={debouncedSimulation?.amount ?? ""}
          nftQuantity={debouncedSimulation?.nftIds.length ?? 0}
          positive={tab === "stake"}
        />
      </div>
    </div>
  );
}
