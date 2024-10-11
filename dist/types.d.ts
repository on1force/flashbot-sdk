import type { Provider, HDNodeWallet, Wallet, BigNumberish } from "ethers";

declare module "flashbot-sdk" {
    /**
     * @class Flashbot
     * 
     * @description Flashbots API wrapper
     */
    class Flashbot {
        /**
         * @constructor
         * 
         * @param relay - Flashbots relay URL
         * @param user - Wallet or HDNodeWallet (required to be connected to the provider)
         * @param provider - ethers.js compatible provider (e.g. JsonRpc, Websocket, etc.)
         */
        constructor(relay: Relays, user: Wallet | HDNodeWallet, provider: Provider);

        /**
         * @method calculateEffectiveGas
         * @description Calculate the effective gas price for a bundle
         * 
         * @param baseFee - Base fee
         * @param maxPriority - Max priority fee
         * 
         * @returns BigInt
         */
        calculateEffectiveGas(baseFee: BigNumberish, maxPriority: BigNumberish): BigInt;

        /**
         * @method getUserStats
         * @description Get user stats
         * 
         * @param data - GetUserStatsV2Data[]
         * 
         * @returns Promise<GetUserStatsV2Response>
         */
        async getUserStats(data: GetUserStatsV2Data[]): Promise<GetUserStatsV2Response>;

        /**
         * @method simulate
         * @description Simulate a bundle
         * 
         * @param data - CallBundleData[]
         * 
         * @returns Promise<{
         *      simulationResult: CallBundleResponse["result"];
         *      send: () => Promise<SendBundleResponse>;
         * }>
         */
        async simulate(data: CallBundleData[]): Promise<{
            simulationResult: CallBundleResponse["result"];
            send: () => Promise<SendBundleResponse>;
        }>;

        /**
         * @method sendBundle
         * @description Send a bundle
         * 
         * @param data - SendBundleData[]
         * 
         * @returns Promise<SendBundleResponse>
         */
        async sendBundle(data: SendBundleData[]): Promise<SendBundleResponse>;

        /**
         * @method getBundleStatsV2
         * @description Get bundle stats
         * 
         * @param data - GetBundleStatsV2Data[]
         * 
         * @returns Promise<GetBundleStatsV2Response>
         */
        async getBundleStatsV2(data: GetBundleStatsV2Data[]): Promise<GetBundleStatsV2Response>;

        /**
         * @method waitForInclusion
         * @description Wait for inclusion of a bundle
         * 
         * @param targetBlock - Target block
         * @param hashes - Array of transaction hashes
         */
        async waitForInclusion(targetBlock: number, hashes: HexString[]): Promise<WaitForInclusionResponse>;
    };

    declare type HexString = `0x${string}`;

    declare type FlashbotBuilders =
        | "default"
        | 'flashbots'
        | 'f1b.io'
        | 'rsync'
        | 'beaverbuild.org'
        | 'builder0x69'
        | 'Titan'
        | 'EigenPhi'
        | 'boba-builder'
        | 'Gambit Labs'
        | 'payload'
        | 'Loki'
        | 'BuildAI'
        | 'JetBuilder'
        | 'tbuilder'
        | 'penguinbuild'
        | 'bobthebuilder'
        | 'BTCS'
        | 'bloXroute'

    declare type HintNames =
        | 'calldata'
        | 'logs'
        | 'default_logs'
        | 'function_selector'
        | 'contract_address'
        | 'hash'
        | 'tx_hash';


    declare enum Relays {
        MAINNET = "https://relay.flashbots.net",
        SEPOLIA = "https://relay-sepolia.flashbots.net",
        GOERLI = "https://relay-goerli.flashbots.net",
    }

    declare enum Methods {
        GET_USER_STATS_V2 = "flashbots_getUserStatsV2",
        GET_BUNDLE_STATS_V2 = "flashbots_getBundleStatsV2",
        SEND_PRIVATE_TRANSACTION = "eth_sendPrivateTransaction",
        SEND_PRIVATE_RAW_TRANSACTION = "eth_sendPrivateRawTransaction",
        CANCEL_BUNDLE = "eth_cancelBundle",
        CALL_BUNDLE = "eth_callBundle",
        SEND_BUNDLE = "eth_sendBundle",
    }

    declare interface GetBundleStatsV2Data {
        bundleHash: HexString; // Bundle hash
        blockNumber: HexString; // Block number to get the bundle stats in
    }

    declare interface GetUserStatsV2Data {
        blockNumber: HexString; // Block number to get the user stats in
    }

    declare interface CancelBundleData {
        txHash: HexString; // Transaction hash
    }

    declare interface SendPrivateRawTransactionData {
        tx: HexString; // Transaction hash
        preferences?: {
            fast: boolean; // Whether to use the fast relay
            privacy?: {
                hints?: Array<HintNames>; // Array of hint names
                builders?: Array<FlashbotBuilders> // Array of builders to use
            },
            validity?: {
                refund?: Array<{
                    address: HexString; // Address to refund
                    percent: number; // Percentage to refund
                }>
            }
        }
    }

    declare interface SendPrivateTransactionData extends SendPrivateRawTransactionData {
        maxBlockNumber?: HexString; // Maximum block number to send the transaction in
    }

    declare interface CallBundleData {
        txs: Array<HexString>; // Array of transaction hashes
        blockNumber: HexString; // Block number to send the bundle in
        stateBlockNumber: HexString | "latest"; // Block number to send the bundle in
        timestamp?: number; // Timestamp to send the bundle in
    }

    declare interface SendBundleData {
        txs: Array<HexString>; // Array of transaction hashes
        blockNumber: HexString; // Block number to send the bundle in
        minTimestamp?: number; // Minimum timestamp for the bundle 
        maxTimestamp?: number; // Maximum timestamp for the bundle
        revertingTxHashes?: Array<HexString>; // Array of transaction hashes that are expected to revert
        replacementUuid?: string; // UUID of the bundle to replace
        builders?: Array<FlashbotBuilders>; // Array of builders to use
    }

    declare interface GetUserStatsV2Response {
        id: number
        result: {
            allTimeGasSimulated: string
            allTimeValidatorPayments: string
            isHighPriority: boolean
            last1dGasSimulated: string
            last1dValidatorPayments: string
            last7dGasSimulated: string
            last7dValidatorPayments: string
        }
        jsonrpc: string
        error?: string;
        message?: string;
    }

    declare interface CallBundleResponse {
        id: number
        jsonrpc: string
        result: {
            results: Array<{
                txHash: string
                gasUsed: number
                gasPrice: string
                gasFees: string
                fromAddress: string
                toAddress: string
                coinbaseDiff: string
                ethSentToCoinbase: string
                error?: string
                value: string
            }>
            coinbaseDiff: string
            gasFees: string
            ethSentToCoinbase: string
            bundleGasPrice: string
            totalGasUsed: number
            stateBlockNumber: number
            bundleHash: string
        }
        error?: {
            code: number
            message: string
        }
    }

    declare interface SendBundleResponse {
        id: number
        jsonrpc: string
        result: {
            bundleHash: string;
            smart?: boolean;
        },
        error?: {
            code: number
            message: string
        }
    }

    declare interface GetBundleStatsV2Response {
        id: number
        result: {
            isSimulated: boolean
            isHighPriority?: boolean
            receivedAt?: string
            simulatedAt?: string
        }
        jsonrpc: string
    }

    declare interface WaitForInclusionResponse {
        status: "success" | "passed";
        blockNumber: number;
        transactions: HexString[];
    }
}