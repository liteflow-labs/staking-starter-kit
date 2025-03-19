"use client";

import { NumberFormatter } from "@/components/number-formatter";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useMemo } from "react";

export default function StakingSimulation({
  staking,
  amount,
  positive,
}: {
  amount: string;
  staking: GetStakingsByChainIdByAddressResponse;
  positive: boolean;
}) {
  const amountBigInt = strToBigInt(amount, staking.depositCurrency?.decimals);

  const reward = useMemo(() => {
    if (!staking.depositCurrency) return BigInt(0);
    return (
      (amountBigInt * BigInt(staking.dailyRewardPerTokenStaked)) /
      BigInt(10) ** BigInt(staking.depositCurrency.decimals)
    );
  }, [staking, amountBigInt]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          Staking Power Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center">
        <div className="space-x-2 text-center text-3xl font-bold">
          <span className="text-green-400">
            {positive ? "+" : "-"}
            <NumberFormatter
              value={reward}
              decimals={staking.rewardCurrency?.decimals}
            />{" "}
            {staking.rewardCurrency?.symbol}
          </span>
          <span className="text-sm">/day</span>
        </div>
      </CardContent>
      <CardFooter>
        <p className="w-full text-center text-sm">
          <NumberFormatter value={1} />{" "}
          <span className="text-primary">
            {staking?.depositCurrency?.symbol}
          </span>{" "}
          staked ={" "}
          <NumberFormatter
            value={staking.dailyRewardPerTokenStaked}
            decimals={staking.rewardCurrency?.decimals}
          />{" "}
          <span className="text-primary">
            {staking?.rewardCurrency?.symbol}
          </span>{" "}
          per day
        </p>
      </CardFooter>
    </Card>
  );
}
