import { useMutation } from "@tanstack/react-query";
import { Address, erc20Abi } from "viem";
import { useSwitchChain, useWriteContract } from "wagmi";

export default function useApproveToken() {
  const chain = useSwitchChain();
  const approveTx = useWriteContract();
  return useMutation({
    mutationFn: async ({
      chainId,
      token,
      contract,
      amount,
    }: {
      chainId: number;
      token: Address;
      contract: Address;
      amount: bigint;
    }) => {
      await chain.switchChainAsync({ chainId });
      return await approveTx.writeContractAsync({
        chainId,
        abi: erc20Abi,
        address: token,
        functionName: "approve",
        args: [contract, amount],
      });
    },
  });
}
