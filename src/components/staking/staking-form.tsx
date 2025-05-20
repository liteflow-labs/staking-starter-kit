"use client";

import NftDrawer from "@/components/nft-drawer";
import { NumberFormatter } from "@/components/number-formatter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useAllowance from "@/hooks/useAllowance";
import useApproveCollection from "@/hooks/useApproveCollection";
import useApproveToken from "@/hooks/useApproveToken";
import useTokenBalance from "@/hooks/useBalance";
import useIsApprovedForAll from "@/hooks/useIsApprovedForAll";
import useStake from "@/hooks/useStake";
import useSupportMultiAssetStaking from "@/hooks/useSupportMultiAssetStaking";
import { strToBigInt } from "@/lib/bigint";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GetStakingsByChainIdByAddressPositionsByUserAddressResponse,
  GetStakingsByChainIdByAddressResponse,
} from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircleIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Control, useForm } from "react-hook-form";
import { formatUnits, getAddress, maxUint256 } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient } from "wagmi";
import { z } from "zod";

export default function StakingForm({
  staking,
  position,
  onChange,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
  position:
    | GetStakingsByChainIdByAddressPositionsByUserAddressResponse
    | undefined;
  onChange: (data: { amount: string; nftIds: string[] }) => void;
}) {
  const account = useAccount();
  const modal = useConnectModal();
  const balance = useTokenBalance({
    chainId: staking.chainId,
    token: staking.depositToken?.address ?? undefined,
    address: account.address,
  });

  const poolMaxCapacity =
    BigInt(staking.tokenCap) - BigInt(staking.tokenBalance);

  const minTokenAllowed =
    BigInt(staking.minTokenAllowed) - BigInt(position?.tokensStaked ?? 0);
  const maxUserToken =
    BigInt(staking.maxTokenAllowed) - BigInt(position?.tokensStaked ?? 0);
  const maxTokenAllowed =
    maxUserToken < poolMaxCapacity ? maxUserToken : poolMaxCapacity;
  const minNftAllowed =
    BigInt(staking.minNftAllowed) - BigInt(position?.nftStaked.length ?? 0);
  const maxNftAllowed =
    BigInt(staking.maxNftAllowed) - BigInt(position?.nftStaked.length ?? 0);

  const form = useForm({
    mode: "all",
    resolver: zodResolver(
      z.object({
        amount: z
          .string()
          .transform(
            (value) =>
              strToBigInt(value, staking.depositToken?.decimals ?? 0) ??
              BigInt(0)
          )
          .refine((value) => !!value, { message: "Enter valid amount" })
          .refine((value) => value <= (balance.data ?? 0), {
            message: `Not enough balance`,
          })
          .refine((value) => value >= minTokenAllowed, {
            message: `Amount too low, minimum ${formatUnits(minTokenAllowed, staking.depositToken?.decimals ?? 0)}`,
          })
          .refine((value) => value <= maxTokenAllowed, {
            message: `Amount too high, maximum ${formatUnits(maxTokenAllowed, staking.depositToken?.decimals ?? 0)}`,
          }),
        nftIds: z
          .array(z.string())
          .transform((value) =>
            value.map((v) => strToBigInt(v, 0)).filter((v) => v !== undefined)
          )
          .refine((value) => BigInt(value.length) >= minNftAllowed, {
            message: `Too few NFTs, minimum ${formatUnits(minNftAllowed, 0)}`,
          })
          .refine((value) => BigInt(value.length) <= maxNftAllowed, {
            message: `Too many NFTs, maximum ${formatUnits(maxNftAllowed, 0)}`,
          }),
      })
    ),
    defaultValues: {
      amount: "",
      nftIds: [],
    },
  });
  const amount = form.watch("amount");
  const nftIds = form.watch("nftIds");

  const isMultiAssetStaking = useSupportMultiAssetStaking(staking);

  const allowance = useAllowance({
    chainId: staking.chainId,
    token: staking.depositToken?.address ?? undefined,
    owner: account.address,
    spender: staking.contractAddress,
  });

  const isApprovedForAll = useIsApprovedForAll({
    chainId: staking.chainId,
    collection: staking.depositCollection?.address,
    owner: account.address,
    operator: staking.contractAddress,
  });

  const amountBigInt = useMemo(() => {
    if (!amount) return undefined;
    return strToBigInt(amount, staking.depositToken?.decimals ?? 0);
  }, [amount, staking.depositToken?.decimals]);

  const requireTokenApproval = useMemo(() => {
    if (allowance.data === undefined) return true;
    if (!amountBigInt) return false;
    return allowance.data < amountBigInt;
  }, [allowance, amountBigInt]);

  const requireCollectionApproval = useMemo(() => {
    if (isApprovedForAll.data === undefined) return true;
    if (nftIds.length === 0) return false;
    return !isApprovedForAll.data;
  }, [isApprovedForAll, nftIds]);

  const alert = useMemo(() => {
    const tokenCap = BigInt(staking.tokenCap);
    const tokenBalance = BigInt(staking.tokenBalance);
    if (tokenCap === maxUint256) return null;
    const percent = (tokenBalance * BigInt(100)) / tokenCap;

    if (percent >= BigInt(100))
      return (
        <Alert>
          <AlertTitle>❌ This staking pool is full</AlertTitle>
          <AlertDescription>
            You missed this one — check other pools to secure your spot.
          </AlertDescription>
        </Alert>
      );
    if (percent >= BigInt(90))
      return (
        <Alert>
          <AlertTitle>🚨 Almost full!</AlertTitle>
          <AlertDescription>
            The staking pool is about to close. Stake now or risk missing out on
            rewards.
          </AlertDescription>
        </Alert>
      );
    if (percent >= BigInt(50))
      return (
        <Alert>
          <AlertTitle>🔥 The staking pool is filling up fast!</AlertTitle>
          <AlertDescription>
            Don’t miss your chance to earn — stake now before it’s too late.
          </AlertDescription>
        </Alert>
      );
    return null;
  }, [staking]);

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const approveToken = useApproveToken();
  const approveCollection = useApproveCollection();
  const stake = useStake(isMultiAssetStaking.data);

  const approveTokenAndRefetch = useMutation({
    mutationFn: async () => {
      if (!staking.depositToken?.address)
        throw new Error("Deposit token address is missing");
      if (!amountBigInt) throw new Error("Amount is not defined");
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
        collection: getAddress(staking.depositCollection.address),
        contract: getAddress(staking.contractAddress),
      });
      await waitForTransactionReceipt(client, { hash });
      await isApprovedForAll.refetch();
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!client) throw new Error("Client not found");
    if (!data.amount) throw new Error("Amount is not defined");
    const hash = await stake.mutateAsync({
      chainId: staking.chainId,
      contract: getAddress(staking.contractAddress),
      amount: data.amount,
      nftIds: data.nftIds,
    });
    await waitForTransactionReceipt(client, { hash });
    await Promise.all([
      balance.refetch(),
      allowance.refetch(),
      isApprovedForAll.refetch(),
      queryClient.invalidateQueries(),
    ]);
    form.reset();
  });

  useEffect(() => {
    if (!account.address) return;
    form.reset();
  }, [account.address, form]);

  useEffect(() => {
    onChange({ amount, nftIds });
  }, [amount, nftIds, onChange]);

  return (
    <Form {...form}>
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="space-y-8">
          {alert}
          <FormField
            control={form.control as unknown as Control<{ amount: string }>}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Enter amount</FormLabel>
                  <span className="text-sm text-muted-foreground">
                    Available:{" "}
                    <NumberFormatter
                      value={balance.data}
                      decimals={staking.depositToken?.decimals ?? 0}
                    />
                  </span>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="eg: 100" type="number" {...field} />
                    <Button
                      variant="outline"
                      type="button"
                      size="sm"
                      className="absolute right-[1px] top-1/2 -translate-y-1/2 scale-90"
                      disabled={!balance.data}
                      onClick={() =>
                        balance.data &&
                        form.setValue(
                          "amount",
                          formatUnits(
                            balance.data < maxTokenAllowed
                              ? balance.data
                              : maxTokenAllowed,
                            staking.depositToken?.decimals ?? 0
                          ),
                          { shouldValidate: true }
                        )
                      }
                    >
                      Max
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {staking.depositCollection && (
            <FormField
              control={form.control as unknown as Control<{ nftIds: string[] }>}
              name="nftIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stake NFTs</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      {staking.depositCollection && (
                        <NftDrawer
                          chainId={staking.chainId}
                          collection={staking.depositCollection.address}
                          maxNftQuantity={maxNftAllowed}
                        >
                          <Button type="button" variant="outline" size="sm">
                            <PlusCircleIcon className="mr-2 inline" />
                            <span>Select NFTs</span>
                          </Button>
                        </NftDrawer>
                      )}
                      <span className="text-muted-foreground">
                        {field.value.length} selected
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {account.isDisconnected ? (
            <Button
              type="button"
              className="w-full"
              onClick={modal.openConnectModal}
              isLoading={modal.connectModalOpen}
              size="lg"
            >
              Connect Wallet
            </Button>
          ) : requireTokenApproval ? (
            <Button
              type="button"
              isLoading={approveTokenAndRefetch.isPending}
              className="w-full"
              onClick={() => approveTokenAndRefetch.mutate()}
              size="lg"
            >
              Approve {staking.depositToken?.symbol}
            </Button>
          ) : requireCollectionApproval && staking.depositCollection ? (
            <Button
              type="button"
              isLoading={approveCollectionAndRefetch.isPending}
              className="w-full"
              onClick={() => approveCollectionAndRefetch.mutate()}
              size="lg"
            >
              Approve {staking.depositCollection.name}
            </Button>
          ) : (
            <Button
              type="submit"
              isLoading={form.formState.isSubmitting}
              // disabled={!form.formState.isValid}
              className="w-full"
              size="lg"
            >
              Stake {staking.depositToken?.symbol}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
