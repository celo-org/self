import {createPublicClient, createWalletClient, http} from "viem";

export function getPublicClient(chain: any) {
    return createPublicClient({
        chain: chain,
        transport: http(),
    });
}

export function getWalletClient(chain: any, privateKey: `0x${string}`) {
    return createWalletClient({
        chain: chain,
        transport: http(),
        account: privateKey,
    });
}