import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import LoginForm from "./LoginForm";

const meta: Meta<typeof LoginForm> = {
  title: "Components/LoginForm",
  component: LoginForm,
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};
