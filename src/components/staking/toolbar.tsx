"use client";

import { NumberFormatter } from "@/components/number-formatter";
import ClaimForm from "@/components/staking/claim-form";
import { Button, buttonVariants } from "@/components/ui/button";
import useStakingPosition from "@/hooks/useStakingPosition";
import { GetStakingsByChainIdByAddressResponse } from "@liteflow/sdk/dist/client";
import { useAccountModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Toolbar({
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
  const modal = useAccountModal();

  return (
    <div className="flex justify-end gap-6 text-sm">
      <Button
        variant="outline"
        onClick={modal.openAccountModal}
        className="mt-6"
      >
        {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
      </Button>
      <span className="flex-1" />
      <div className="space-y-1">
        <p>Total Staked</p>
        <div
          className={buttonVariants({
            variant: "ghost",
            className: "hover:bg-transparent",
          })}
        >
          <span className="text-primary">{staking.depositToken?.symbol}</span>{" "}
          {position.data ? (
            <NumberFormatter
              value={position.data.tokensStaked}
              decimals={staking.depositToken?.decimals}
            />
          ) : (
            "--"
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p>Current reward</p>
        <ClaimForm staking={staking} />
      </div>
    </div>
  );
}
