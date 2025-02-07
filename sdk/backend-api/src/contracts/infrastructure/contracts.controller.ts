import Elysia, { t } from 'elysia';
import { ProofVerifier } from '../../contracts/application/proofVerifier';

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
                const { proof, publicSignals } = await request.json();

                const proofVerifier = new ProofVerifier(
                    true,
                    true,
                    true,
                    process.env.OFAC_ROOT || "sample-ofac-root",
                    process.env.OLDER_THAN || "18",
                    (process.env.EXCLUDED_COUNTRIES || "USA,IRN,CHN").split(','),
                    process.env.IDENTITY_COMMITMENT_ROOT || "sample-commitment-root",
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