import { useMutation } from "@tanstack/react-query";
import { getAddress } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";

const ABI = [
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default function useClaim() {
  const chain = useSwitchChain();
  const claimTx = useWriteContract();
  return useMutation({
    mutationFn: async ({
      chainId,
      contractAddress,
    }: {
      chainId: number;
      contractAddress: string;
    }) => {
      await chain.switchChainAsync({ chainId });
      return await claimTx.writeContractAsync({
        chainId,
        abi: ABI,
        address: getAddress(contractAddress),
        functionName: "claimRewards",
      });
    },
  });
}
