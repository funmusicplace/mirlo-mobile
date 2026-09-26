import { http, HttpResponse } from "msw";
import { faker } from "@faker-js/faker";
import { FIXTURE_SEED, mockAlbum } from "./fixtures";

faker.seed(FIXTURE_SEED);

const trackGroupsPage = Array.from({ length: 12 }, () => mockAlbum());

const tags = ["lofi", "ambient", "synthwave", "folk", "jazz", "indie"].map(
  (tag) => ({ tag }),
);

/**
 * Handlers every story gets, keyed so a story can replace one group without
 * dropping the rest, e.g. a logged-in story:
 *
 *   parameters: {
 *     msw: {
 *       handlers: {
 *         auth: [http.get("*\/auth/profile", () => HttpResponse.json({ result: user }))],
 *       },
 *     },
 *   }
 */
export const defaultHandlers = {
  auth: [
    http.get("*/auth/profile", () => new HttpResponse(null, { status: 401 })),
    http.post("*/auth/refresh", () => HttpResponse.json({})),
  ],
  trackGroups: [
    http.get("*/v1/trackGroups", () =>
      HttpResponse.json({ results: trackGroupsPage }),
    ),
  ],
  tags: [
    http.get("*/v1/tags", () =>
      HttpResponse.json({ results: tags, total: tags.length }),
    ),
  ],
};
