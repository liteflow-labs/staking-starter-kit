"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import useClaim from "@/hooks/useClaim";
import useStakingPosition, {
  stakingPositionKey,
} from "@/hooks/useStakingPosition";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useSwitchChain } from "wagmi";

export default function ClaimForm({
  staking,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
}) {
  const account = useAccount();
  const position = useStakingPosition(
    staking.chainId,
    staking.contractAddress,
    account.address
  );

  const queryClient = useQueryClient();
  const client = useClient({ chainId: staking.chainId });
  const chain = useSwitchChain();
  const claim = useClaim();
  const claimAndRefetch = useMutation({
    mutationFn: async () => {
      if (!client) throw new Error("Client not found");
      await chain.switchChainAsync({ chainId: staking.chainId });
      const hash = await claim.mutateAsync(staking);
      await waitForTransactionReceipt(client, { hash });
      await queryClient.invalidateQueries({
        queryKey: stakingPositionKey({
          chainId: staking.chainId,
          address: staking.contractAddress,
          userAddress: account.address,
        }),
      });
    },
  });

  if (!position.data) return null;
  return (
    <Button
      variant="outline"
      onClick={() => claimAndRefetch.mutate()}
      isLoading={claimAndRefetch.isPending}
      disabled={BigInt(position.data.rewards) <= BigInt(0)}
    >
      {staking.rewardToken?.symbol}
      <NumberFormatter
        value={position.data.rewards}
        decimals={staking.rewardToken?.decimals}
      />{" "}
    </Button>
  );
}
