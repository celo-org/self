import {getPublicClient, getWalletClient} from "./client";
import {getContract} from "viem";

export function getRegistryContract(chain: any, privateKey: `0x${string}`) {
    const walletClient = getWalletClient(chain, privateKey);
    const publicClient = getPublicClient(chain);

    return getContract({
        abi: registryAbi,
        address: registryAddress,
        client: publicClient,
    });
}