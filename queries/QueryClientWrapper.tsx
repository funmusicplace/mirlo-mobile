import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MirloFetchError } from "./fetch/MirloFetchError";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, //30 seconds
      retry: (failureCount, error) => {
        // retrying gets the same answer for these
        if (
          error instanceof MirloFetchError &&
          [400, 401, 404].includes(error.status)
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
