import type { Meta, StoryObj } from "@storybook/react-native-web-vite";
import { http, HttpResponse, delay } from "msw";
import Index from "@/app/index";

const meta: Meta<typeof Index> = {
  title: "Screens/Home",
  component: Index,
};

export default meta;

type Story = StoryObj<typeof Index>;

export const Default: Story = {};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: {
        trackGroups: [
          http.get("*/v1/trackGroups", async () => {
            await delay("infinite");
            return HttpResponse.json({ results: [] });
          }),
        ],
      },
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: {
        trackGroups: [
          http.get("*/v1/trackGroups", () =>
            HttpResponse.json(
              { error: "Internal server error" },
              { status: 500 },
            ),
          ),
        ],
      },
    },
  },
};
