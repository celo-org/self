import {createPublicClient, createWalletClient, http} from "viem";

export function getPublicClient(chain: any, rpcUrl: string) {
    return createPublicClient({
        chain: chain,
        transport: http(rpcUrl),
    });
}

export function getWalletClient(chain: any, privateKey: `0x${string}`, rpcUrl: string) {
    return createWalletClient({
        chain: chain,
        transport: http(rpcUrl),
        account: privateKey,
    });
}