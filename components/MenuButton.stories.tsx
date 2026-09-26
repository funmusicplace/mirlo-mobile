import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import MenuButton from "./MenuButton";

const meta: Meta<typeof MenuButton> = {
  title: "Components/MenuButton",
  component: MenuButton,
};

export default meta;

type Story = StoryObj<typeof MenuButton>;

export const Default: Story = {};
