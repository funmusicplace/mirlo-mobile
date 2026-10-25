import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { http, HttpResponse } from "msw";
import { createMockUser } from "@/__mocks__/mockUser";
import Menu from "@/app/menu";
import { startSession } from "@/queries/fetch/session";

const meta: Meta<typeof Menu> = {
  title: "Screens/Menu",
  component: Menu,
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  // The profile query only asks the API when a session is stored
  loaders: [
    async () => {
      await startSession({
        accessToken: "story-access-token",
        refreshToken: "story-refresh-token",
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      return {};
    },
  ],
  parameters: {
    msw: {
      handlers: {
        auth: [
          http.get("*/auth/profile", () =>
            HttpResponse.json({
              result: createMockUser({ name: "Jamie Rivera" }),
            }),
          ),
        ],
      },
    },
  },
};
