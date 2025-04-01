"use client";

import { NumberFormatter } from "@/components/number-formatter";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import useSimulation from "@/hooks/useSimulation";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { Loader2Icon } from "lucide-react";

export default function StakingSimulation({
  staking,
  tokenAmount,
  nftQuantity,
  positive,
}: {
  tokenAmount: string;
  nftQuantity: number;
  staking: GetStakingsByChainIdByAddressResponse;
  positive: boolean;
}) {
  const defaultReward = useSimulation({
    chainId: staking.chainId,
    address: staking.contractAddress,
    opts: {
      tokenStaked:
        BigInt(1) * BigInt(10) ** BigInt(staking.depositToken?.decimals ?? 18),
      nftStaked: 0,
    },
  });
  const reward = useSimulation({
    chainId: staking.chainId,
    address: staking.contractAddress,
    opts: {
      tokenStaked:
        strToBigInt(tokenAmount, staking.depositToken?.decimals) ?? BigInt(0),
      nftStaked: nftQuantity,
    },
  });

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
            {reward.isLoading ? (
              <Loader2Icon className="inline size-6 animate-spin" />
            ) : (
              <>
                {positive ? "+" : "-"}
                <NumberFormatter
                  value={reward.data?.amount}
                  decimals={staking.rewardToken?.decimals}
                />
              </>
            )}{" "}
            {staking.rewardToken?.symbol}
          </span>
          <span className="text-sm">/day</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="w-full text-center text-sm">
          <NumberFormatter value={1} />{" "}
          <span className="text-primary">{staking.depositToken?.symbol}</span>{" "}
          staked ={" "}
          {defaultReward.isLoading ? (
            <Loader2Icon className="inline size-4 animate-spin text-muted-foreground" />
          ) : (
            <NumberFormatter
              value={defaultReward.data?.amount}
              decimals={staking.rewardToken?.decimals}
            />
          )}{" "}
          <span className="text-primary">{staking.rewardToken?.symbol}</span>{" "}
          per day
        </p>
        {(staking.nftRewardBoostBps > 0 ||
          BigInt(staking.nftReward) > BigInt(0)) && (
          <p className="w-full text-center text-sm">
            {staking.nftRewardBoostBps > 0 && (
              <>
                <NumberFormatter value={staking.nftRewardBoostBps} />%{" "}
                <span className="text-primary">boost</span>
              </>
            )}{" "}
            {staking.nftRewardBoostBps > 0 &&
              BigInt(staking.nftReward) > BigInt(0) &&
              "+ "}
            {BigInt(staking.nftReward) > BigInt(0) && (
              <>
                <NumberFormatter
                  value={staking.nftReward}
                  decimals={staking.rewardToken?.decimals}
                />{" "}
                <span className="text-primary">
                  {staking.rewardToken?.symbol}
                </span>{" "}
                per day
              </>
            )}{" "}
            {staking.nftRewardBoostBps > 0 &&
              BigInt(staking.nftReward) > BigInt(0) &&
              "per NFT"}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
