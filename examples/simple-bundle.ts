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