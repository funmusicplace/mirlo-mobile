import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Button from "./Button";
import MenuButton from "./MenuButton";
import MirloLogo from "./MirloLogo";
import ScreenHeader, { BackButton, SectionHeader } from "./ScreenHeader";
import SearchButton from "./SearchButton";

const actions = (
  <>
    <SearchButton />
    <MenuButton />
  </>
);

const meta: Meta<typeof ScreenHeader> = {
  title: "Components/ScreenHeader",
  component: ScreenHeader,
};

export default meta;

type Story = StoryObj<typeof ScreenHeader>;

export const Home: Story = {
  args: {
    left: <MirloLogo />,
    right: actions,
  },
};

export const Pushed: Story = {
  args: {
    left: <BackButton />,
    right: actions,
  },
};

export const Section: Story = {
  render: () => (
    <SectionHeader
      right={
        <Button
          onlyIcon
          accessibilityLabel="Play"
          startIcon={<FontAwesome5 name="play" size={12} solid />}
          onPress={() => {}}
        />
      }
    >
      Recent releases
    </SectionHeader>
  ),
};
