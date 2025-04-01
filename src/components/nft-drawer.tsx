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
import { useAccount } from "wagmi";

export default function NftDrawer({
  chainId,
  collection,
  nftIds,
  setNftIds,
  children,
}: PropsWithChildren<{
  chainId: number;
  collection: string;
  nftIds: string[];
  setNftIds: (nftIds: string[]) => void;
}>) {
  const account = useAccount();
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
    (tokenId: string) => {
      setLocalNftIds((prev) => {
        if (prev.includes(tokenId)) return prev.filter((id) => id !== tokenId);
        return [...prev, tokenId];
      });
    },
    [setLocalNftIds]
  );

  const submit = useCallback(() => {
    setNftIds(localNftIds.filter((x, i, self) => self.indexOf(x) === i));
    setOpen(false);
  }, [setNftIds, localNftIds, setOpen]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <DrawerHeader>
            <DrawerTitle>Select NFTs to stake</DrawerTitle>
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
                    "size-24 cursor-pointer overflow-hidden rounded-md border bg-gray-100",
                    localNftIds.includes(nft.tokenId) &&
                      "ring-4 ring-primary/50 ring-offset-1"
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
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
            <Button className="w-full" onClick={submit}>
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
