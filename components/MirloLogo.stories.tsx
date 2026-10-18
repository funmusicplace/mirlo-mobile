import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import MirloLogo from "./MirloLogo";

const meta: Meta<typeof MirloLogo> = {
  title: "Components/MirloLogo",
  component: MirloLogo,
};

export default meta;

type Story = StoryObj<typeof MirloLogo>;

export const Default: Story = {};

export const Large: Story = {
  args: {
    size: 64,
  },
};
