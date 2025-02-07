import Elysia, { t } from 'elysia';
import { ProofVerifier } from '../../contracts/application/proofVerifier';
import { RegistryContract } from '../../contracts/application/registryContract';
import { getChain } from '../../contracts/application/chains';

export const ContractsController = new Elysia()
    .get(
        'identity-commitment-root',
        () => {
            return {
                status: 'success',
                data: ['identity commitment root'],
            };
        },
        {
          response: {
            200: t.Object({
              status: t.String(),
              data: t.Array(t.String()),
            }),
            500: t.Object({
              status: t.String(),
              message: t.String(),
            }),
          },
          detail: {
            tags: ['Contracts'],
            summary: 'Get identity commitment root in registry contract',
            description: 'Retrieve the identity commitment root in registry contract',
          },
        },
    )
    .post(
        'verify-vc-and-disclose-proof',
        async (request) => {
            try {

                const registryContract = new RegistryContract(
                    getChain(process.env.NETWORK as string),
                    process.env.PRIVATE_KEY as `0x${string}`,
                    process.env.RPC_URL as string
                );

                const identityCommitmentRoot = await registryContract.getIdentityCommitmentMerkleRoot();
                const ofacRoot = await registryContract.getOfacRoot();

                const { proof, publicSignals } = await request.json();

                const proofVerifier = new ProofVerifier(
                    process.env.OFAC_ENABLED === "true",
                    process.env.OLDER_THAN_ENABLED === "true",
                    process.env.EXCLUDED_COUNTRIES_ENABLED === "true",
                    ofacRoot,
                    process.env.OLDER_THAN || "18",
                    (process.env.EXCLUDED_COUNTRIES || "USA,IRN,CHN").split(','),
                    identityCommitmentRoot,
                    {}
                );

                await proofVerifier.verifyVcAndDiscloseProof(proof, publicSignals);

                return {
                    status: "success",
                    data: ["Valid VC and disclose proof"],
                };
            } catch (error) {
                return {
                    status: "error",
                    message: error instanceof Error ? error.message : "Unknown error",
                };
            }
        },
        {
          response: {
            200: t.Object({
              status: t.String(),
              data: t.Array(t.String()),
            }),
            500: t.Object({
              status: t.String(),
              message: t.String(),
            }),
          },
          detail: {
            tags: ['Contracts'],
            summary: 'Verify a VC and disclose a proof',
            description: 'Verify a VC and disclose a proof',
          },
        },
    );