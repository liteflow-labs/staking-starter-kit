"use client";

import NftDrawer from "@/components/nft-drawer";
import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useApproveCollection from "@/hooks/useApproveCollection";
import useApproveToken from "@/hooks/useApproveToken";
import useStake from "@/hooks/useStake";
import { stakingPositionKey } from "@/hooks/useStakingPosition";
import useSupportMultiAssetStaking from "@/hooks/useSupportMultiAssetStaking";
import { strToBigInt } from "@/lib/bigint";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircleIcon } from "lucide-react";
import { useMemo } from "react";
import { Address, erc20Abi, erc721Abi, formatUnits, getAddress } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useReadContract } from "wagmi";

export default function StakingForm({
  staking,
  amount,
  setAmount,
  nftIds,
  setNftIds,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
  amount: string;
  setAmount: (amount: string) => void;
  nftIds: string[];
  setNftIds: (nftIds: string[]) => void;
}) {
  const account = useAccount();
  const modal = useConnectModal();
  const isMultiAssetStaking = useSupportMultiAssetStaking(staking);
  const balance = useReadContract({
    query: {
      enabled: !!staking.depositToken && !!account.address,
    },
    abi: erc20Abi,
    chainId: staking.chainId,
    address: staking.depositToken?.address as Address,
    functionName: "balanceOf",
    args: [account.address as Address],
  });

  const allowance = useReadContract({
    query: {
      enabled: !!staking.depositToken && !!account.address,
    },
    abi: erc20Abi,
    chainId: staking.chainId,
    address: staking.depositToken?.address as Address,
    functionName: "allowance",
    args: [account.address as Address, staking.contractAddress as Address],
  });

  const isApprovedForAll = useReadContract({
    query: {
      enabled: !!staking.depositCollection && !!account.address,
    },
    abi: erc721Abi,
    chainId: staking.chainId,
    address: staking.depositCollection?.address as Address,
    functionName: "isApprovedForAll",
    args: [account.address as Address, staking.contractAddress as Address],
  });

  const amountBigInt = strToBigInt(amount, staking.depositToken?.decimals);

  const requireTokenApproval = useMemo(() => {
    if (allowance?.data === undefined) return true;
    return allowance.data < amountBigInt;
  }, [allowance, amountBigInt]);

  const requireCollectionApproval = useMemo(() => {
    if (isApprovedForAll?.data === undefined) return true;
    if (nftIds.length === 0) return false;
    return !isApprovedForAll.data;
  }, [isApprovedForAll, nftIds]);

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const approveToken = useApproveToken();
  const approveCollection = useApproveCollection();
  const stake = useStake(isMultiAssetStaking.data);

  const approveTokenAndRefetch = useMutation({
    mutationFn: async () => {
      if (!staking.depositToken?.address) return;
      if (!client) throw new Error("Client not found");
      const hash = await approveToken.mutateAsync({
        chainId: staking.chainId,
        token: getAddress(staking.depositToken.address),
        contract: getAddress(staking.contractAddress),
        amount: amountBigInt,
      });
      await waitForTransactionReceipt(client, { hash });
      await allowance.refetch();
    },
  });

  const approveCollectionAndRefetch = useMutation({
    mutationFn: async () => {
      if (!staking.depositCollection) return;
      if (!client) throw new Error("Client not found");
      const hash = await approveCollection.mutateAsync({
        chainId: staking.chainId,
        collection: getAddress(staking.depositCollection?.address),
        contract: getAddress(staking.contractAddress),
      });
      await waitForTransactionReceipt(client, { hash });
      await isApprovedForAll.refetch();
    },
  });

  const stakeAndRefetch = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      const hash = await stake.mutateAsync({
        chainId: staking.chainId,
        contract: staking.contractAddress as Address,
        amount: amountBigInt,
        nftIds: nftIds.map((id) => BigInt(id)),
      });
      await waitForTransactionReceipt(client, { hash });
      await Promise.all([
        balance.refetch(),
        allowance.refetch(),
        isApprovedForAll.refetch(),
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
        <Label className="flex justify-between" htmlFor="stake">
          <span>Enter amount</span>
          <span>
            Available:{" "}
            <NumberFormatter
              value={balance?.data}
              decimals={staking.depositToken?.decimals}
            />
          </span>
        </Label>

        <div className="relative">
          <Input
            id="stake"
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
            disabled={!balance?.data}
            onClick={() =>
              balance?.data &&
              staking &&
              setAmount(
                formatUnits(balance?.data, staking.depositToken?.decimals || 18)
              )
            }
          >
            Max
          </Button>
        </div>
      </div>

      {staking.depositCollection && (
        <div className="flex flex-col space-y-2 text-left">
          <Label>Stake NFTs</Label>
          <div className="flex items-center gap-2">
            <NftDrawer
              chainId={staking.chainId}
              collection={staking.depositCollection.address}
              nftIds={nftIds}
              setNftIds={setNftIds}
            >
              <Button variant="outline" size="sm" className="w-fit">
                <PlusCircleIcon />
                Select NFTs
              </Button>
            </NftDrawer>
            <span className="text-muted-foreground">
              {nftIds.length} selected
            </span>
          </div>
        </div>
      )}

      {account.isDisconnected ? (
        <Button
          className="w-full"
          onClick={modal.openConnectModal}
          isLoading={modal.connectModalOpen}
          size="lg"
        >
          Connect Wallet
        </Button>
      ) : requireTokenApproval ? (
        <Button
          isLoading={approveTokenAndRefetch.isPending}
          className="w-full"
          onClick={() => approveTokenAndRefetch.mutate()}
          size="lg"
        >
          Approve {staking.depositToken?.symbol}
        </Button>
      ) : requireCollectionApproval ? (
        <Button
          isLoading={approveCollectionAndRefetch.isPending}
          className="w-full"
          onClick={() => approveCollectionAndRefetch.mutate()}
          size="lg"
        >
          Approve {staking.depositCollection?.name}
        </Button>
      ) : (
        <Button
          isLoading={stakeAndRefetch.isPending}
          className="w-full"
          onClick={() => stakeAndRefetch.mutate()}
          size="lg"
        >
          Stake {staking.depositToken?.symbol}
        </Button>
      )}
    </div>
  );
}
