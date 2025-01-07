"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import useStakingPosition, {
  stakingPositionKey,
} from "@/hooks/useStakingPosition";
import { GetStakingsByChainIdByAddressResponses } from "@liteflow/sdk/dist/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Address } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useSwitchChain, useWriteContract } from "wagmi";

export default function ClaimForm({
  staking,
}: {
  staking: GetStakingsByChainIdByAddressResponses["200"];
}) {
  const account = useAccount();
  const position = useStakingPosition(
    staking.chainId,
    staking.contractAddress,
    account.address as Address
  );

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const chain = useSwitchChain();
  const claimTx = useWriteContract();
  const claim = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      await chain.switchChainAsync({ chainId: staking.chainId });
      const hash = await claimTx.writeContractAsync({
        chainId: staking.chainId,
        abi: [
          {
            inputs: [],
            name: "claimRewards",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const,
        address: staking.contractAddress as Address,
        functionName: "claimRewards",
      });
      await waitForTransactionReceipt(client, { hash });
      await queryClient.invalidateQueries({
        queryKey: stakingPositionKey({
          chainId: staking.chainId,
          address: staking.contractAddress,
          userAddress: account.address as Address,
        }),
      });
    },
  });

  if (!position.data) return null;
  return (
    <Button
      variant="ghost"
      onClick={() => claim.mutate()}
      isLoading={claim.isPending}
      disabled={position.data.rewards <= 0}
    >
      {staking.rewardCurrency?.symbol}
      <NumberFormatter
        value={position.data.rewards}
        decimals={staking.rewardCurrency?.decimals}
      />{" "}
    </Button>
  );
}
