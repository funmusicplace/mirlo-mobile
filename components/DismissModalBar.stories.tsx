import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import DismissModalBar from "./DismissModalBar";

const meta: Meta<typeof DismissModalBar> = {
  title: "Components/DismissModalBar",
  component: DismissModalBar,
};

export default meta;

type Story = StoryObj<typeof DismissModalBar>;

export const Default: Story = {};
