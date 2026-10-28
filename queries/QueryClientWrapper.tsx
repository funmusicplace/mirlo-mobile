import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MirloFetchError } from "./fetch/MirloFetchError";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, //30 seconds
      retry: (failureCount, error) => {
        // don't retyr for auth-related errors
        if (
          error instanceof MirloFetchError &&
          (error.status === 400 || error.status === 401)
        ) {
          return false;
        }

        return failureCount <= 1;
      },
    },
  },
});

export function QueryClientWrapper(
  props: React.PropsWithChildren<{ devTools?: boolean }>,
) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
