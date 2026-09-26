import { Children, useEffect, useRef, type ReactNode } from "react";
import { Pressable, Text, type TextProps } from "react-native";

const noop = () => {};

export const router = {
  push: noop,
  replace: noop,
  back: noop,
  canGoBack: () => false,
  navigate: noop,
  dismiss: noop,
  dismissTo: noop,
  dismissAll: noop,
  canDismiss: () => false,
  setParams: noop,
  prefetch: noop,
  reload: noop,
};

export function useRouter() {
  return router;
}

export function usePathname() {
  return "/";
}

export function useLocalSearchParams(): Record<string, string | string[]> {
  return {};
}

export function useFocusEffect(callback: () => void | (() => void)) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => callbackRef.current(), []);
}

type LinkProps = {
  asChild?: boolean;
  style?: TextProps["style"];
  onPress?: () => void;
  children?: ReactNode;
};

export function Link({ asChild, style, onPress, children }: LinkProps) {
  if (asChild) {
    return <>{children}</>;
  }

  const isText = Children.toArray(children).every(
    (child) => typeof child === "string" || typeof child === "number",
  );
  if (!isText) {
    return (
      <Pressable style={style as object} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return (
    <Text style={style} onPress={onPress}>
      {children}
    </Text>
  );
}
