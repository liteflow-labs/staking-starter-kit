import { useMutation } from "@tanstack/react-query";
import { Address } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";

const ABI_TOKEN = [
  {
    inputs: [{ internalType: "uint256", name: "_amount", type: "uint256" }],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const ABI_MULTI_ASSET = [
  {
    inputs: [
      { internalType: "uint256", name: "_amount", type: "uint256" },
      { internalType: "uint256[]", name: "nftIds_", type: "uint256[]" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default function useWithdraw(multiAssetStaking: boolean) {
  const chain = useSwitchChain();
  const withdrawTx = useWriteContract();
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
        return await withdrawTx.writeContractAsync({
          chainId,
          abi: ABI_MULTI_ASSET,
          address: contract,
          functionName: "withdraw",
          args: [amount, nftIds],
        });
      return await withdrawTx.writeContractAsync({
        chainId,
        abi: ABI_TOKEN,
        address: contract,
        functionName: "withdraw",
        args: [amount],
      });
    },
  });
}
