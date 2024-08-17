export type HexString = `0x${string}`;

export type FlashbotBuilders =
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

export type HintNames =
    | 'calldata'
    | 'logs'
    | 'default_logs'
    | 'function_selector'
    | 'contract_address'
    | 'hash'
    | 'tx_hash';


export enum Relays {
    MAINNET = "https://relay.flashbots.net",
    SEPOLIA = "https://relay-sepolia.flashbots.net",
    GOERLI = "https://relay-goerli.flashbots.net",
}

export enum Methods {
    GET_USER_STATS_V2 = "flashbots_getUserStatsV2",
    GET_BUNDLE_STATS_V2 = "flashbots_getBundleStatsV2",
    SEND_PRIVATE_TRANSACTION = "eth_sendPrivateTransaction",
    SEND_PRIVATE_RAW_TRANSACTION = "eth_sendPrivateRawTransaction",
    CANCEL_BUNDLE = "eth_cancelBundle",
    CALL_BUNDLE = "eth_callBundle",
    SEND_BUNDLE = "eth_sendBundle",
}

export interface GetBundleStatsV2Data {
    bundleHash: HexString; // Bundle hash
    blockNumber: HexString; // Block number to get the bundle stats in
}

export interface GetUserStatsV2Data {
    blockNumber: HexString; // Block number to get the user stats in
}

export interface CancelBundleData {
    txHash: HexString; // Transaction hash
}

export interface SendPrivateRawTransactionData {
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

export interface SendPrivateTransactionData extends SendPrivateRawTransactionData {
    maxBlockNumber?: HexString; // Maximum block number to send the transaction in
}

export interface CallBundleData {
    txs: Array<HexString>; // Array of transaction hashes
    blockNumber: HexString; // Block number to send the bundle in
    stateBlockNumber: HexString | "latest"; // Block number to send the bundle in
    timestamp?: number; // Timestamp to send the bundle in
}

export interface SendBundleData {
    txs: Array<HexString>; // Array of transaction hashes
    blockNumber: HexString; // Block number to send the bundle in
    minTimestamp?: number; // Minimum timestamp for the bundle 
    maxTimestamp?: number; // Maximum timestamp for the bundle
    revertingTxHashes?: Array<HexString>; // Array of transaction hashes that are expected to revert
    replacementUuid?: string; // UUID of the bundle to replace
    builders?: Array<FlashbotBuilders>; // Array of builders to use
}

export interface GetUserStatsV2Response {
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

export interface CallBundleResponse {
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

export interface SendBundleResponse {
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

export interface GetBundleStatsV2Response {
    id: number
    result: {
        isSimulated: boolean
        isHighPriority?: boolean
        receivedAt?: string
        simulatedAt?: string
    }
    jsonrpc: string
}

export interface WaitForInclusionResponse {
    status: "success" | "passed";
    blockNumber: number;
    transactions: HexString[];
}

