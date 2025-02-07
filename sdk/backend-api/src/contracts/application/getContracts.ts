import {getPublicClient, getWalletClient} from "./client";
import {getContract} from "viem";
import fs from "fs";
import path from "path";

type ContractBase = {
    abi: any;
    address: string;
}

type ContractName = "registry" | "hub";

export function getContractInstance(contractName: ContractName, chain: any, privateKey: `0x${string}`, rpcUrl: string) {
    const walletClient = getWalletClient(chain, privateKey, rpcUrl);
    const publicClient = getPublicClient(chain, rpcUrl);

    let contractBase: ContractBase;
    switch (contractName) {
        case "registry":
            contractBase = {
                abi: getAbi("IdentityRegistryImplV1"),
                address: getAddresses(chain.id)["DeployRegistryModule#IdentityRegistry"],
            };
        case "hub":
            contractBase = {
                abi: getAbi("IdentityVerificationHubImplV1"),
                address: getAddresses(chain.id)["DeployHub#IdentityVerificationHub"],
            };
        default:
            throw new Error(`Contract ${contractName} not found`);
    }

    return getContract({
        abi: contractBase.abi,
        address: contractBase.address as `0x${string}`,
        client: { public: publicClient, wallet: walletClient }
    });
}

export function getAddresses(chainId: number) {
    const addressFile = path.join(__dirname, "../../../addresses", `chain-${chainId}_deployed_addresses.json`);
    const addresses = JSON.parse(fs.readFileSync(addressFile, "utf8"));
    return addresses;
}

export function getAbi(contractName: string) {
    const abiFile = path.join(__dirname, "../../../abi", `${contractName}.json`);
    const abi = JSON.parse(fs.readFileSync(abiFile, "utf8"));
    return abi;
}