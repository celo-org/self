import React, {
  PropsWithChildren,
  createContext,
  useEffect,
  useState,
} from 'react';

import io, { Socket } from 'socket.io-client';

import { SelfApp } from '../../../common/src/utils/appType';

export type ProofStatus = 'success' | 'failure' | 'pending';

interface IProofContext {
  status: ProofStatus;
  proofVerificationResult: unknown;
  selectedApp: SelfApp;
  setSelectedApp: (app: SelfApp) => void;
  setProofVerificationResult: (result: unknown) => void;
  setStatus: (status: ProofStatus) => void;
}

const defaults: IProofContext = {
  status: 'pending',
  proofVerificationResult: null,
  selectedApp: {} as SelfApp,
  setSelectedApp: (_: SelfApp) => undefined,
  setProofVerificationResult: (_: unknown) => undefined,
  setStatus: (_: ProofStatus) => undefined,
};

const ProofContext = createContext<IProofContext>(defaults);

const Provider = ProofContext.Provider;


/*
 store to manage the proof verification process, including app the is requesting, intemidiate status and final result
 */
export function ProofProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<ProofStatus>(defaults.status);
  const [proofVerificationResult, setProofVerificationResult] =
    useState<unknown>(defaults.proofVerificationResult);
  const [selectedApp, setSelectedApp] = useState<SelfApp>(defaults.selectedApp);
  const [_, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    let newSocket: Socket | null = null;

    if (!selectedApp.websocketUrl || !selectedApp.sessionId) {
      return;
    }

    try {
      newSocket = io(selectedApp.websocketUrl, {
        path: '/websocket',
        transports: ['websocket'],
        query: { sessionId: selectedApp.sessionId, clientType: 'mobile' },
      });

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      newSocket.on('connect_error', error => {
        console.error('Connection error:', error);
        console.log('Error', {
          message: 'Failed to connect to WebSocket server',
          customData: {
            type: 'error',
          },
        });
        setStatus('failure');
      });

      newSocket.on('proof_verification_result', result => {
        setProofVerificationResult(JSON.parse(result));
        console.log('result', result);
        if (JSON.parse(result).valid) {
          setStatus('success');
          console.log('✅', {
            message: 'Identity verified',
            customData: {
              type: 'success',
            },
          });
        } else {
          setStatus('failure');
          console.log('❌', {
            message: 'Verification failed',
            customData: {
              type: 'info',
            },
          });
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      console.log('❌', {
        message: 'Failed to set up connection',
        customData: {
          type: 'error',
        },
      });
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
      }
    };
  }, [selectedApp.websocketUrl, selectedApp.sessionId]);

  const publicApi: IProofContext = {
    status,
    proofVerificationResult,
    selectedApp,
    setStatus,
    setSelectedApp,
    setProofVerificationResult,
  };

  return <Provider value={publicApi}>{children}</Provider>;
}


export const useProofInfo = () => {
  return React.useContext(ProofContext);
};
