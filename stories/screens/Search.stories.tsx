import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import SearchPage from "@/app/search";

const meta: Meta<typeof SearchPage> = {
  title: "Screens/Search",
  component: SearchPage,
};

export default meta;

type Story = StoryObj<typeof SearchPage>;

export const Default: Story = {};
