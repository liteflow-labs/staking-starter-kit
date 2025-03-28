"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useApprove from "@/hooks/useApprove";
import { stakingPositionKey } from "@/hooks/useStakingPosition";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Address, erc20Abi, formatUnits } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import {
  useAccount,
  useClient,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from "wagmi";

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

  const stakeTx = useWriteContract();
  const stake = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      await chain.switchChainAsync({ chainId: staking.chainId });
      const hash = await stakeTx.writeContractAsync({
        chainId: staking.chainId,
        abi: [
          {
            inputs: [
              { internalType: "uint256", name: "_amount", type: "uint256" },
            ],
            name: "stake",
            outputs: [],
            stateMutability: "payable",
            type: "function",
          },
        ] as const,
        address: staking.contractAddress as Address,
        functionName: "stake",
        args: [amountBigInt],
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
          isLoading={stake.isPending}
          className="w-full"
          onClick={() => stake.mutate()}
          size="lg"
        >
          Stake {staking.depositCurrency?.symbol}
        </Button>
      )}
    </div>
  );
}
