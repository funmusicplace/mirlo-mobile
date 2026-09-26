import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import ErrorNotification from "./ErrorNotification";

const meta: Meta<typeof ErrorNotification> = {
  title: "Components/ErrorNotification",
  component: ErrorNotification,
};

export default meta;

type Story = StoryObj<typeof ErrorNotification>;

export const NetworkError: Story = {
  args: {
    visible: true,
    error: new Error("Network request failed"),
    onDismiss: () => {},
  },
};

export const GenericError: Story = {
  args: {
    visible: true,
    error: new Error("Something went wrong loading this release."),
    onDismiss: () => {},
  },
};
