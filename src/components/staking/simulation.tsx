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
import {
  GetStakingsByChainIdByAddressPositionsByUserAddressResponse,
  GetStakingsByChainIdByAddressResponse,
} from "@liteflow/sdk/dist/client";
import { Loader2Icon } from "lucide-react";

export default function StakingSimulation({
  staking,
  position,
  tokenAmount,
  nftQuantity,
  positive,
}: {
  tokenAmount: string;
  nftQuantity: number;
  staking: GetStakingsByChainIdByAddressResponse;
  position:
    | GetStakingsByChainIdByAddressPositionsByUserAddressResponse
    | undefined;
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
  const currentReward = useSimulation({
    chainId: staking.chainId,
    address: staking.contractAddress,
    opts: {
      tokenStaked: BigInt(position?.tokensStaked ?? 0),
      nftStaked: position?.nftStaked.length ?? 0,
    },
  });
  const reward = useSimulation({
    chainId: staking.chainId,
    address: staking.contractAddress,
    opts: {
      tokenStaked:
        strToBigInt(tokenAmount, staking.depositToken?.decimals ?? 0) ??
        BigInt(0),
      nftStaked: nftQuantity,
    },
  });

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Staking Power Rate</span>
          <span className="text-sm text-muted-foreground">
            {currentReward.isLoading ? (
              <Loader2Icon className="inline size-4 animate-spin" />
            ) : (
              <>
                <NumberFormatter
                  value={BigInt(currentReward.data?.amount ?? 0)}
                  decimals={staking.rewardToken?.decimals}
                />{" "}
                <span className="text-primary">
                  {staking.rewardToken?.symbol}
                </span>
              </>
            )}{" "}
            / day
          </span>
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
                <NumberFormatter value={staking.nftRewardBoostBps / 100} />%{" "}
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
