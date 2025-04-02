"use client";

import StakingSimulation from "@/components/staking/simulation";
import StakingForm from "@/components/staking/staking-form";
import Toolbar from "@/components/staking/toolbar";
import WithdrawForm from "@/components/staking/withdraw-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useStaking from "@/hooks/useStaking";
import { LoaderPinwheelIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [tab, setTab] = useState<string>("stake");
  const [amount, setAmount] = useState("");
  const [nftIds, setNftIds] = useState<string[]>([]);

  useEffect(() => {
    if (!account.address) return;
    setAmount("");
    setNftIds([]);
  }, [account.address]);

  if (staking.isLoading)
    return (
      <LoaderPinwheelIcon className="size-20 animate-spin text-muted-foreground" />
    );
  if (staking.error)
    return <p className="text-destructive">Error: {staking.error.message}</p>;
  if (!staking.data) return <p>No data</p>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Toolbar staking={staking.data} />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <Tabs
            defaultValue="stake"
            value={tab}
            onValueChange={(value) => setTab(value)}
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
              <TabsContent value="stake" className="space-y-6">
                <StakingForm
                  staking={staking.data}
                  amount={amount}
                  setAmount={setAmount}
                  nftIds={nftIds}
                  setNftIds={setNftIds}
                />
              </TabsContent>
              <TabsContent value="withdraw" className="space-y-6">
                <WithdrawForm
                  staking={staking.data}
                  amount={amount}
                  setAmount={setAmount}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <StakingSimulation
          staking={staking.data}
          tokenAmount={amount}
          nftQuantity={nftIds.length}
          positive={tab === "stake"}
        />
      </div>
    </div>
  );
}
