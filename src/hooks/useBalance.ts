import { Address, erc20Abi, getAddress } from "viem";
import { useReadContract } from "wagmi";

export default function useTokenBalance({
  chainId,
  token,
  address,
}: {
  chainId: number;
  token: string | undefined;
  address: string | undefined;
}) {
  return useReadContract({
    query: {
      enabled: !!token && !!address,
    },
    abi: erc20Abi,
    chainId,
    address: token ? getAddress(token) : undefined,
    functionName: "balanceOf",
    args: [address ? getAddress(address) : ("" as Address)],
  });
}
