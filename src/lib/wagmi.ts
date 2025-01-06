import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  lightlinkPegasus,
  lightlinkPhoenix,
  mainnet,
  neonDevnet,
  neonMainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from "viem/chains";
import {
  cookieStorage,
  createConfig,
  CreateConfigParameters,
  createStorage,
  http,
} from "wagmi";
import { z } from "zod";

const env = z
  .object({
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string(),
  })
  .parse({
    // need to explicitly reference the key in process.env otherwise the value will be undefined client-side
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  });

export const mainnets = [
  mainnet,
  bsc,
  polygon,
  arbitrum,
  base,
  neonMainnet,
  lightlinkPhoenix,
] as const;

export const testnets = [
  sepolia,
  bscTestnet,
  polygonAmoy,
  arbitrumSepolia,
  baseSepolia,
  neonDevnet,
  lightlinkPegasus,
] as const;

const chains = [...mainnets, ...testnets] as const;

const wagmiConfigRaw: CreateConfigParameters = {
  chains: chains,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: chains.reduce(
    (acc, chain) => ({ ...acc, [chain.id]: http() }),
    {}
  ),
};

export const wagmiConfig = createConfig(wagmiConfigRaw);

export function initWagmiConfig() {
  return getDefaultConfig({
    ...wagmiConfigRaw,
    appName: "Application powered by Liteflow",
    projectId: env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  });
}
