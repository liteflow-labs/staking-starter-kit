import liteflow from "@/lib/liteflow";
import { useQuery } from "@tanstack/react-query";

export default function useSimulation({
  chainId,
  address,
  opts,
}: {
  chainId: number;
  address: string;
  opts: {
    tokenStaked: bigint | undefined;
    nftStaked: number;
  };
}) {
  return useQuery({
    enabled: !!chainId && !!address && !!opts.tokenStaked,
    queryFn: async () => {
      const res = await liteflow.stakingSimulation.retrieve(chainId, address, {
        tokenStaked: opts.tokenStaked?.toString(),
        nftStaked: opts.nftStaked,
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    queryKey: [
      "simulation",
      {
        chainId,
        address,
        tokenStaked: opts.tokenStaked?.toString(),
        nftStaked: opts.nftStaked,
      },
    ],
  });
}
