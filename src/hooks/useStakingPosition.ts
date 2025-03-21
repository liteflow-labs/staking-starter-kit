import liteflow from "@/lib/liteflow";
import { useQuery } from "@tanstack/react-query";

export const stakingPositionKey = (opts: {
  chainId: number;
  address: string;
  userAddress: string | undefined;
}) => ["staking-position", opts];

export default function useStakingPosition(
  chainId: number,
  address: string,
  userAddress: string | undefined
) {
  return useQuery({
    enabled: !!userAddress,
    queryFn: async () => {
      if (!userAddress) throw new Error("missing user address");
      const res = await liteflow.stakingPosition.retrieve(
        chainId,
        address,
        userAddress
      );
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    queryKey: stakingPositionKey({ chainId, address, userAddress }),
  });
}
