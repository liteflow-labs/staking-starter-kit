import { useMutation } from "@tanstack/react-query";
import { Address, erc721Abi } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";

export default function useApproveCollection() {
  const chain = useSwitchChain();
  const approveTx = useWriteContract();
  return useMutation({
    mutationFn: async ({
      chainId,
      collection,
      contract,
    }: {
      chainId: number;
      collection: Address;
      contract: Address;
    }) => {
      await chain.switchChainAsync({ chainId });
      return await approveTx.writeContractAsync({
        chainId,
        abi: erc721Abi,
        address: collection,
        functionName: "setApprovalForAll",
        args: [contract, true],
      });
    },
  });
}
