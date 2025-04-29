import { erc20Abi, getAddress } from "viem";
import { useReadContract } from "wagmi";

export default function useAllowance({
  chainId,
  token,
  owner,
  spender,
}: {
  chainId: number;
  token?: string;
  owner?: string;
  spender: string;
}) {
  return useReadContract({
    query: {
      enabled: !!token && !!owner,
    },
    abi: erc20Abi,
    chainId,
    address: token ? getAddress(token) : undefined,
    functionName: "allowance",
    args: [
      owner ? getAddress(owner) : ("" as `0x${string}`),
      getAddress(spender),
    ],
  });
}
