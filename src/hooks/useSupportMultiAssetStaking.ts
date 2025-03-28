import { getAddress } from "viem";
import { useReadContract } from "wagmi";

const MULTI_ASSET_STAKING_INTERFACE_ID = "0x43d9f2be";

export default function useSupportMultiAssetStaking({
  chainId,
  contractAddress,
}: {
  chainId: number;
  contractAddress: string;
}) {
  const res = useReadContract({
    abi: [
      {
        name: "supportsInterface",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "interfaceId", type: "bytes4" }],
        outputs: [{ name: "result", type: "bool" }],
      },
    ],
    chainId,
    address: getAddress(contractAddress),
    functionName: "supportsInterface",
    args: [MULTI_ASSET_STAKING_INTERFACE_ID],
  });
  return {
    isLoading: res.isLoading,
    data: res.error ? false : !!res.data,
  };
}
