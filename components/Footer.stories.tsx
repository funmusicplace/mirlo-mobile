import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { faker } from "@faker-js/faker";
import Footer from "./Footer";
import { PlayerContext } from "@/state/PlayerContext";
import { FIXTURE_SEED, mockRNTrack } from "../.storybook/fixtures";

faker.seed(FIXTURE_SEED);

const activeTrack = mockRNTrack();

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
};

export default meta;

type Story = StoryObj<typeof Footer>;

export const NoActiveTrack: Story = {};

export const WithActiveTrack: Story = {
  decorators: [
    (Story) => (
      <PlayerContext.Provider
        value={{
          playbackState: { state: undefined },
          playableTracks: [activeTrack],
          setPlayableTracks: () => {},
          activeTrack,
          setActiveTrack: () => {},
          shuffled: false,
          setShuffled: () => {},
          isPlaying: false,
          looping: "none",
          setLooping: () => {},
        }}
      >
        <Story />
      </PlayerContext.Provider>
    ),
  ],
};
