"use client";

import { NumberFormatter } from "@/components/number-formatter";
import ClaimForm from "@/components/staking/claim-form";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  GetStakingsByChainIdByAddressPositionsByUserAddressResponse,
  GetStakingsByChainIdByAddressResponse,
} from "@liteflow/sdk/dist/client";
import { useAccountModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export default function Toolbar({
  staking,
  position,
}: {
  staking: GetStakingsByChainIdByAddressResponse;
  position:
    | GetStakingsByChainIdByAddressPositionsByUserAddressResponse
    | undefined;
}) {
  const account = useAccount();
  const modal = useAccountModal();

  return (
    <div className="flex justify-end gap-6 text-center text-sm">
      {account.isConnected && (
        <Button
          type="button"
          variant="outline"
          onClick={modal.openAccountModal}
          className="mt-6"
        >
          {account.address?.slice(0, 6)}...{account.address?.slice(-4)}
        </Button>
      )}
      <span className="flex-1" />
      <div className="space-y-1">
        <p>Total Staked</p>
        <div
          className={buttonVariants({
            variant: "ghost",
            className: "hover:bg-transparent",
          })}
        >
          <NumberFormatter
            value={position?.tokensStaked ?? 0}
            decimals={staking.depositToken?.decimals}
          />
          <span className="text-primary dark:text-primary-foreground">
            {staking.depositToken?.symbol}
          </span>{" "}
          {staking.depositCollection && (
            <>
              <span className="text-muted-foreground">+</span>
              <NumberFormatter value={position?.nftStaked.length ?? 0} />
              <span className="text-primary dark:text-primary-foreground">
                NFT
              </span>
            </>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p>Current reward</p>
        <ClaimForm staking={staking} position={position} />
      </div>
    </div>
  );
}
