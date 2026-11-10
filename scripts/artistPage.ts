import { Linking } from "react-native";
import type { TFunction } from "i18next";
import { openOnWeb } from "@/scripts/openInBrowser";

const WEB_URL = /^https?:\/\//i;
// A "/" before the "@" is a handle like musician.social/@mirlo, not an address
const EMAIL = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

// Artists type addresses by hand: bare domains, bare emails, "mailto: x"
export function linkHref(url: string) {
  const trimmed = url.trim();
  if (WEB_URL.test(trimmed)) return trimmed;
  const address = trimmed.replace(/^mailto:\s*/i, "");
  return EMAIL.test(address) ? `mailto:${address}` : `https://${trimmed}`;
}

// The website's label order, with the host where it guesses a name from it
export function linkLabel(link: Link, t: TFunction) {
  if (link.linkLabel) return link.linkLabel;
  const href = linkHref(link.url);
  if (href.startsWith("mailto:")) return t("artist.Email");
  // "Website" says less than the host does
  const type = link.linkType === "Website" ? "" : link.linkType;
  return (
    type ||
    href
      .replace(WEB_URL, "")
      .replace(/^www\./i, "")
      .split(/[/?#]/)[0]
  );
}

// Older artists keep their links as plain strings in `links`, the rest in
// `linksJson`. A lone "https://" is what an emptied field leaves behind
export function artistLinks(artist: Pick<Artist, "links" | "linksJson">) {
  return [
    ...(artist.links ?? []).map((url): Link => ({ url })),
    ...(artist.linksJson ?? []),
  ].filter((link) => link.url?.trim().replace(WEB_URL, ""));
}

// The website's sortTabsByOrder: tabs missing from tabOrder follow the listed ones
export function sortTabsByOrder<T extends string>(
  tabs: T[],
  tabOrder: readonly string[] = [],
) {
  const rank = (tab: T) => {
    const index = tabOrder.indexOf(tab);
    return index === -1 ? tabOrder.length : index;
  };
  return [...tabs].sort((a, b) => rank(a) - rank(b));
}

// The API stores a tour date as UTC midnight, so its calendar day is the UTC
// one, where a local read would show the day before west of Greenwich
export function tourDay(date: string) {
  const utc = new Date(date);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

// A Custom Tab can't open mailto:, the mail app takes it
export function openLink(url: string) {
  const href = linkHref(url);
  return href.startsWith("mailto:") ? Linking.openURL(href) : openOnWeb(href);
}
