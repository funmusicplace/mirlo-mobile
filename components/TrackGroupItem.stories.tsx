import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { faker } from "@faker-js/faker";
import TrackGroupItem from "./TrackGroupItem";
import { FIXTURE_SEED, mockAlbum } from "../.storybook/fixtures";

faker.seed(FIXTURE_SEED);

const meta: Meta<typeof TrackGroupItem> = {
  title: "Components/TrackGroupItem",
  component: TrackGroupItem,
};

export default meta;

type Story = StoryObj<typeof TrackGroupItem>;

export const Default: Story = {
  args: { ...mockAlbum() },
};
