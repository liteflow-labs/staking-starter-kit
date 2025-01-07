"use client";

import { NumberFormatter } from "@/components/number-formatter";
import ClaimForm from "@/components/staking/claim-form";
import { buttonVariants } from "@/components/ui/button";
import useStakingPosition from "@/hooks/useStakingPosition";
import { GetStakingsByChainIdByAddressResponses } from "@liteflow/sdk/dist/client";
import { Address } from "viem";
import { useAccount } from "wagmi";

export default function Toolbar({
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

  return (
    <div className="flex justify-end gap-6 text-sm">
      <div className="space-y-1">
        <p>Total Staked</p>
        <div
          className={buttonVariants({
            variant: "ghost",
            className: "hover:bg-transparent",
          })}
        >
          <span className="text-primary">
            {staking.depositCurrency?.symbol}
          </span>{" "}
          {position.data ? (
            <NumberFormatter
              value={position.data?.tokensStaked}
              decimals={staking.depositCurrency?.decimals}
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