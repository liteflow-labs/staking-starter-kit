"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useStakingPosition, {
  stakingPositionKey,
} from "@/hooks/useStakingPosition";
import useSupportMultiAssetStaking from "@/hooks/useSupportMultiAssetStaking";
import useWithdraw from "@/hooks/useWithdraw";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { formatUnits, getAddress } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useSwitchChain } from "wagmi";

export default function WithdrawForm({
  staking,
  amount,
  setAmount,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
  amount: string;
  setAmount: (amount: string) => void;
}) {
  const account = useAccount();
  const position = useStakingPosition(
    staking.chainId,
    staking.contractAddress,
    account.address
  );
  const modal = useConnectModal();
  const amountBigInt = strToBigInt(amount, staking.depositToken?.decimals ?? 0);

  const hasError = useMemo(() => {
    if (!amountBigInt) return true;
    if (
      position.data?.tokensStaked !== undefined &&
      amountBigInt > BigInt(position.data.tokensStaked)
    )
      return true;
    return false;
  }, [amountBigInt, position.data]);

  const errorMessage = useMemo(() => {
    // only display error if amount was set by user
    if (amount === "") return;
    if (!amountBigInt) return "Enter valid amount";
    if (
      position.data?.tokensStaked !== undefined &&
      amountBigInt > BigInt(position.data.tokensStaked)
    )
      return "Not enough available token";
  }, [amount, amountBigInt, position.data]);

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const chain = useSwitchChain();

  const multiAssetStaking = useSupportMultiAssetStaking(staking);
  const withdraw = useWithdraw(multiAssetStaking.data);
  const withdrawAndRefetch = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      if (!amountBigInt) throw new Error("no valid amount");
      await chain.switchChainAsync({ chainId: staking.chainId });
      const hash = await withdraw.mutateAsync({
        chainId: staking.chainId,
        contract: getAddress(staking.contractAddress),
        amount: amountBigInt,
        nftIds:
          position.data?.nftStaked
            .map((nftId) => strToBigInt(nftId, 0))
            .filter((x) => x !== undefined) ?? [],
      });
      await waitForTransactionReceipt(client, { hash });
      setAmount("");
      await queryClient.invalidateQueries({
        queryKey: stakingPositionKey({
          chainId: staking.chainId,
          address: staking.contractAddress,
          userAddress: account.address,
        }),
      });
    },
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Label className="flex justify-between" htmlFor="withdraw">
          <span>Enter amount</span>
          <span>
            Available:{" "}
            <NumberFormatter
              value={position.data?.tokensStaked}
              decimals={staking.depositToken?.decimals}
            />
          </span>
        </Label>

        <div className="relative">
          <Input
            id="withdraw"
            type="number"
            min="0"
            max={
              position.data?.tokensStaked
                ? formatUnits(
                    BigInt(position.data.tokensStaked),
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
            disabled={!position.data?.tokensStaked}
            onClick={() =>
              position.data?.tokensStaked &&
              setAmount(
                formatUnits(
                  BigInt(position.data.tokensStaked),
                  staking.depositToken?.decimals || 18
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
      ) : (
        <div className="space-y-2">
          <Button
            disabled={hasError}
            isLoading={withdrawAndRefetch.isPending}
            className="w-full"
            onClick={() => withdrawAndRefetch.mutate()}
            size="lg"
          >
            Withdraw {staking.depositToken?.symbol}
          </Button>
          {position.data?.nftStaked && position.data.nftStaked.length > 0 && (
            <p className="text-left text-sm text-muted-foreground">
              {position.data.nftStaked.length} staked NFTs will be sent back to
              your wallet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
