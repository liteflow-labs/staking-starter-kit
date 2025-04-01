import { useMutation } from "@tanstack/react-query";
import { Address } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";

const ABI_TOKEN = [
  {
    inputs: [
      { internalType: "uint256", name: "tokenAmount_", type: "uint256" },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const ABI_MULTI_ASSET = [
  {
    inputs: [
      { internalType: "uint256", name: "tokenAmount_", type: "uint256" },
      { internalType: "uint256[]", name: "nftIds_", type: "uint256[]" },
    ],
    name: "stake",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export default function useStake(multiAssetStaking: boolean) {
  const chain = useSwitchChain();
  const stakeTx = useWriteContract();
  return useMutation({
    mutationFn: async ({
      chainId,
      contract,
      amount,
      nftIds,
    }: {
      chainId: number;
      contract: Address;
      amount: bigint;
      nftIds: bigint[];
    }) => {
      await chain.switchChainAsync({ chainId });
      if (multiAssetStaking)
        return await stakeTx.writeContractAsync({
          chainId,
          abi: ABI_MULTI_ASSET,
          address: contract,
          functionName: "stake",
          args: [amount, nftIds],
        });
      return await stakeTx.writeContractAsync({
        chainId,
        abi: ABI_TOKEN,
        address: contract,
        functionName: "stake",
        args: [amount],
      });
    },
  });
}
