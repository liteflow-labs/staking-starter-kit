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
    NEXT_PUBLIC_ETHEREUM_MAINNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_ETHEREUM_SEPOLIA_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_BSC_MAINNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_BSC_TESTNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_POLYGON_MAINNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_POLYGON_AMOY_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_BASE_MAINNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_BASE_SEPOLIA_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_NEONEVM_MAINNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_NEONEVM_DEVNET_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_LIGHTLINK_PEGASUS_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_LIGHTLINK_PHOENIX_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_ARBITRUM_ONE_PROVIDER_URL: z.string().url().optional(),
    NEXT_PUBLIC_ARBITRUM_SEPOLIA_PROVIDER_URL: z.string().url().optional(),
  })
  .parse({
    // need to explicitly reference the key in process.env otherwise the value will be undefined client-side
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
    NEXT_PUBLIC_ETHEREUM_MAINNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_PROVIDER_URL,
    NEXT_PUBLIC_ETHEREUM_SEPOLIA_PROVIDER_URL:
      process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_PROVIDER_URL,
    NEXT_PUBLIC_BSC_MAINNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_BSC_MAINNET_PROVIDER_URL,
    NEXT_PUBLIC_BSC_TESTNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_BSC_TESTNET_PROVIDER_URL,
    NEXT_PUBLIC_POLYGON_MAINNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_POLYGON_MAINNET_PROVIDER_URL,
    NEXT_PUBLIC_POLYGON_AMOY_PROVIDER_URL:
      process.env.NEXT_PUBLIC_POLYGON_AMOY_PROVIDER_URL,
    NEXT_PUBLIC_BASE_MAINNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_BASE_MAINNET_PROVIDER_URL,
    NEXT_PUBLIC_BASE_SEPOLIA_PROVIDER_URL:
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_PROVIDER_URL,
    NEXT_PUBLIC_NEONEVM_MAINNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_NEONEVM_MAINNET_PROVIDER_URL,
    NEXT_PUBLIC_NEONEVM_DEVNET_PROVIDER_URL:
      process.env.NEXT_PUBLIC_NEONEVM_DEVNET_PROVIDER_URL,
    NEXT_PUBLIC_LIGHTLINK_PEGASUS_PROVIDER_URL:
      process.env.NEXT_PUBLIC_LIGHTLINK_PEGASUS_PROVIDER_URL,
    NEXT_PUBLIC_LIGHTLINK_PHOENIX_PROVIDER_URL:
      process.env.NEXT_PUBLIC_LIGHTLINK_PHOENIX_PROVIDER_URL,
    NEXT_PUBLIC_ARBITRUM_ONE_PROVIDER_URL:
      process.env.NEXT_PUBLIC_ARBITRUM_ONE_PROVIDER_URL,
    NEXT_PUBLIC_ARBITRUM_SEPOLIA_PROVIDER_URL:
      process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_PROVIDER_URL,
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

const providerUrl = {
  [mainnet.id]: process.env.NEXT_PUBLIC_ETHEREUM_MAINNET_PROVIDER_URL,
  [sepolia.id]: process.env.NEXT_PUBLIC_ETHEREUM_SEPOLIA_PROVIDER_URL,
  [bsc.id]: process.env.NEXT_PUBLIC_BSC_MAINNET_PROVIDER_URL,
  [bscTestnet.id]: process.env.NEXT_PUBLIC_BSC_TESTNET_PROVIDER_URL,
  [polygon.id]: process.env.NEXT_PUBLIC_POLYGON_MAINNET_PROVIDER_URL,
  [polygonAmoy.id]: process.env.NEXT_PUBLIC_POLYGON_AMOY_PROVIDER_URL,
  [base.id]: process.env.NEXT_PUBLIC_BASE_MAINNET_PROVIDER_URL,
  [baseSepolia.id]: process.env.NEXT_PUBLIC_BASE_SEPOLIA_PROVIDER_URL,
  [neonMainnet.id]: process.env.NEXT_PUBLIC_NEONEVM_MAINNET_PROVIDER_URL,
  [neonDevnet.id]: process.env.NEXT_PUBLIC_NEONEVM_DEVNET_PROVIDER_URL,
  [lightlinkPegasus.id]: process.env.NEXT_PUBLIC_LIGHTLINK_PEGASUS_PROVIDER_URL,
  [lightlinkPhoenix.id]: process.env.NEXT_PUBLIC_LIGHTLINK_PHOENIX_PROVIDER_URL,
  [arbitrum.id]: process.env.NEXT_PUBLIC_ARBITRUM_ONE_PROVIDER_URL,
  [arbitrumSepolia.id]: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_PROVIDER_URL,
} as const;

const chains = [...mainnets, ...testnets] as const;

const wagmiConfigRaw: CreateConfigParameters = {
  chains: chains,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  transports: chains.reduce(
    (acc, chain) => ({ ...acc, [chain.id]: http(providerUrl[chain.id]) }),
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
