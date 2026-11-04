import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_INSTANCE, findInstance, Instance } from "@/scripts/instances";

const STORAGE_KEY = "instances";

type InstancesContextType = {
  // The default instance first, then the ones the listener added
  instances: Instance[];
  // False until the saved list is read, so the feed loads once
  loaded: boolean;
  addInstance: (input: string) => Promise<void>;
  removeInstance: (apiRoot: string) => void;
};

const InstancesContext = createContext<InstancesContextType | null>(null);

export function InstancesContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [added, setAdded] = useState<Instance[]>([]);
  const [loaded, setLoaded] = useState(false);
  const instances = [DEFAULT_INSTANCE, ...added];

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => saved && setAdded(JSON.parse(saved)))
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(added)).catch(
      console.error,
    );
  }, [added, loaded]);

  const addInstance = async (input: string) => {
    const instance = await findInstance(input, instances);
    setAdded((current) => [...current, instance]);
  };

  const removeInstance = (apiRoot: string) =>
    setAdded((current) => current.filter((i) => i.apiRoot !== apiRoot));

  return (
    <InstancesContext.Provider
      value={{ instances, loaded, addInstance, removeInstance }}
    >
      {children}
    </InstancesContext.Provider>
  );
}

export function useInstances() {
  const context = useContext(InstancesContext);
  if (!context) {
    throw new Error(
      "useInstances must be used within InstancesContextProvider",
    );
  }
  return context;
}

// A route param counts only when it names a saved source, so a deep link
// can't point the app at any host
export function useKnownApiRoot(param?: string) {
  const { instances } = useInstances();
  return instances.slice(1).some((i) => i.apiRoot === param)
    ? param
    : undefined;
}
