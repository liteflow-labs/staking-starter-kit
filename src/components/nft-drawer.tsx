"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import useNfts from "@/hooks/useNfts";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { maxUint256 } from "viem";
import { useAccount } from "wagmi";

export default function NftDrawer({
  chainId,
  collection,
  maxNftQuantity,
  children,
}: PropsWithChildren<{
  chainId: number;
  collection: string;
  maxNftQuantity: bigint;
}>) {
  const account = useAccount();
  const form = useFormContext<{ nftIds: string[] }>();
  const nftIds = form.watch("nftIds");

  const nfts = useNfts({
    chainId,
    collection,
    owner: account.address,
  });

  const [open, setOpen] = useState(false);
  const [localNftIds, setLocalNftIds] = useState<string[]>(nftIds);

  useEffect(() => {
    setLocalNftIds(nftIds);
  }, [nftIds]);

  const toggleNft = useCallback(
    (tokenId: string | undefined) => {
      if (!tokenId) return;
      if (
        !localNftIds.includes(tokenId) &&
        BigInt(localNftIds.length) >= maxNftQuantity
      )
        return;
      setLocalNftIds((prev) => {
        if (prev.includes(tokenId)) return prev.filter((id) => id !== tokenId);
        return [...prev, tokenId];
      });
    },
    [setLocalNftIds, localNftIds, maxNftQuantity]
  );

  const submit = useCallback(() => {
    form.setValue(
      "nftIds",
      localNftIds.filter((x, i, self) => self.indexOf(x) === i),
      { shouldValidate: true }
    );
    setOpen(false);
  }, [form, localNftIds, setOpen]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <DrawerHeader>
            <DrawerTitle>
              Select NFTs to stake ({localNftIds.length}/
              {maxNftQuantity === maxUint256 ? <>&infin;</> : maxNftQuantity})
            </DrawerTitle>
            <DrawerDescription>
              Increase your rewards by staking NFTs.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-wrap gap-4 p-4 pb-0">
            {nfts.isLoading ? (
              <>
                <div className="size-24 rounded-md border bg-gray-100" />
                <div className="size-24 rounded-md border bg-gray-100" />
                <div className="size-24 rounded-md border bg-gray-100" />
                <div className="size-24 rounded-md border bg-gray-100" />
              </>
            ) : nfts.error ? (
              <p className="text-destructive">{nfts.error.message}</p>
            ) : !nfts.data || nfts.data.data.length === 0 ? (
              <p className="text-muted-foreground">No NFTs found</p>
            ) : (
              nfts.data.data.map((nft) => (
                <a
                  onClick={() => toggleNft(nft.tokenId)}
                  key={nft.tokenId}
                  className={cn(
                    "size-24 overflow-hidden rounded-md border bg-gray-100",
                    localNftIds.includes(nft.tokenId)
                      ? "cursor-pointer ring-4 ring-primary/50 ring-offset-1"
                      : localNftIds.length >= maxNftQuantity
                        ? "cursor-default opacity-50"
                        : "cursor-pointer"
                  )}
                >
                  {nft.image && (
                    <Image
                      className="size-full object-cover"
                      src={nft.image}
                      alt={nft.name}
                      width={96}
                      height={96}
                    />
                  )}
                </a>
              ))
            )}
          </div>
          <DrawerFooter className="flex flex-row justify-between gap-4">
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
            <Button type="button" className="w-full" onClick={submit}>
              Select{" "}
              {localNftIds.length === 0
                ? "no NFTs"
                : localNftIds.length === 1
                  ? "1 NFT"
                  : `${localNftIds.length.toString()} NFTs`}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
