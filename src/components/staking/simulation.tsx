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

function timeUnit(seconds: number) {
  if (seconds === 1) return "second";
  if (seconds === 60) return "minute";
  if (seconds === 3600) return "hour";
  if (seconds === 86400) return "day";
  if (seconds === 604800) return "week";
  if (seconds === 2592000) return "month";
  return "year";
}

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
    if (!staking) return;
    return amountBigInt * BigInt(staking.dailyRewardPerTokenStaked);
  }, [staking, amountBigInt]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Staking Power Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="text-3xl font-bold text-center space-x-2">
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
      <CardFooter className="text-center text-sm">
        <p className="text-center text-sm">
          <NumberFormatter
            value={staking.rewardsDenominator}
            decimals={staking.depositCurrency?.decimals}
          />{" "}
          <span className="text-primary">
            {staking?.depositCurrency?.symbol}
          </span>{" "}
          staked ={" "}
          <NumberFormatter
            value={staking.rewardsNumerator}
            decimals={staking.rewardCurrency?.decimals}
          />{" "}
          <span className="text-primary">
            {staking?.rewardCurrency?.symbol}
          </span>{" "}
          per {timeUnit(parseInt(staking.rewardsTimeUnit))}{" "}
        </p>
      </CardFooter>
    </Card>
  );
}
