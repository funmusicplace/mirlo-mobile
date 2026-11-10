import { Linking } from "react-native";
import {
  artistLinks,
  linkHref,
  linkLabel,
  openLink,
  sortTabsByOrder,
  tourDay,
} from "@/scripts/artistPage";
import { openOnWeb } from "@/scripts/openInBrowser";
import i18n from "../i18n";

jest.mock("@/scripts/openInBrowser", () => ({ openOnWeb: jest.fn() }));

const t = i18n.getFixedT("en");

describe("linkHref", () => {
  test("keeps web addresses and trims the spaces around them", () => {
    expect(linkHref("https://hawaiiworms.bandcamp.com/")).toBe(
      "https://hawaiiworms.bandcamp.com/",
    );
    expect(linkHref(" https://mastodon.world/@on_idyl")).toBe(
      "https://mastodon.world/@on_idyl",
    );
  });

  test("adds https:// to a bare domain", () => {
    expect(linkHref("alexwrodriguez.com")).toBe("https://alexwrodriguez.com");
  });

  test("a handle without a scheme is a web address, not an email", () => {
    expect(linkHref("musician.social/@mirlo")).toBe(
      "https://musician.social/@mirlo",
    );
  });

  test("turns a bare email into mailto:, also after a stray space", () => {
    expect(linkHref("hi@mirlo.space")).toBe("mailto:hi@mirlo.space");
    expect(linkHref("mailto: mmccrmck@pm.me")).toBe("mailto:mmccrmck@pm.me");
  });
});

describe("linkLabel", () => {
  test("the artist's label wins, then Email, then the link type", () => {
    const url = "https://www.facebook.com/HawaiiWorms/";
    expect(
      linkLabel({ url, linkLabel: "Our page", linkType: "Facebook" }, t),
    ).toBe("Our page");
    expect(linkLabel({ url: "hi@mirlo.space", linkType: "Mail" }, t)).toBe(
      "Email",
    );
    expect(linkLabel({ url, linkLabel: "", linkType: "Facebook" }, t)).toBe(
      "Facebook",
    );
  });

  test("names a link without a type, or with the generic Website, after its host", () => {
    expect(linkLabel({ url: "https://www.facebook.com/x?y=1" }, t)).toBe(
      "facebook.com",
    );
    expect(linkLabel({ url: "social.coop/@arod" }, t)).toBe("social.coop");
    expect(
      linkLabel({ url: "https://mirlo.space/team", linkType: "Website" }, t),
    ).toBe("mirlo.space");
  });
});

describe("artistLinks", () => {
  test("lists the legacy strings before linksJson and drops blank addresses", () => {
    const linksJson: Link[] = [
      { url: "https://hawaiiworms.bandcamp.com/", linkType: "Bandcamp" },
      { url: "", linkType: "YouTube" },
      { url: "https://", linkType: "" },
    ];
    expect(
      artistLinks({ links: ["https://prin.lu", "  "], linksJson }),
    ).toEqual([
      { url: "https://prin.lu" },
      { url: "https://hawaiiworms.bandcamp.com/", linkType: "Bandcamp" },
    ]);
  });

  test("copes with an artist that has neither list", () => {
    expect(artistLinks({})).toEqual([]);
  });
});

describe("sortTabsByOrder", () => {
  const tabs = ["roster", "releases"];

  test("keeps the order it got without a tab order, or without these tabs in it", () => {
    expect(sortTabsByOrder(tabs)).toEqual(["roster", "releases"]);
    expect(sortTabsByOrder(tabs, [])).toEqual(["roster", "releases"]);
    expect(sortTabsByOrder(tabs, ["merch", "support", "posts"])).toEqual([
      "roster",
      "releases",
    ]);
  });

  test("follows the tab order, with tabs it leaves out after the listed ones", () => {
    const all = ["releases", "roster", "posts", "support", "merch"];
    expect(sortTabsByOrder(tabs, all)).toEqual(["releases", "roster"]);
    expect(sortTabsByOrder(tabs, ["posts", "roster", "releases"])).toEqual([
      "roster",
      "releases",
    ]);
    expect(sortTabsByOrder(tabs, ["merch", "support", "releases"])).toEqual([
      "releases",
      "roster",
    ]);
    expect(sortTabsByOrder(tabs, ["roster"])).toEqual(["roster", "releases"]);
  });

  test("leaves the list it got alone", () => {
    sortTabsByOrder(tabs, ["releases"]);
    expect(tabs).toEqual(["roster", "releases"]);
  });
});

describe("tourDay", () => {
  test("keeps the calendar day the API stored, whatever the time zone", () => {
    const day = tourDay("2026-06-13T00:00:00.000Z");
    expect([day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([
      2026, 5, 13,
    ]);
  });
});

describe("openLink", () => {
  test("hands mail to the mail app and everything else to the browser", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    openLink("hi@mirlo.space");
    expect(openURL).toHaveBeenCalledWith("mailto:hi@mirlo.space");
    expect(openOnWeb).not.toHaveBeenCalled();

    openLink("hawaiiworms.micro.blog");
    expect(openOnWeb).toHaveBeenCalledWith("https://hawaiiworms.micro.blog");
    expect(openURL).toHaveBeenCalledTimes(1);
  });
});
