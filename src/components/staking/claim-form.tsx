"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import useClaim from "@/hooks/useClaim";
import {
  GetStakingsByChainIdByAddressPositionsByUserAddressResponse,
  GetStakingsByChainIdByAddressResponse,
} from "@liteflow/sdk/dist/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "viem/actions";
import { useClient, useSwitchChain } from "wagmi";

export default function ClaimForm({
  staking,
  position,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
  position:
    | GetStakingsByChainIdByAddressPositionsByUserAddressResponse
    | undefined;
}) {
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
      await queryClient.invalidateQueries();
    },
  });

  return (
    <Button
      variant="outline"
      onClick={() => claimAndRefetch.mutate()}
      isLoading={claimAndRefetch.isPending}
      disabled={BigInt(position?.rewards ?? 0) <= BigInt(0)}
    >
      <NumberFormatter
        value={position?.rewards ?? 0}
        decimals={staking.rewardToken?.decimals}
      />{" "}
      {staking.rewardToken?.symbol}
    </Button>
  );
}
