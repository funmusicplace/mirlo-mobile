import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { View } from "react-native";
import LoginForm from "./LoginForm";
import { mirloRed } from "@/constants/mirlo-red";

const meta: Meta<typeof LoginForm> = {
  title: "Components/LoginForm",
  component: LoginForm,
  decorators: [
    (Story) => (
      <View style={{ flex: 1, backgroundColor: mirloRed }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof LoginForm>;

export const Default: Story = {};
