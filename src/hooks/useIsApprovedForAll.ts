import { erc721Abi, getAddress } from "viem";
import { useReadContract } from "wagmi";

export default function useIsApprovedForAll({
  chainId,
  collection,
  owner,
  operator,
}: {
  chainId: number;
  collection?: string;
  owner?: string;
  operator: string;
}) {
  return useReadContract({
    query: {
      enabled: !!collection && !!owner,
    },
    abi: erc721Abi,
    chainId,
    address: collection ? getAddress(collection) : undefined,
    functionName: "isApprovedForAll",
    args: [
      owner ? getAddress(owner) : ("" as `0x${string}`),
      getAddress(operator),
    ],
  });
}
