# flashbot-sdk

A simple wrapper for the Flashbots API with TypeScript support and latest
ethers.js compatibility.

[!CAUTION]
This is a work in progress. It is not yet ready for production use.
Some parts of the API are not yet implemented.

List of API endpoints that are implemented:

- [x] eth_sendBundle (`sendBundle`)
- [x] eth_callBundle (`simulate`)
- [ ] eth_sendPrivateTransaction
- [ ] eth_sendPrivateRawTransaction
- [ ] eth_cancelBundle
- [ ] eth_cancelPrivateTransaction
- [x] flashbots_getUserStatsV2 (`getUserStats`)
- [x] flashbots_getBundleStatsV2 (`getBundleStatsV2`)
- [ ] flashbots_getSbundleStats
- [ ] flashbots_setFeeRefundRecipient

## Installation

```bash
npm install flashbot-sdk # any package manager will do
```

## Usage

```typescript
import { Flashbot, Relay } from "flashbot-sdk";
import { JsonRpcProvider } from "ethers";

const provider = new JsonRpcProvider("RPC_URL");
const wallet = new Wallet("PRIVATE_KEY", provider);
const flashbot = new Flashbot(Relay.mainnet, provider, wallet);
```

### Functions

- `sendBundle` - Sends a bundle to the Flashbots relay.

    Parameters:

    ```typescript
    Array<{
        txs: Transaction[];
        blockNumber: HexString;
        minTimestamp?: number;
        maxTimestamp?: number;
        revertingTxHashes?: HexString[];
        replacementUuid?: string;
        builders?: FlashbotBuilders[];
    }>
    ```

- `simulate` - Simulates a bundle on the Flashbots relay.

    Parameters:

    ```typescript
    Array<{
        txs: Transaction[];
        blockNumber: HexString;
        stateBlockNumber: HexString | "latest";
        timestamp?: number;
    }>
    ```

- `getBundleStatsV2` - Gets the stats of a bundle on the Flashbots relay.

    Parameters:

    ```typescript
    Array<{
        bundleHash: HexString;
        blockNumber: HexString;
    }>
    ```

- `waitForInclusion` - Waits for a bundle to be included in a block.

    Parameters:

    ```typescript
    (
        targetBlock: number;
        hashes: HexString[];
    )
    ```

- `getUserStats` - Gets the stats of a user on the Flashbots relay.

    Parameters:

    ```typescript
    Array<{
        blockNumber: HexString;
    }>
    ```

### Example

Simple example of sending a bundle to the Flashbots relay:

```typescript
import { Flashbot, Relays, type HexString } from "../core";
import { JsonRpcProvider, parseEther, parseUnits, Wallet, Transaction } from 'ethers';
import { env } from "bun";

const provider = new JsonRpcProvider(env.RPC!);
const user = new Wallet(env.PK!, provider);
const fb = new Flashbot(Relays.SEPOLIA, user, provider);

(async () => {
    const userNonce = await provider.getTransactionCount(user.address);
    const currentBlock = await provider.getBlock("latest");
    if (!currentBlock?.number) throw new Error("Failed to get current block number");
    if (!currentBlock.baseFeePerGas) throw new Error("Failed to get current block base fee");

    const { number: blockNumber, baseFeePerGas } = currentBlock;
    const maxPriority = parseUnits("20", "gwei");
    const maxFee = fb.calculateEffectiveGas(baseFeePerGas, maxPriority);
    const targetBlock = blockNumber + 2;

    const target = [
        Wallet.createRandom(provider),
        Wallet.createRandom(provider),
    ];

    // Incase you want to get your ethers back.
    // for (const t of target) {
    //     console.log(t.address);
    //     console.log(t.privateKey);
    // }

    const sendAmount = parseEther("0.01");

    const txs = await Promise.all(target.map(async (t, i) => {
        const tx = new Transaction();

        tx.to = t.address;
        tx.value = sendAmount;
        tx.chainId = provider._network.chainId;
        tx.nonce = userNonce + i;
        tx.maxFeePerGas = maxFee;
        tx.maxPriorityFeePerGas = maxPriority;

        const gasLimit = await user.estimateGas(tx);
        tx.gasLimit = gasLimit;

        const signedTx = await user.signTransaction(tx);
        return signedTx;
    })) as HexString[];

    const simulate = await fb.simulate([{
        txs,
        blockNumber: `0x${(targetBlock).toString(16)}`,
        stateBlockNumber: `latest`
    }]);

    await simulate.send();

    console.log(JSON.stringify(simulate.simulationResult, null, 2));

    const hashes = simulate.simulationResult.results.map((r) => r.txHash) as HexString[];
    const inclusion = await fb.waitForInclusion(targetBlock, hashes);

    console.log(inclusion);
})().catch(console.error);
```

You can find more examples in the [examples](https://github.com/on1force/flashbot-sdk/tree/main/examples) folder.

## Author

[on1force](https://github.com/on1force)

## License

[MIT](./LICENSE)