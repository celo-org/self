import { RegistryContract } from "../registryContract";
import { getChain } from "../chains";


export async function getContractInstanceRoot(type: string) {
    switch (type) {
        case 'dscKeyCommitment':
            return getDscKeyCommitmentRoot();
        default:
            throw new Error(`Unknown tree type: ${type}`);
    }
}

async function getDscKeyCommitmentRoot() {
    const registryContract = new RegistryContract(
        getChain(process.env.NETWORK as string),
        process.env.PRIVATE_KEY as `0x${string}`,
        process.env.RPC_URL as string
    );
    const dscKeyCommitmentRoot = (await registryContract.getDscKeyCommitmentMerkleRoot()).toString();
    return dscKeyCommitmentRoot;
}
