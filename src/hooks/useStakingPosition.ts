import liteflow from "@/lib/liteflow";
import { useQuery } from "@tanstack/react-query";

export const stakingPositionKey = (opts: {
  chainId: number;
  address: string;
  userAddress: string;
}) => ["staking-position", opts];

export default function useStakingPosition(
  chainId: number,
  address: string,
  userAddress: string
) {
  return useQuery({
    queryFn: async () => {
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
