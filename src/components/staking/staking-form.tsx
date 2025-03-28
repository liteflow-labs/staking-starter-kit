"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useApprove from "@/hooks/useApprove";
import useStake from "@/hooks/useStake";
import { stakingPositionKey } from "@/hooks/useStakingPosition";
import useSupportMultiAssetStaking from "@/hooks/useSupportMultiAssetStaking";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Address, erc20Abi, formatUnits } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useReadContracts } from "wagmi";

export default function StakingForm({
  staking,
  amount,
  setAmount,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
  amount: string;
  setAmount: (amount: string) => void;
}) {
  const account = useAccount();
  const modal = useConnectModal();
  const isMultiAssetStaking = useSupportMultiAssetStaking(staking);
  const data = useReadContracts({
    query: {
      enabled: !!staking.depositCurrency && !!account.address,
    },
    contracts: [
      {
        abi: erc20Abi,
        chainId: staking.chainId,
        address: staking.depositCurrency?.address as Address,
        functionName: "balanceOf",
        args: [account.address as Address],
      },
      {
        abi: erc20Abi,
        chainId: staking.chainId,
        address: staking.depositCurrency?.address as Address,
        functionName: "allowance",
        args: [account.address as Address, staking.contractAddress as Address],
      },
    ],
  });
  const [balance, allowance] = data.data || [];

  const amountBigInt = strToBigInt(amount, staking.depositCurrency?.decimals);

  const requireAllowance = useMemo(() => {
    if (!allowance?.result) return true;
    return allowance.result < amountBigInt;
  }, [allowance, amountBigInt]);

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const approve = useApprove();
  const stake = useStake(isMultiAssetStaking.data);

  const approveAndRefetch = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      const hash = await approve.mutateAsync({
        chainId: staking.chainId,
        token: staking.depositCurrency?.address as Address,
        contract: staking.contractAddress as Address,
        amount: amountBigInt,
      });
      await waitForTransactionReceipt(client, { hash });
      await data.refetch();
    },
  });

  const stakeAndRefetch = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      const hash = await stake.mutateAsync({
        chainId: staking.chainId,
        contract: staking.contractAddress as Address,
        amount: amountBigInt,
      });
      await waitForTransactionReceipt(client, { hash });
      await Promise.all([
        data.refetch(),
        queryClient.invalidateQueries({
          queryKey: stakingPositionKey({
            chainId: staking.chainId,
            address: staking.contractAddress,
            userAddress: account.address as Address,
          }),
        }),
      ]);
    },
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Enter amount</span>
          <span>
            Available:{" "}
            <NumberFormatter
              value={balance?.result}
              decimals={staking.depositCurrency?.decimals}
            />
          </span>
        </div>

        <div className="relative">
          <Input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-16"
            placeholder="100"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute right-[1px] top-1/2 -translate-y-1/2 scale-90"
            disabled={!balance?.result}
            onClick={() =>
              balance?.result &&
              staking &&
              setAmount(
                formatUnits(
                  balance?.result,
                  staking.depositCurrency?.decimals || 18
                )
              )
            }
          >
            Max
          </Button>
        </div>
      </div>

      {account.isDisconnected ? (
        <Button
          className="w-full"
          onClick={modal.openConnectModal}
          isLoading={modal.connectModalOpen}
          size="lg"
        >
          Connect Wallet
        </Button>
      ) : requireAllowance ? (
        <Button
          isLoading={approveAndRefetch.isPending}
          className="w-full"
          onClick={() => approveAndRefetch.mutate()}
          size="lg"
        >
          Approve {staking.depositCurrency?.symbol}
        </Button>
      ) : (
        <Button
          isLoading={stakeAndRefetch.isPending}
          className="w-full"
          onClick={() => stakeAndRefetch.mutate()}
          size="lg"
        >
          Stake {staking.depositCurrency?.symbol}
        </Button>
      )}
    </div>
  );
}
