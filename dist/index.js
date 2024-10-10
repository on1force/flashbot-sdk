// core/flashbot.ts
import { id } from "ethers";

// constants/types.ts
var Relays;
((Relays2) => {
  Relays2["MAINNET"] = "https://relay.flashbots.net";
  Relays2["SEPOLIA"] = "https://relay-sepolia.flashbots.net";
  Relays2["GOERLI"] = "https://relay-goerli.flashbots.net";
})(Relays ||= {});
var Methods;
((Methods2) => {
  Methods2["GET_USER_STATS_V2"] = "flashbots_getUserStatsV2";
  Methods2["GET_BUNDLE_STATS_V2"] = "flashbots_getBundleStatsV2";
  Methods2["SEND_PRIVATE_TRANSACTION"] = "eth_sendPrivateTransaction";
  Methods2["SEND_PRIVATE_RAW_TRANSACTION"] = "eth_sendPrivateRawTransaction";
  Methods2["CANCEL_BUNDLE"] = "eth_cancelBundle";
  Methods2["CALL_BUNDLE"] = "eth_callBundle";
  Methods2["SEND_BUNDLE"] = "eth_sendBundle";
})(Methods ||= {});
// core/flashbot.ts
class Flashbot {
  relay;
  provider;
  user;
  defaultBody = {
    jsonrpc: "2.0",
    id: 1
  };
  constructor(relay, user, provider) {
    if (!user?.provider)
      throw new Error("User must have a provider");
    this.relay = relay;
    this.user = user;
    this.provider = provider;
  }
  async getSignature(body) {
    return `${this.user.address}:${await this.user.signMessage(id(JSON.stringify(body)))}`;
  }
  calculateEffectiveGas(baseFee, maxPriority) {
    const effectiveGas = Number(baseFee) + Number(maxPriority);
    return BigInt(effectiveGas);
  }
  async getUserStats(params) {
    const body = {
      ...this.defaultBody,
      method: "flashbots_getUserStatsV2" /* GET_USER_STATS_V2 */,
      params
    };
    const res = await fetch(`${this.relay}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "X-Flashbots-Signature": `${await this.getSignature(body)}`
      }
    });
    if (!res.ok)
      throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (data.error)
      throw new Error(data.error);
    if (data.message)
      throw new Error(data.message);
    return data;
  }
  async simulate(params) {
    const body = {
      ...this.defaultBody,
      method: "eth_callBundle" /* CALL_BUNDLE */,
      params
    };
    const res = await fetch(`${this.relay}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "X-Flashbots-Signature": `${await this.getSignature(body)}`
      }
    });
    if (!res.ok)
      throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (data.error)
      throw new Error(data.error.message);
    return {
      simulationResult: data.result,
      send: () => this.sendBundle(params)
    };
  }
  async sendBundle(params) {
    const body = {
      ...this.defaultBody,
      method: "eth_sendBundle" /* SEND_BUNDLE */,
      params
    };
    const res = await fetch(`${this.relay}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "X-Flashbots-Signature": `${await this.getSignature(body)}`
      }
    });
    if (!res.ok)
      throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    if (data.error)
      throw new Error(data.error.message);
    return data;
  }
  async getBundleStatsV2(params) {
    const body = {
      ...this.defaultBody,
      method: "flashbots_getBundleStatsV2" /* GET_BUNDLE_STATS_V2 */,
      params
    };
    const res = await fetch(`${this.relay}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "X-Flashbots-Signature": `${await this.getSignature(body)}`
      }
    });
    if (!res.ok)
      throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();
    return data;
  }
  async waitForInclusion(targetBlock, hashes) {
    return new Promise((resolve, reject) => {
      const blockHandler = async (blockNum) => {
        const tx = await this.provider.getBlock(blockNum);
        if (!tx?.transactions || tx.transactions.length === 0)
          return;
        const transactions = tx.transactions.map((tx2) => tx2);
        if (transactions.some((tx2) => hashes.includes(tx2))) {
          this.provider.removeListener("block", blockHandler);
          resolve({
            status: "success",
            blockNumber: blockNum,
            transactions: transactions.filter((tx2) => hashes.includes(tx2))
          });
        }
        if (blockNum >= targetBlock) {
          this.provider.removeListener("block", blockHandler);
          resolve({
            status: "passed",
            blockNumber: blockNum,
            transactions: []
          });
        }
      };
      this.provider.on("block", blockHandler);
    });
  }
}
var flashbot_default = Flashbot;
export {
  Relays,
  Methods,
  flashbot_default as Flashbot
};
