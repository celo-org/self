import Elysia, { t } from 'elysia';

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
        () => {
            return {
                status: 'success',
                data: ['verify vc and disclose proof'],
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
            summary: 'Verify a VC and disclose a proof',
            description: 'Verify a VC and disclose a proof',
          },
        },
    )