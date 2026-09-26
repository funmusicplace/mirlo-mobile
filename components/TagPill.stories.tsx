import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import TagPill from "./TagPill";

const meta: Meta<typeof TagPill> = {
  title: "Components/TagPill",
  component: TagPill,
};

export default meta;

type Story = StoryObj<typeof TagPill>;

export const Default: Story = {
  args: {
    key: 1,
    tagName: "ambient",
  },
};
