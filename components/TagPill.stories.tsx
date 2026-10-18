import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import type { ReactNode } from "react";
import { View } from "react-native";
import TagPill from "./TagPill";
import { useColors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

function CoverBackdrop({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={{
        backgroundColor: colors.overlay,
        padding: spacing.lg,
        alignItems: "flex-start",
      }}
    >
      {children}
    </View>
  );
}

const meta: Meta<typeof TagPill> = {
  title: "Components/TagPill",
  component: TagPill,
};

export default meta;

type Story = StoryObj<typeof TagPill>;

export const Default: Story = {
  args: {
    tagName: "ambient",
  },
};

export const Cover: Story = {
  args: {
    tagName: "ambient",
    variant: "cover",
  },
  decorators: [
    (Story) => (
      <CoverBackdrop>
        <Story />
      </CoverBackdrop>
    ),
  ],
};
