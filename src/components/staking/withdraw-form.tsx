"use client";

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
import useSupportMultiAssetStaking from "@/hooks/useSupportMultiAssetStaking";
import useWithdraw from "@/hooks/useWithdraw";
import { strToBigInt } from "@/lib/bigint";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GetStakingsByChainIdByAddressPositionsByUserAddressResponse,
  GetStakingsByChainIdByAddressResponse,
} from "@liteflow/sdk/dist/client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { LockIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Control, useForm } from "react-hook-form";
import { formatUnits, getAddress } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useSwitchChain } from "wagmi";
import { z } from "zod";

export default function WithdrawForm({
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
          .refine((value) => value <= BigInt(position?.tokensStaked ?? 0), {
            message: `Not enough balance`,
          }),
        nftIds: z
          .array(z.string())
          .transform((value) =>
            value.map((v) => strToBigInt(v, 0)).filter((v) => v !== undefined)
          ),
      })
    ),
    defaultValues: {
      amount: formatUnits(
        BigInt(position?.tokensStaked ?? 0),
        staking.depositToken?.decimals ?? 0
      ),
      nftIds: position?.nftStaked ?? [],
    },
  });
  const modal = useConnectModal();
  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const chain = useSwitchChain();
  const multiAssetStaking = useSupportMultiAssetStaking(staking);
  const withdraw = useWithdraw(multiAssetStaking.data);
  const amount = form.watch("amount");
  const nftIds = form.watch("nftIds");
  const unlockDate = useMemo(() => {
    if (!position) return new Date();
    return new Date(
      position.updatedAt.getTime() + Number(staking.lockPeriod) * 1000
    );
  }, [position, staking]);

  const isLocked = useMemo(() => {
    if (unlockDate < new Date()) return false;
    if (staking.flexibleWithdraw) return false;
    return true;
  }, [unlockDate, staking.flexibleWithdraw]);
  const alert = useMemo(() => {
    if (!position) return null;
    if (unlockDate < new Date()) return null;
    if (!staking.flexibleWithdraw)
      return (
        <Alert>
          <LockIcon className="size-3" />
          <AlertTitle>Withdrawal is locked</AlertTitle>
          <AlertDescription>
            You can withdraw after {unlockDate.toLocaleString()}.
          </AlertDescription>
        </Alert>
      );
    if (staking.penaltyFeeBps) {
      return (
        <Alert>
          <LockIcon className="size-3" />
          <AlertTitle>Withdrawal is locked</AlertTitle>
          <AlertDescription>
            Your token staked are still locked until{" "}
            {unlockDate.toLocaleString()}. You will be charged a penalty of{" "}
            {staking.penaltyFeeBps / 100}% for withdrawing.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }, [position, unlockDate, staking]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!client) throw new Error("Client not found");
    if (!data.amount) throw new Error("no valid amount");
    await chain.switchChainAsync({ chainId: staking.chainId });
    const hash = await withdraw.mutateAsync({
      chainId: staking.chainId,
      contract: getAddress(staking.contractAddress),
      amount: data.amount,
      nftIds: data.nftIds,
    });
    await waitForTransactionReceipt(client, { hash });
    await queryClient.invalidateQueries();
    form.reset();
  });

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
                <div className="flex justify-between">
                  <FormLabel>Enter amount</FormLabel>
                  <span className="text-sm text-muted-foreground">
                    Available:{" "}
                    <NumberFormatter
                      value={position?.tokensStaked ?? 0}
                      decimals={staking.depositToken?.decimals}
                    />
                  </span>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="eg: 100" type="number" {...field} />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-[1px] top-1/2 -translate-y-1/2 scale-90"
                      disabled={!position?.tokensStaked}
                      onClick={() =>
                        position?.tokensStaked &&
                        form.setValue(
                          "amount",
                          formatUnits(
                            BigInt(position.tokensStaked),
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

          {account.isDisconnected ? (
            <Button
              className="w-full"
              type="button"
              onClick={modal.openConnectModal}
              isLoading={modal.connectModalOpen}
              size="lg"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                type="submit"
                isLoading={form.formState.isSubmitting}
                className="w-full"
                size="lg"
                disabled={isLocked}
              >
                Withdraw {staking.depositToken?.symbol}
              </Button>
              {nftIds.length > 0 && (
                <p className="text-left text-sm text-muted-foreground">
                  {nftIds.length} staked NFTs will be sent back to your wallet.
                </p>
              )}
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}
