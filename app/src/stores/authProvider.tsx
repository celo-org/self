import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import ReactNativeBiometrics from 'react-native-biometrics';

const biometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});
interface AuthProviderProps extends PropsWithChildren {
  authenticationTimeoutinMs?: number;
}
interface IAuthContext {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  loginWithBiometrics: () => Promise<void>;
  biometrics: typeof biometrics;
}

export const AuthContext = createContext<IAuthContext>({
  isAuthenticated: false,
  isAuthenticating: false,
  loginWithBiometrics: () => Promise.resolve(),
  biometrics,
});

export const AuthProvider = ({
  children,
  authenticationTimeoutinMs = 15 * 60 * 1000,
}: AuthProviderProps) => {
  const [_, setAuthenticatedTimeout] =
    useState<ReturnType<typeof setTimeout>>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticatingPromise, setIsAuthenticatingPromise] =
    useState<Promise<{ success: boolean; error?: string }> | null>(null);

  const loginWithBiometrics = useCallback(async () => {
    if (isAuthenticatingPromise) {
      await isAuthenticatingPromise;
      return;
    }

    const promise = biometrics.simplePrompt({
      promptMessage: 'Confirm your identity to access the stored secret',
    });
    setIsAuthenticatingPromise(promise);
    const { success, error } = await promise;
    if (error) {
      setIsAuthenticatingPromise(null);
      // handle error
      throw error;
    }
    if (!success) {
      // user canceled
      throw new Error('Canceled by user');
    }

    setIsAuthenticatingPromise(null);
    setIsAuthenticated(true);
    setAuthenticatedTimeout(previousTimeout => {
      if (previousTimeout) {
        clearTimeout(previousTimeout);
      }
      return setTimeout(
        () => setIsAuthenticated(false),
        authenticationTimeoutinMs,
      );
    });
  }, [isAuthenticatingPromise]);

  const state: IAuthContext = useMemo(
    () => ({
      isAuthenticated,
      isAuthenticating: !!isAuthenticatingPromise,
      loginWithBiometrics,
      biometrics,
    }),
    [isAuthenticated, isAuthenticatingPromise, loginWithBiometrics],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
