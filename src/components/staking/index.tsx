"use client";

import StakingSimulation from "@/components/staking/simulation";
import StakingForm from "@/components/staking/staking-form";
import Toolbar from "@/components/staking/toolbar";
import UnstakingForm from "@/components/staking/unstaking-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useStaking from "@/hooks/useStaking";
import { LoaderPinwheelIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

export default function Staking({
  chainId,
  address,
}: {
  chainId: number;
  address: string;
}) {
  const staking = useStaking(chainId, address);
  const [tab, setTab] = useState<string>("stake");
  const [amount, setAmount] = useState("");

  if (staking.isLoading)
    return (
      <LoaderPinwheelIcon className="size-20 text-muted-foreground animate-spin" />
    );
  if (staking.error)
    return <p className="text-destructive">Error: {staking.error.message}</p>;
  if (!staking.data) return <p>No data</p>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Toolbar staking={staking.data} />

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <Tabs
            defaultValue="stake"
            value={tab}
            onValueChange={(value) => setTab(value)}
          >
            <CardHeader>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="stake">
                  <PlusIcon className="size-4 mr-2" /> Stake
                </TabsTrigger>
                <TabsTrigger value="unstake">
                  <MinusIcon className="size-4 mr-2" /> Unstake
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="stake" className="space-y-6">
                {staking.data && (
                  <StakingForm
                    staking={staking.data}
                    amount={amount}
                    setAmount={setAmount}
                  />
                )}
              </TabsContent>
              <TabsContent value="unstake" className="space-y-6">
                {staking.data && (
                  <UnstakingForm
                    staking={staking.data}
                    amount={amount}
                    setAmount={setAmount}
                  />
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <StakingSimulation
          staking={staking.data}
          amount={amount}
          positive={tab === "stake"}
        />
      </div>
    </div>
  );
}
