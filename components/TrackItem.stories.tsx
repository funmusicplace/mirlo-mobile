import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { faker } from "@faker-js/faker";
import { TrackItem } from "./TrackItem";
import { FIXTURE_SEED, mockRNTrack } from "../.storybook/fixtures";

faker.seed(FIXTURE_SEED);

const meta: Meta<typeof TrackItem> = {
  title: "Components/TrackItem",
  component: TrackItem,
};

export default meta;

type Story = StoryObj<typeof TrackItem>;

export const Default: Story = {
  args: {
    track: mockRNTrack({ order: 1 }),
    thisSongSelected: false,
    onTrackScreen: false,
  },
};

export const Selected: Story = {
  args: {
    ...Default.args,
    track: mockRNTrack({ order: 2 }),
    thisSongSelected: true,
  },
};
