import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { http, HttpResponse } from "msw";
import { createMockUser } from "@/__mocks__/mockUser";
import Menu from "@/app/menu";

const meta: Meta<typeof Menu> = {
  title: "Screens/Menu",
  component: Menu,
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  parameters: {
    msw: {
      handlers: {
        auth: [
          http.get("*/auth/profile", () =>
            HttpResponse.json({
              result: createMockUser({ name: "Jamie Rivera" }),
            }),
          ),
          http.post("*/auth/refresh", () => HttpResponse.json({})),
        ],
      },
    },
  },
};
