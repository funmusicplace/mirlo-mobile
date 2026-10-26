import {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AUTH_PROFILE_QUERY_KEY,
  clearLegacySession,
  queryAuthProfile,
  signIn as signInRequest,
} from "@/queries/authQueries";
import { SignInCancelledError } from "@/queries/fetch/oauth";
import { onSessionEnded } from "@/queries/fetch/session";

type AuthContextValue = {
  user?: LoggedInUser | null;
  // Resolves true once signed in, false when cancelled or failed
  signIn: () => Promise<boolean>;
  signingIn: boolean;
  signInError: Error | null;
  refreshLoggedInUser: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  signIn: async () => false,
  signingIn: false,
  signInError: null,
  refreshLoggedInUser: () => undefined,
});

function invalidateAuthQueries(client: QueryClient) {
  return client.invalidateQueries({
    predicate: (query) => query.queryKey.includes("auth"),
  });
}

export function AuthContextProvider({ children }: React.PropsWithChildren) {
  const queryClient = useQueryClient();
  const { data: user } = useQuery(queryAuthProfile());
  // Held here and not in the login screen because on Android the redirect also
  // reaches the app as a deep link, which can remount that screen mid sign-in
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<Error | null>(null);
  const signingInRef = useRef(false);

  useEffect(() => {
    clearLegacySession();
  }, []);

  useEffect(
    () =>
      onSessionEnded(() => {
        queryClient.setQueryData(AUTH_PROFILE_QUERY_KEY, null);
        invalidateAuthQueries(queryClient);
      }),
    [queryClient],
  );

  const signIn = useCallback(async () => {
    if (signingInRef.current) return false;
    signingInRef.current = true;
    setSigningIn(true);
    setSignInError(null);
    try {
      await signInRequest();
      await invalidateAuthQueries(queryClient);
      return true;
    } catch (error) {
      if (!(error instanceof SignInCancelledError)) {
        setSignInError(error as Error);
      }
      return false;
    } finally {
      signingInRef.current = false;
      setSigningIn(false);
    }
  }, [queryClient]);

  const refreshLoggedInUser = useCallback(() => {
    invalidateAuthQueries(queryClient);
  }, [queryClient]);

  const context = useMemo(
    () => ({ user, signIn, signingIn, signInError, refreshLoggedInUser }),
    [user, signIn, signingIn, signInError, refreshLoggedInUser],
  );

  return (
    <AuthContext.Provider value={context}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
