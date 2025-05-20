"use client";

import { NumberFormatter } from "@/components/number-formatter";
import { Button } from "@/components/ui/button";
import useClaim from "@/hooks/useClaim";
import {
  GetStakingsByChainIdByAddressPositionsByUserAddressResponse,
  GetStakingsByChainIdByAddressResponse,
} from "@liteflow/sdk/dist/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockIcon } from "lucide-react";
import { useMemo } from "react";
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
  const unlockDate = useMemo(() => {
    if (!position) return new Date();
    return new Date(
      position.updatedAt.getTime() + Number(staking.lockPeriod) * 1000
    );
  }, [position, staking]);
  const isLocked = useMemo(
    () => (staking.flexibleClaim ? false : unlockDate > new Date()),
    [unlockDate, staking.flexibleClaim]
  );
  const claimAndRefetch = useMutation({
    mutationFn: async () => {
      if (isLocked) throw new Error("Early claim not allowed");
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
      disabled={BigInt(position?.rewards ?? 0) <= BigInt(0) || isLocked}
    >
      {isLocked && <LockIcon className="size-4" />}
      <NumberFormatter
        value={position?.rewards ?? 0}
        decimals={staking.rewardToken?.decimals}
      />{" "}
      {staking.rewardToken?.symbol}
    </Button>
  );
}
