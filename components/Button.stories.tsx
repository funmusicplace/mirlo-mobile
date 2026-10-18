import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: {
    onPress: () => {},
  },
  // Content-sized, so FullWidth shows the stretch
  decorators: [
    (Story) => (
      <View style={{ alignItems: "flex-start" }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Solid: Story = {
  args: {
    variant: "solid",
    title: "Solid",
  },
};

export const Outlined: Story = {
  args: {
    variant: "outlined",
    title: "Outlined",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    title: "Link",
  },
};

export const Transparent: Story = {
  args: {
    variant: "transparent",
    title: "Transparent",
  },
};

export const Compact: Story = {
  args: {
    size: "compact",
    title: "Compact",
  },
};

export const Big: Story = {
  args: {
    size: "big",
    title: "Big",
  },
};

export const Rounded: Story = {
  args: {
    rounded: true,
    title: "Play album",
    startIcon: <Ionicons name="play-outline" />,
  },
};

export const OnlyIcon: Story = {
  args: {
    onlyIcon: true,
    startIcon: <FontAwesome5 name="share-alt" size={14} solid />,
    accessibilityLabel: "Share",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    title: "Disabled",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    title: "Loading",
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    title: "Full width",
  },
};
