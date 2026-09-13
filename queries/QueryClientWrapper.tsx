import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MirloFetchError } from "./fetch/MirloFetchError";
import { authRefresh } from "./authQueries";

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
  queryCache: new QueryCache({
    onError: async (error) => {
      if (
        error instanceof MirloFetchError &&
        (error.status === 400 || error.status === 401)
      ) {
        console.error(`Received a ${error.status} response - refreshing auth`);
        await authRefresh();
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey.includes("auth"),
        });
      }
    },
  }),
});

export function QueryClientWrapper(
  props: React.PropsWithChildren<{ devTools?: boolean }>
) {
  return (
    <QueryClientProvider client={queryClient}>
      {props.children}
    </QueryClientProvider>
  );
}
