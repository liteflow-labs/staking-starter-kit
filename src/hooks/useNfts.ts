import liteflow from "@/lib/liteflow";
import { useQuery } from "@tanstack/react-query";

export default function useNfts({
  chainId,
  collection,
  owner,
}: {
  chainId: number;
  collection: string;
  owner: string | undefined;
}) {
  return useQuery({
    queryFn: async () => {
      const res = await liteflow.nfts.list({
        chainId,
        collection,
        owner,
      });
      if (res.error) throw new Error(res.error.message);
      return res.data;
    },
    enabled: !!owner,
    queryKey: ["nfts", { chainId, collection, owner }],
  });
}
