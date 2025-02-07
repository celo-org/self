import { getContractInstance } from "./getContracts";

export class RegistryContract {

    protected registry: any;

    constructor(
        chain: any,
        privateKey: `0x${string}`,
        rpcUrl: string
    ) {
        this.registry = getContractInstance("registry", chain, privateKey, rpcUrl);
    }

    public async devAddIdentityCommitment(
        attestationId: string,
        nullifier: bigint,
        commitment: bigint
    ) {
        const tx = await this.registry.devAddIdentityCommitment(
            attestationId,
            nullifier,
            commitment
        );
        await tx.wait();
        return tx;
    }

    public async getIdentityCommitmentMerkleRoot() {
        const root = await this.registry.getIdentityCommitmentMerkleRoot();
        return root;
    }
}