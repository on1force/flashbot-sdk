import { id } from 'ethers';
import type { HDNodeWallet, Wallet, Provider, BigNumberish } from 'ethers';
import {
    Methods,
    type CallBundleData,
    type CallBundleResponse,
    type GetBundleStatsV2Data,
    type GetBundleStatsV2Response,
    type GetUserStatsV2Data,
    type GetUserStatsV2Response,
    type HexString,
    type Relays,
    type SendBundleData,
    type SendBundleResponse,
    type WaitForInclusionResponse
} from '../constants';

/**
 * @class Flashbot
 * 
 * @description Flashbots API wrapper
 * 
 * This class is a wrapper for the Flashbots API
 * with the latest ethers.js support
 */
class Flashbot {
    private readonly relay: Relays;
    private readonly provider: Provider;
    private user: Wallet | HDNodeWallet;
    private readonly defaultBody = {
        jsonrpc: "2.0",
        id: 1,
    }

    /**
     * @constructor
     * 
     * @param relay - Flashbots relay URL
     * @param user - Wallet or HDNodeWallet (required to be connected to the provider)
     * @param provider - ethers.js compatible provider (e.g. JsonRpc, Websocket, etc.)
     */
    constructor(relay: Relays, user: Wallet | HDNodeWallet, provider: Provider) {
        if (!user?.provider) throw new Error("User must have a provider");

        this.relay = relay;
        this.user = user;
        this.provider = provider;
    }

    private async getSignature(body: any) {
        return `${this.user.address}:${await this.user.signMessage(id(JSON.stringify(body)))}`;
    }

    /**
     * @description Calculate effective gas for a transaction (base fee + max priority fee)
     * 
     * @param {BigNumberish} baseFee - Base fee
     * @param {BigNumberish} maxPriority - Max priority fee
     * @returns {BigInt} Effective gas
     * 
     * @example
     * ```ts
     * const block = await this.provider.getBlock("latest");
     * const baseFee = block?.baseFeePerGas;
     * const maxPriority = parseUnits("10", "gwei");
     * const effectiveGas = calculateEffectiveGas(baseFee, maxPriority);
     * 
     * console.log(effectiveGas);
     * ```
     */
    public calculateEffectiveGas(baseFee: BigNumberish, maxPriority: BigNumberish) {
        const effectiveGas = Number(baseFee) + Number(maxPriority);
        return BigInt(effectiveGas);
    }

    /**
     * @description Get user stats
     * 
     * @param {GetUserStatsV2Data[]} params - Parameters
     *  - `blockNumber` - Block number to get stats for
     *  
     * @returns {Promise<GetUserStatsV2Response>}
     * 
     * @example
     * ```ts
     * const stats = await this.getUserStats([{ blockNumber: 17000000 }]);
     * 
     * console.log(stats);
     * ```
     */
    public async getUserStats(params: GetUserStatsV2Data[]): Promise<GetUserStatsV2Response> {
        const body = {
            ...this.defaultBody,
            method: Methods.GET_USER_STATS_V2,
            params,
        }

        const res = await fetch(`${this.relay}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "X-Flashbots-Signature": `${await this.getSignature(body)}`,
            },
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const data = await res.json() as GetUserStatsV2Response;

        if (data.error) throw new Error(data.error);
        if (data.message) throw new Error(data.message);

        return data;
    }

    /**
     * @description Simulate a bundle
     * 
     * @param {CallBundleData[]} params - Parameters
     * 
     * - `txs` - Array of signed transactions
     * - `blockNumber` - A hexstring representing the block number to simulate for
     * - `stateBlockNumber` - (optional) State block to simulate for. Can be "latest" or a hexstring representing the block number
     * - `timestamp` - (optional) Timestamp to simulate for
     * 
     * @returns {Promise<CallBundleResponse>}
     * 
     * @example
     * ```ts
     * const simulation = await flashbot.simulate([{ txs: [tx], blockNumber: 17000000 }]);
     * 
     * console.log(simulation);
     * 
     * // You can also send the bundle after simulation
     * // this is the same as calling flashbot.sendBundle(params)
     * const bundle = await simulation.send();
     * 
     * console.log(bundle);
     * ```
     */
    public async simulate(params: CallBundleData[]):
        Promise<{
            simulationResult: CallBundleResponse["result"];
            send: () => Promise<SendBundleResponse>;
        }> {
        const body = {
            ...this.defaultBody,
            method: Methods.CALL_BUNDLE,
            params,
        }

        const res = await fetch(`${this.relay}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "X-Flashbots-Signature": `${await this.getSignature(body)}`,
            },
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const data = await res.json() as CallBundleResponse;

        if (data.error) throw new Error(data.error.message);

        return {
            simulationResult: data.result,
            send: () => this.sendBundle(params),
        }
    }

    /**
     * @description Send a bundle
     * 
     * @param {SendBundleData[]} params - Parameters
     * 
     * - `txs` - Array of signed transactions
     * - `blockNumber` - A hexstring representing the block number to send the bundle for
     * - `minTimestamp` - (optional) Minimum timestamp to send the bundle for
     * - `maxTimestamp` - (optional) Maximum timestamp to send the bundle for
     * - `revertingTxHashes` - (optional) Array of hashes of reverting transactions
     * - `replacementUuid` - (optional) UUID of the bundle to replace
     * - `builders` - (optional) Array of builders to send the bundle to
     * 
     * @returns {Promise<SendBundleResponse>}
     * 
     * @example
     * ```ts
     * const bundle = await this.sendBundle([{ txs: [tx], blockNumber: 17000000 }]);
     * 
     * console.log(bundle);
     * ```
     */
    public async sendBundle(params: SendBundleData[]): Promise<SendBundleResponse> {
        const body = {
            ...this.defaultBody,
            method: Methods.SEND_BUNDLE,
            params,
        }

        const res = await fetch(`${this.relay}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "X-Flashbots-Signature": `${await this.getSignature(body)}`,
            },
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const data = await res.json() as SendBundleResponse;

        if (data.error) throw new Error(data.error.message);

        return data;
    }

    /**
     * @description Get status of bundle
     * 
     * this is somewhat unstable and may not work as expected,
     * cause sometimes the bundle is already included in a block
     * and the status is not updated.
     * 
     * refer to using `waitForInclusion` instead
     * 
     * @param {GetBundleStatsV2Data[]} params - Parameters
     * 
     * - `bundleHash` - Bundle hash
     * - `blockNumber` - Block number to get stats for
     * 
     * @returns {Promise<GetBundleStatsV2Response>}
     * 
     * @example
     * ```ts
     * const status = await this.getBundleStats([{ bundleHash: "0x...", blockNumber: 17000000 }]);
     * 
     * console.log(status);
     * ```
     */
    public async getBundleStatsV2(params: GetBundleStatsV2Data[]): Promise<GetBundleStatsV2Response> {
        const body = {
            ...this.defaultBody,
            method: Methods.GET_BUNDLE_STATS_V2,
            params,
        }

        const res = await fetch(`${this.relay}`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "X-Flashbots-Signature": `${await this.getSignature(body)}`,
            },
        });

        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

        const data = await res.json() as GetBundleStatsV2Response;

        return data;
    }

    /**
     * @description Wait for bundle to be included in a block
     * 
     * This is a more reliable way to check if a bundle is included in a block
     * by listening for the block and checking if the transaction hashes are included
     * in the target block.
     * 
     * @param targetBlock - Target block number
     * @param hashes - Array of transaction hashes
     * @returns {Promise<{ status: "success" | "passed", blockNumber: number, transactions: HexString[] }>}
     */
    public async waitForInclusion(targetBlock: number, hashes: HexString[]): Promise<WaitForInclusionResponse> {
        return new Promise((resolve, reject) => {
            const blockHandler = async (blockNum: number) => {
                const tx = await this.provider.getBlock(blockNum);
                if (!tx?.transactions || tx.transactions.length === 0) return;

                const transactions = tx.transactions.map((tx) => tx) as HexString[];

                if (transactions.some((tx) => hashes.includes(tx))) {
                    this.provider.removeListener("block", blockHandler);
                    resolve({
                        status: "success",
                        blockNumber: blockNum,
                        transactions: transactions.filter((tx) => hashes.includes(tx)),
                    });
                }

                if (blockNum >= targetBlock) {
                    this.provider.removeListener("block", blockHandler);
                    resolve({
                        status: "passed",
                        blockNumber: blockNum,
                        transactions: [],
                    });
                }
            }

            this.provider.on("block", blockHandler);
        });
    }
}

export default Flashbot;