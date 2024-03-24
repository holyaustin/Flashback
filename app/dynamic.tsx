"use client";
import {
    DynamicContextProvider,
    DynamicWidget,
  } from "@dynamic-labs/sdk-react-core";
  import { EthersExtension } from "@dynamic-labs/ethers-v5";
  
  import { AlgorandWalletConnectors } from "@dynamic-labs/algorand";
  import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
  import { CosmosWalletConnectors } from "@dynamic-labs/cosmos";
  import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
  import { FlowWalletConnectors } from "@dynamic-labs/flow";
  import { SolanaWalletConnectors } from "@dynamic-labs/solana";
  import { StarknetWalletConnectors } from "@dynamic-labs/starknet";
  
  export const Dynamic = () => {
    return (
      <DynamicContextProvider
        settings={{
          // Find your environment id at https://app.dynamic.xyz/dashboard/developer
          environmentId: "bf1d0314-1d62-4467-93b7-597b6f626ba2",
          walletConnectorExtensions: [EthersExtension],
          walletConnectors: [
            AlgorandWalletConnectors,
            BitcoinWalletConnectors,
            CosmosWalletConnectors,
            EthereumWalletConnectors,
            FlowWalletConnectors,
            SolanaWalletConnectors,
            StarknetWalletConnectors
          ],
        }}
      >
        <DynamicWidget />
      </DynamicContextProvider>
    );
  };