"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stakingPositionKey } from "@/hooks/useStakingPosition";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { erc20Abi, formatUnits, getAddress } from "viem";
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
    contracts:
      staking.depositCurrency?.address && account.address
        ? [
            {
              abi: erc20Abi,
              chainId: staking.chainId,
              address: getAddress(staking.depositCurrency.address),
              functionName: "balanceOf",
              args: [account.address],
            },
            {
              abi: erc20Abi,
              chainId: staking.chainId,
              address: getAddress(staking.depositCurrency.address),
              functionName: "allowance",
              args: [account.address, getAddress(staking.contractAddress)],
            },
          ]
        : undefined,
  });
  const [balance, allowance] = data.data || [];

  const amountBigInt = strToBigInt(amount, staking.depositCurrency?.decimals);

  const requireAllowance = useMemo(() => {
    if (allowance?.result === undefined || !amountBigInt) return true;
    return allowance.result < amountBigInt;
  }, [allowance, amountBigInt]);

  const hasError = useMemo(() => {
    if (!amountBigInt) return true;
    if (balance?.result !== undefined && amountBigInt > balance.result)
      return true;
    return false;
  }, [amountBigInt, balance]);

  const errorMessage = useMemo(() => {
    // only display error if amount was set by user
    if (amount === "") return;
    if (!amountBigInt) return "Enter valid amount";
    if (balance?.result !== undefined && amountBigInt > balance.result)
      return "Not enough balance";
  }, [amount, amountBigInt, balance]);

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const chain = useSwitchChain();
  const approveTx = useWriteContract();
  const approve = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      if (!staking.depositCurrency?.address)
        throw new Error("Deposit currency address is missing");
      if (!amountBigInt) throw new Error("no valid amount");
      await chain.switchChainAsync({ chainId: staking.chainId });
      const hash = await approveTx.writeContractAsync({
        chainId: staking.chainId,
        abi: erc20Abi,
        address: getAddress(staking.depositCurrency.address),
        functionName: "approve",
        args: [getAddress(staking.contractAddress), amountBigInt],
      });
      await waitForTransactionReceipt(client, { hash });
      await data.refetch();
    },
  });

  const stakeTx = useWriteContract();
  const stake = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      if (!amountBigInt) throw new Error("no valid amount");
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
        address: getAddress(staking.contractAddress),
        functionName: "stake",
        args: [amountBigInt],
      });
      await waitForTransactionReceipt(client, { hash });
      setAmount("");
      await Promise.all([
        data.refetch(),
        queryClient.invalidateQueries({
          queryKey: stakingPositionKey({
            chainId: staking.chainId,
            address: staking.contractAddress,
            userAddress: account.address,
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
            type="number"
            min="0"
            max={
              balance?.result
                ? formatUnits(
                    balance.result,
                    staking.depositCurrency?.decimals || 18
                  )
                : undefined
            }
            step={0.001}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-16 invalid:text-red-600"
            placeholder="100"
          />
          <Button
            variant="outline"
            size="sm"
            className="absolute right-[1px] top-1/2 -translate-y-1/2 scale-90"
            disabled={!balance?.result}
            onClick={() =>
              balance?.result &&
              setAmount(
                formatUnits(
                  balance.result,
                  staking.depositCurrency?.decimals || 18
                )
              )
            }
          >
            Max
          </Button>
        </div>

        {errorMessage && (
          <div className="text-sm text-red-600">Error: {errorMessage}</div>
        )}
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
          disabled={hasError}
          isLoading={approve.isPending}
          className="w-full"
          onClick={() => approve.mutate()}
          size="lg"
        >
          Approve {staking.depositCurrency?.symbol}
        </Button>
      ) : (
        <Button
          disabled={hasError}
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
