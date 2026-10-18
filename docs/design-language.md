# Mirlo design language

## Purpose and scope

This file is the shared design spec for the Mirlo mobile app (this repo) and the Mirlo web app (`client/` in `funmusicplace/mirlo`). Each app builds its own components natively and follows these rules, so a screen reads as the same product on a phone and in a browser. Tokens are copied into each codebase and kept in sync by hand: a token change lands in both apps and in this file.

## Tokens

Tokens live in `constants/`. Screens read colors through `useColors()` from `constants/colors.ts`, which returns `colors.light` or `colors.dark` for the current `useColorScheme()`. Sizes come from `spacing`, `gutter`, `radius` and `touchTarget` in `constants/spacing.ts`, and text styles from `type` and `fonts` in `constants/typography.ts`.

- `useColors()` is the only theme system. `ThemedText` applies `colors.text`, and `app/_layout.tsx` maps the tokens into the React Navigation theme.
- Components read every color from `useColors()`. They don't import `mirloRed` or contain hex values.
- Use the spacing, radius and type tokens wherever one fits. Literal numbers stay only for fixed dimensions that aren't spacing, such as the 6.4 pt progress bar or a 40 pt artwork thumbnail.
- A new value gets a token in `constants/` and a row in this file in the same change.
- Light values are the CSS variables on mirlo.space, read with `getComputedStyle` at a 390 px viewport. Where the web source and the live site differ, the live site wins.

### Palette

`palette` holds the raw colors. Each one is the same in both themes.

| Mobile token | Web variable | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `palette.black` | `--mi-black` | `#111111` | same | Dark background and input fill, light-tone player foreground |
| `palette.white` | `--mi-white` | `#ffffff` | same | Light background, filled button text, light input fill |
| `palette.offWhite` | `--mi-off-white` | `#f5f0f0` | same | Light-tone player fill, dark text and input text |
| `palette.pink` | `--mi-pink`, default `--mi-button-color` | `#BE3455` (`mirloRed`) | same | Filled buttons, light accent |
| `palette.neutral500` | `--mi-neutral-500` | `#8b8083` | same | Inactive icons, dark placeholders |
| `palette.red700` | `--mi-red-700` | `#6e162d` | same | Light danger text |
| `palette.warning` | `--mi-warning-color` | `#f2897a` | same | Notice rule, dark danger text |

### Semantic colors

Each key exists as `colors.light.<key>` and `colors.dark.<key>`.

| Mobile token | Web variable | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `background` | `--mi-background-color` | `#ffffff` | `#111111` | Screen and list background, search result cards |
| `header` | `--mi-background-color` (the web header uses the page background) | `#ffffff` | `#111111` | Screen header fill |
| `border` | `--mi-tint-x-color`, as used by `--mi-border` | `rgba(50, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.18)` | Borders, hairlines, input and search card outlines, modal title rule, footer button ripple |
| `text` | `--mi-text-color` | `#000000` | `#f5f0f0` | Primary text, close icons, `ThemedText` default |
| `secondaryText` | `--mi-light-foreground-color` (73% mix) | `#454545` | `#b7b4b4` | Contributors, release dates, player times, byline prefixes, search group headings and empty messages |
| `inactive` | `--mi-neutral-500` | `#8b8083` | `#8b8083` | Unselected nav icons, shuffle and repeat when off, disabled solid button label |
| `disabled` | `--mi-disabled-color` (13.3% mix) | `#dddddd` | `#2f2f2f` | Disabled button fill, label and border |
| `accent` | `--mi-button-color` used as text | `#BE3455` | `#e0607e` | Links, section labels, header, player and favorite icons, active nav icons, logo circle, progress fill, chip text, playing track title, search input border, spinners |
| `button` | `--mi-button-color` | `#BE3455` | `#BE3455` | Filled button and play circle fill |
| `buttonText` | `--mi-button-text-color` | `#ffffff` | `#ffffff` | Text and icons on filled buttons, logo glyph |
| `danger` | `--mi-red-700` (light), `--mi-warning-color` (dark) | `#6e162d` | `#f2897a` | Inline errors, the menu's "Delete account" link |
| `alert` | `Box variant="warning"` fill: warning at 30% over the background | `#fbdcd7` | `#553531` | Notice box fill |
| `alertBorder` | `--mi-warning-color` | `#f2897a` | `#f2897a` | Notice box left rule |
| `playerBackground` | `--mi-fixed-bg-color` in `Player` | `#f5f0f0` | `#111111` | `Footer` fill |
| `playerShadow` | `Player` drop-shadow color: fixed foreground at 30% | `rgba(17, 17, 17, 0.3)` | `rgba(245, 240, 240, 0.3)` | `Footer` top hairline |
| `tint` | `--mi-tint-color` | `rgba(50, 0, 0, 0.03)` | `rgba(255, 255, 255, 0.08)` | Tag chip fill, cover and avatar placeholders, pressed search row |
| `tintX` | `--mi-tint-x-color` | `rgba(50, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.18)` | Chip border, pressed fill, ripples, menu separators, empty state border, slider track |
| `inputBackground` | `--mi-background-color` on `Input` | `#ffffff` | `#111111` | Text input fill |
| `inputText` | `--mi-text-color` on `Input` | `#000000` | `#f5f0f0` | Text input text, search icon |
| `inputPlaceholder` | none (browser default) | `#757575` | `#8b8083` | Placeholder text |
| `overlay` | `CommandSearch` backdrop (`bg-black/85`) | `rgba(0, 0, 0, 0.85)` | `rgba(0, 0, 0, 0.85)` | Search overlay fill |
| `scrim` | Header `Menu` backdrop (`rgba(0,0,0,.5)`) | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.5)` | Backdrop behind the album purchase dialog |
| `coverChip` | `Pill variant="cover"` fill: `--mi-black` at 80% | `rgba(17, 17, 17, 0.8)` | `rgba(17, 17, 17, 0.8)` | Chip fill on the search overlay |
| `coverChipBorder` | `Pill variant="cover"` border: `--mi-white` at 25% | `rgba(255, 255, 255, 0.25)` | `rgba(255, 255, 255, 0.25)` | Chip border and ripples on the search overlay |
| `coverChipText` | `Pill variant="cover"` text: `--mi-white` | `#ffffff` | `#ffffff` | Chip text, title, labels and links on the search overlay |

Dark values exist only on mobile, since the web has no system dark mode. They apply the web's dark tint profile (`SITE_THEME_PROFILE.tint.dark` in `client/src/utils/themeVariables.ts`: white at 0.08, 0.18 and 0.35) to a `#111111` background with `#f5f0f0` text, and recompute the web's `color-mix` percentages on that pair. `accent` changes to `#e0607e` in dark because `#BE3455` on `#111111` is 3.4:1. Filled buttons keep `#BE3455` with white text (5.5:1) in both themes.

### Web values without a mobile token

Add a token before using one of these on mobile.

| Web variable | Value | Web use |
| --- | --- | --- |
| `--mi-lighter-foreground-color` (68.2% mix) | `#515151` | Spinner rings, disabled input text |
| `--mi-alternate-background-color` (6% mix) | `#f0f0f0` (dark mix `#1f1e1e`) | Alternate rows and surfaces |
| `--mi-tint-xx-color` | `rgba(50, 0, 0, 0.2)` (dark `rgba(255, 255, 255, 0.35)`) | Strongest tint |
| `--mi-fixed-fg-color` in `Player` | `#111111` / `#f5f0f0` | Text on the player fill, the app footer shows no text |
| `--mi-lighten-background-color`, `--mi-lighten-x-background-color` | `rgba(255, 255, 255, 0.35)`, `rgba(255, 255, 255, 0.5)` | Modal title bar and inputs inside `Box`, default `Pill` fill |
| `--mi-red-100`, `--mi-red-800` | `#ffe5ea`, `#43141e` | Notification badges, destructive button text and hover |
| `--mi-blue-100`, `--mi-blue-700` | `#e1f4fc`, `#34515c` | Notification badges |
| `--mi-green-100`, `--mi-green-500`, `--mi-green-700` | `#dff2dc`, `#44633f`, `#21381d` | Success snackbar, publish button, fulfillment status |
| `--mi-info-background-color`, `--mi-success-background-color` | `#5c899c`, `#5b9762` | `Box` info and success variants |
| `Background` component (no variable) | `rgba(0, 0, 0, 0.6)` | `Modal` backdrop |

### Spacing

Values are points on mobile and CSS pixels on the web (16 px root).

| Mobile token | Web variable or value | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `spacing.xxs` | `0.125rem` | 2 | same | Fine offsets between stacked lines |
| `spacing.xs` | `0.25rem` | 4 | same | Chip vertical padding, compact button padding, cover to artist line |
| `spacing.sm` | `0.5rem` | 8 | same | Chip horizontal padding, chip gap, input and button vertical padding, row gaps, cover to title |
| `spacing.md` | `0.75rem` | 12 | same | Grid column gap, input and button horizontal padding, header button gap, page title margins |
| `spacing.lg` | `1rem`, `--mi-side-paddings-small` | 16 | same | Tag list margin, modal, menu and form padding |
| `spacing.xl` | `1.5rem` | 24 | same | Space after a form field, album title top padding |
| `spacing.xxl` | `2rem`, `--mi-side-paddings-normal` | 32 | same | Space between sections, list footer spinner margin |
| `gutter` | `--mi-side-paddings-xsmall` | 8 (`spacing.sm`) | same | Screen side padding at phone width |

### Radius

| Mobile token | Web variable or value | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `radius.sm` | `--mi-border-radius` | 3 | same | Buttons, inputs, notice and empty state boxes, search cards, menu links |
| `radius.md` | `--mi-border-radius-focus` | 8 | same | Album purchase dialog card. Web: focused inputs, `rounded` buttons, phone-width modal sheet corners |
| `radius.lg` | `--mi-border-radius-x` | 15 | same | Tag chips, top padding of the modal title bar |
| `radius.pill` | `9999px` | 9999 | same | `rounded` and icon-only buttons, play circles, avatars |

### Touch target

| Mobile token | Web variable | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `touchTarget` | `--mi-touch-target-min` (30px) | 44 | same | Minimum hit area for every control, minimum height for inputs, track rows, menu links and search rows |

## Type scale

Body text uses the system font on both apps. The web stack (`--mi-font-family-stack`) starts with `system-ui`, and mobile sets no font family, which gives San Francisco on iOS and Roboto on Android. `fonts.display` is Cubano Sharp, bundled from the web's `client/public/fonts/cubano-sharp.otf` and loaded in `app/_layout.tsx`. Use it only where the web uses `SplashTitle`: the splash heading and the home section titles ("Explore music", "Sustained by", "Mailing list").

| Mobile style | Size / line height | Weight | Web source at 390 px | Use |
| --- | --- | --- | --- | --- |
| `type.display` | 28 / 35, `fonts.display` | 400 | `SplashTitle`: Cubano, 1.75rem, line height 1.25 | Home section title "Explore music" |
| `type.pageTitle` | 32 / 40 | 400 | `h1` at <= 768 px | Page titles: login, tag, collection and wishlist screens |
| `type.title` | 24 / 26.4 | 600 | Release `h1` in `ItemViewTitle` (fluid, 24 at 390 px) | Release, track and now playing titles |
| `type.heading` | 20.8 / 28.8 | 400 | `h2` at <= 768 px, `Modal` title | Modal and search titles, in-page headings such as "About", the menu's user name |
| `type.label` | 16 / 16, uppercase | 400 | `SectionHeader` heading (`h3.h5`) | Section labels such as "RECENT RELEASES", in `colors.accent` |
| `type.body` | 16 / 24 | 400 | Body text and paragraphs | Body copy, inputs, button labels, menu links, empty states |
| `type.small` | 14 / 21 | 400 | `--mi-font-size-small`, artist links | Track titles and index, artist bylines, inline errors, notice messages |
| `type.caption` | 12.8 / 19.2 | 400 | `<small>` | Release dates, compact button labels |
| `type.xsmall` | 12 / 16 | 400 | `--mi-font-size-xsmall` | Track durations and contributors, player times, search group headings |
| `type.cardTitle` | 14 / 19.25 | 400 | `ReleaseCard` title | Release grid titles |
| `type.cardMeta` | 12 / 18 | 400 | `ReleaseCard` artist link | Release grid artist names, in `colors.accent` |
| `type.chip` | 12.8 / 16 | 400 | `Pill` (0.8rem) | Tag chips |
| `type.formLabel` | 17.6 / 26.4 | 600 | Login form labels | Form labels |
| `type.large` | 19.2 / 22.4 | 400 | Artist name `h1`, big buttons (1.2rem) | Artist name (with weight 600), "Releases" tab, `Button` size big |
| `type.listItem` | 15.2 / 24 | 400 | Search result rows (0.95rem) | Search result rows |

Measured elements without a style of their own start from the nearest style:

| Element | Web at 390 px | Mobile |
| --- | --- | --- |
| Track row | title 14 on a 28 line, index 14, duration 12 weight 700 | `type.small` for title and index, `type.xsmall` weight 700 for the duration |
| Player title | 12 / 18, weight 600 | `type.xsmall` with `lineHeight: 18`, `fontWeight: "600"` |
| Player meta | 10.4 | `fontSize: 10.4` |

Web heading defaults at <= 768 px, for elements without a measured value: `h1` 32 / 40, `h2` 20.8 / 28.8, `h3` 19.2, `h4` 20.8, `h5` 19.2 (16 at <= 430 px), `h6` 17.6.

- `type` styles carry no color. Pair them with `ThemedText` or a color from `useColors()`.
- Web headings use weight 400. Use 600 only where the web does: the release title, form labels, the artist name, the player title and search group headings.

## Spacing and layout

| Pattern | Mobile | Web source |
| --- | --- | --- |
| Screen side padding | `gutter` (8), the web page gutter at 390 px | `--mi-side-paddings-xsmall` at <= 768 px |
| Release cover | Square, window width minus 2 x `gutter` (372 at 390) | Release page cover |
| Release grid | 2 columns, `spacing.md` (12) column gap, `spacing.lg` (16) below each card | `TrackgroupGrid` at <= 768 px (181 px columns at 390), `ReleaseCard` |
| Grid card | Cover, `spacing.sm` (8), title, `spacing.xs` (4), artist link | `ReleaseCard` |
| Page title | `type.pageTitle` with `spacing.md` above and below | Profile `h1` (margin 0.7rem 0) |
| Between sections | `spacing.xxl` (32) | `SectionHeader` top margin (2rem) |
| Section label | 14 padding above, 10 below, then `spacing.sm` (8) to the content | `SectionHeader`: 0.85rem and 0.65rem padding, 0.25rem margin, plus the grid's 0.25rem top padding |
| Tag chip list | `spacing.sm` (8) gap, `spacing.lg` (16) above and below | `TrackGroupPills` |
| Track row | 44 minimum (`touchTarget`), `gutter` side padding, 28 index box, `spacing.sm` gaps | `TrackRow`: 36 tall, 4 vertical padding, 28 line |
| Form column | 300 wide and centered, `spacing.lg` (16) side padding, 10% of the window height above | Login page, `--mi-container-small` |
| Form field | Label, `spacing.sm` (8), input, `spacing.xl` (24) before the next field | `FormComponent` |
| Modal title bar | `radius.lg` (15) top padding, `spacing.lg` sides, `spacing.sm` bottom | `Modal` header, sheet padded by `--mi-border-radius-x` |
| Modal content | `spacing.lg` (16) padding | `Modal` at <= 576 px |
| Screen header | 50 tall, `gutter` side padding | `Header` |

## Radii and borders

Borders are 1 pt in `colors.border`, which holds the same value as `tintX` (the web's `--mi-border` is `solid 1px var(--mi-tint-x-color)`). The edges of the screen header, the footer and the artist page strip use `StyleSheet.hairlineWidth`. Mobile has no shadow tokens: where the web draws a shadow (header, player bar), mobile draws a hairline.

| Element | Radius | Border |
| --- | --- | --- |
| Solid button | `radius.sm` | None |
| Outlined button | `radius.sm` | 1 pt in the label color (`accent`) |
| Icon-only button (`onlyIcon`) | `radius.pill`, 30 pt circle | 1 pt `accent` when outlined |
| Play/pause circle | `radius.pill`, 40 in the footer, 64 on now playing | 1 pt `accent` |
| Release play button | `radius.pill` | 1 pt `button` (`disabled` without playable tracks) |
| Input | `radius.sm` | 1 pt `border`, 1 pt `accent` on the search input |
| Notice box | `radius.sm` | 4 pt left rule in `alertBorder` |
| Empty state box | `radius.sm` | 1 pt `tintX` |
| Search card | `radius.sm` | 1 pt `border` |
| Tag chip | `radius.lg` | 1 pt `tintX`, `coverChipBorder` on the search overlay |
| Avatar | `radius.pill` | None |
| Covers and artwork | 0 | None |
| Screen header | 0 | Hairline bottom edge in `border` |
| Modal title bar | 0 | 1 pt `border` under a titled bar |
| Footer | 0 | Hairline top edge in `playerShadow` |

## Component inventory

Web paths are relative to `client/src/components/`. Status describes the mobile code today.

| Web component | Mobile counterpart | Status |
| --- | --- | --- |
| `common/Button.tsx` | `components/Button.tsx` | Matches, with the differences below |
| `common/Pill.tsx` in `TrackGroup/TrackGroupPills.tsx` | `TagPill` (`tint`, `cover`), `TagPillList` | Matches |
| `Player/index.tsx`, `PlayingTrackDetails.tsx`, `PlayerActions.tsx` | `Footer` | Matches, with the [platform differences](#intentional-platform-differences) |
| `Header/Header.tsx`, `common/Logo.tsx` | `ScreenHeader`, `HeaderButton`, `BackButton`, `MirloLogo`, `SearchButton`, `MenuButton` | Matches, without the Donate button |
| `common/SectionHeader.tsx` | `SectionHeader` in `components/ScreenHeader.tsx` | Matches |
| `common/TrackList/TrackRow.tsx` | `TrackItem` in `PlayPauseWrapper`, `FavoriteTrackButton` | Matches, with 44 pt rows |
| `common/ReleaseCard.tsx` in `TrackgroupGrid` | `TrackGroupItem`, `useGridColumnWidth()`, `CollectionPurchase` | Matches |
| `common/Box.tsx` | `ErrorNotification` (warning), `CollectionEmpty` (bordered empty state) | Matches |
| `common/Modal.tsx`, `ConfirmDialog.tsx` | Modal routes with `DismissModalBar`, the `deleteAccount.tsx` button row | Matches, with native presentation |
| `common/CommandSearch/CommandSearch.tsx` via `Header/HeaderSearch.tsx` | `app/search.tsx`, `SearchHeader`, `SearchInput`, `SearchItem`, `SearchGroupHeading` | Matches, without filters or "More results" |
| `Header/Menu.tsx`, `Header/MenuLink.tsx` | `app/menu.tsx` with `MenuLink` and `Separator` | Matches |
| `Footer.tsx` link columns ("Mirlo", "Legal", "Connect") | `app/about.tsx` | Matches: 14 / 21 bold headings, 14 pt underlined accent links with brand icons, two columns, 44 pt rows. The web route `/pages/about` redirects to docs.mirlo.space |
| `common/Input.tsx`, `FormComponent.tsx`, `LogInForm.tsx`, `EmailVerification.tsx` | `LoginForm`, `app/emailVerificationModal.tsx` | Matches, with the login [platform differences](#intentional-platform-differences) |
| `common/Spinner.tsx`, `LoadingSpinner.tsx`, `FullPageLoadingSpinner.tsx` | `ActivityIndicator` in `colors.accent` | Matches: the web artist, release and track pages also load behind a centered spinner |
| `common/Snackbar.tsx` | None | `ErrorNotification` covers request errors |
| None | `app/now-playing.tsx` with `Player` | Mobile only |

### Button

`Button` takes `title` or `children`, `onPress`, `variant`, `size`, `rounded`, `onlyIcon`, `startIcon`, `endIcon`, `disabled`, `loading`, `fullWidth`, `style`, `textStyle` and the accessibility props.

| Variant | Web look and use | Mobile `Button` and use |
| --- | --- | --- |
| Default (`solid` on mobile) | `--mi-button-color` fill, `--mi-button-text-color` text. "Log in", "Sign up", "More releases" | `button` fill, `buttonText` label. "Log in", "Verify email", "Play album", purchase modal actions, "Delete account" |
| `outlined` | 1 px border and text in the button color, bold. "Browse tags", "View all artists" | 1 pt border and label in `accent`, weight 700. "Cancel", "Close", "Log out", wishlist and add-to-collection circles |
| `link` | Button color text, underlined, no padding | `accent` label, underlined, no padding. "Sign up" under the login form |
| `transparent` | Button color text and icon, bold, no border. Header and player icon buttons | `accent` label, weight 700, no border. The artist page "About" strip button |
| `dashed`, `pill`, `chip` | Artist management, embed widgets, artist header chips (`ArtistButton`) | Not used on mobile |

- Sizes: the web default is 16 px text with 8 by 11.2 padding (40 tall), `compact` is 12.8 px with 4.8 by 8, `tiny` is 12.8 px and 24 tall, and `big` is 19.2 px with 16 by 20.8. Mobile snaps these to the scale: default `type.body` with 8 by 12 (40 tall), `compact` `type.caption` with 4 by 8, `big` `type.large` at a 19.2 line with 16 by 24.
- Modifiers: web `rounded` sets radius 8, `onlyIcon` makes a circle (30 px at <= 768 px), and `buttonRole="warning"` uses `--mi-warning-color`. Mobile `rounded` uses `radius.pill`, `onlyIcon` makes a 30 pt circle, `fullWidth` stretches the button, and icons take the label color and size.
- States: web hover dims solid buttons and fills outlined and transparent ones, disabled sets opacity 0.6, and `isLoading` swaps the start icon for `LoadingSpinner`. Mobile shows opacity 0.6 on iOS and a `tintX` ripple on Android while pressed. Disabled solid buttons get a `disabled` fill with an `inactive` label, and other variants a `disabled` label and border. `loading` hides the label behind a spinner in the label color and sets `busy`. `hitSlop` brings every button to 44.

### Tag chip

| | Web `Pill` in `TrackGroupPills` | Mobile `TagPill` |
| --- | --- | --- |
| Size | 26 tall, padding 4 by 8, text 12.8 / 16 | Same with `type.chip`, plus `hitSlop` of 9 above and below and 4 at the sides (44 tall) |
| `tint` | Accent text, tint fill, 1 px tint-x border, radius 15 | `accent`, `tint`, `tintX`, `radius.lg`. Release tags on the album screen |
| `cover` | 80% black fill, white text, 25% white border | `coverChip`, `coverChipText`, `coverChipBorder`. Popular tags on the search overlay |
| List | Wrapping row, gap 8, margin 16 above and below | `TagPillList`: gap 8, 9 padding plus 7 margin above and below, so Android keeps the slop inside the parent |
| States | Hover: tint-x fill. Links to `/releases?tag=` | Pressed: `tintX` fill on iOS, `tintX` ripple on Android. `link` role, opens `/tags/[tag]` |

### Player bar

| | Web `Player` | Mobile `Footer` |
| --- | --- | --- |
| Size | 59 tall | 56 minimum row with `gutter` padding, plus the seek area and the bottom inset |
| Colors | `--mi-fixed-bg-color` and `--mi-fixed-fg-color` by page tone: off-white on light pages, `#111` on dark | `playerBackground` by system theme |
| Edge | Drop shadow, 1.6 px blur, foreground at 30% | Hairline top border in `playerShadow` |
| Progress | 6.4 accent fill on the top edge, 16 px hit area, `slider` role, 5 s and 30 s keyboard steps | 6.4 accent fill, 24 pt hit area, drag to seek, `adjustable` role with 10 s steps |
| Track info | 48 px art, title 12 / 18 weight 600, meta 10.4 | 40 pt art in a 44 pt button when the window is at least 360 wide, opens now playing, no title text |
| Controls | Skip: 30 px buttons with 22 px `MdSkipPrevious` and `MdSkipNext`. Play/pause: 40 circle, 1 px accent border, 17.6 glyph (`VscPlay`, `TfiControlPause`) | Skip: `MaterialIcons` at 22 in 44 pt buttons. Play/pause: 40 circle, 1 pt `accent` border, Ionicons `play-outline` and `pause-outline` at 18 |
| Navigation | None | Recent Releases, Your Collection, Your Wishlist: Ionicons at 26, filled in `accent` when active, outlined in `inactive` otherwise |
| Visibility | Shown while a track is loaded | Player part shows while a track is loaded, except on `/now-playing`. The nav row always shows |
| Pressed | Hover only | Opacity 0.6 on iOS, borderless ripple (radius 22, `border` color) on Android |
| Extras | `PlayerActions`: floating wishlist, support and buy buttons. Loop and shuffle hide at <= 576 px | None |

`app/now-playing.tsx` (mobile only) shows `DismissModalBar`, the cover at window width minus 2 x `gutter`, a `Slider` (`accent` fill, `tintX` track), times in `type.xsmall` and `secondaryText` with tabular figures, the title in `type.title`, album and artist links in `type.small` and `accent` on 44 pt rows, and `Player`: Feather shuffle and repeat at 22 (`accent` on, `inactive` off), `MaterialIcons` skip at 36, and a 64 pt play circle with a 1 pt `accent` border and an Ionicons glyph at 28.

### Screen header

| | Web `Header` | Mobile `ScreenHeader` |
| --- | --- | --- |
| Size | 50 tall, sticky, 8 side padding | 50 tall below the top inset, `gutter` side padding, `spacing.md` between buttons |
| Fill and edge | Page background, `box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1)` | `header` fill, hairline bottom border in `border` |
| Left | Logo, 32 px, pink | Home, collection and wishlist: `MirloLogo` (32, `accent` circle, `buttonText` glyph), scrolls the list to the top. Pushed screens: `BackButton` (FontAwesome5 `chevron-left` at 20 in `accent`) |
| Right | Donate now, search (`FaSearch` 20), log in (`FaUserAlt`) or menu (16 by 14 bars), 30 px buttons, all pink | `SearchButton` (`search` at 20) and `MenuButton` (`user-alt` at 16 signed out, the web's three-bar SVG signed in), in `accent`, in 30 pt `HeaderButton`s with `hitSlop` up to 44. The menu screen shows a close X here |
| States | Hover: tint fill | Pressed: opacity 0.6 on iOS, borderless `tintX` ripple on Android |

### Track row

| | Web `TrackRow` at phone width | Mobile `TrackItem` |
| --- | --- | --- |
| Size | 36 tall: 4 vertical padding, 28 line height | 44 minimum, `gutter` side padding, `spacing.sm` gaps |
| Index | 14 px in a 28 box, play glyph on hover, pause glyph while playing | `type.small`, centered in a 28 box |
| Title | 14, co-authors after it | `type.small`, wraps, contributors below in `type.xsmall` and `secondaryText` |
| Trailing | Duration 12 bold, 28 px options menu (favorite, links, embed, lyrics, download) | Duration in `type.xsmall` weight 700, then a favorite star (Ionicons at 16 in `accent`) in a 28 pt `HeaderButton` when signed in |
| States | Playing: weight 600. Not playable: opacity 0.6. Hover: tint-x fill | Playing: title in `accent`, weight 600. Not playable: opacity 0.6 and disabled. Pressed: opacity 0.6 on iOS, `tintX` ripple on Android |
| Accessibility | Play and pause buttons in the index box | `button` role with `selected` and `disabled` state. The favorite sits outside the row button so screen readers reach it |

### Release grid item

| | Web `ReleaseCard` in `TrackgroupGrid` | Mobile `TrackGroupItem` |
| --- | --- | --- |
| Layout | 2 columns at phone width: 181 px columns, 12 gap, 8 gutters, 16 below each card | `numColumns={2}`, `useGridColumnWidth()` for the column width, `spacing.md` gap, `gutter` padding, `spacing.lg` below each card |
| Cover | Square, full column width, no radius | Square, 600 px image, `tint` placeholder |
| Title | 14 / 19.25, weight 400, text color, one line, 8 below the cover | `type.cardTitle`, one line, `spacing.sm` above |
| Artist | 12 / 18 link in the button color, one line | `type.cardMeta` in `accent`, one line, `spacing.xs` above. `showArtist={false}` drops it on the artist page |
| Link | Release page | Album screen, or `href` when set. `CollectionPurchase` points purchased and favorited tracks at the track screen |
| States | Hover shows play, buy and wishlist actions over the cover | Pressed: opacity 0.6 on iOS, foreground `tintX` ripple on Android. `link` role, labeled with title and artist |

### Notices and errors

| | Web | Mobile |
| --- | --- | --- |
| Notice | `Box` success, info and warning: color at 30% over the background, 4 px left rule, radius 3, text color, padding 8 by 11.2 at <= 768 px | `ErrorNotification`: `alert` fill, 4 pt `alertBorder` rule, `radius.sm`, padding 8 by 12, title in `type.body` weight 600, message in `type.small`, `alert` role, dismiss X (FontAwesome5 `times` at 16) with `hitSlop` up to 44. `deleteAccount.tsx` uses the same box for its warning |
| Field error | 14 px `--mi-red-700` text with `role="alert"`. `FormError`: warning fill, white text, padding 8 by 16 | `type.small` in `danger` under the input |
| Toast | `Snackbar`: warning (`#f2897a`, black text), error (pink, white), success (`--mi-green-500`, white bold), radius 4 | None |

### Modal

| | Web `Modal` at <= 576 px | Mobile |
| --- | --- | --- |
| Presentation | Bottom sheet, full width, radius 8 on the top corners, slide up over 300 ms, backdrop `rgba(0, 0, 0, 0.6)`. `size="small"` is 90% wide and centered | Native modal routes (`presentation: "modal"`, slide from bottom): now playing, menu, about, delete account, purchase, play limit and verification flows. The album purchase dialog is a React Native `Modal` card on `scrim` (`radius.md`, `spacing.lg` padding and gap) |
| Header | Title `h2` (20.8 / 28.8), close button (`FaTimes`), 1 px tint-x border under a title | `DismissModalBar`: optional title in `type.heading` (85% wide at most), FontAwesome5 `times` at 20 in `text` in a 30 pt `HeaderButton`, 1 pt `border` under a titled bar. Without a title the X sits on the right |
| Content | Padding 16 on the sides and bottom | `spacing.lg` padding |
| Dismiss | Close button, backdrop tap, Escape, focus trap | Close button, swipe down on iOS, back on Android |
| Confirm | `ConfirmDialog`: right-aligned row, outlined Cancel then solid confirm, 8 apart, 24 above | `deleteAccount.tsx`: the same row with `Button`s, then `Alert.alert` with a destructive action |

### Search overlay

| | Web `CommandSearch` | Mobile `app/search.tsx` |
| --- | --- | --- |
| Surface | `bg-black/85`, dialog `min(90vw, 640px)` wide, 10vh from the top, 12 gap | `overlay` fill with a light status bar, top padding the larger of the inset and 10% of the window height, 20 sides, `spacing.md` gap |
| Header | Title in 20 px semibold white, close button | `SearchHeader`: title in `type.heading` and `coverChipText`, FontAwesome5 `times` at 20 in a 44 pt `HeaderButton` with a `coverChipBorder` ripple |
| Input | 16.8 px, padding 10 by 40, 1 px border (button color on focus), radius 3, search icon on the left | `SearchInput`: 47 tall, 16.8 text, padding 10 by 40, 1 pt `accent` border, `radius.sm`, FontAwesome5 `search` at 16 in `inputText`, trailing spinner or clear X in a 44 pt slot |
| Empty query | Type filter radios | "Search by popular" (`type.label`, `coverChipText`), `cover` tag chips, "Popular" and "Top listened" links (`type.body`, underlined, 44 pt) |
| Results | Card on the page background, radius 3, groups with 12 px semibold uppercase headings, 15.2 px rows with 14 px insets, "More results" link | `SectionList` card (`background`, `radius.sm`, 1 pt border). Groups: Tags, Artists, Releases, Tracks. `SearchGroupHeading`: `type.xsmall`, weight 600, uppercase, 0.05em tracking, `secondaryText`. `SearchItem`: `type.listItem`, 44 minimum, "Artist · Title", `tint` pressed fill |
| No results | 14.4 px centered message, 24 vertical padding | Card with a centered `type.small` message in `secondaryText`, `spacing.xl` vertical padding |

### Menu

| | Web `Menu` dialog | Mobile `app/menu.tsx` |
| --- | --- | --- |
| Frame | Full-width dialog at phone width, 16 padding, close button at the top right, backdrop `rgba(0,0,0,.5)` | Modal route, `ScreenHeader` with a close X (FontAwesome5 `times` at 20 in `text`), `spacing.lg` padding |
| Links | `MenuLink`: padding 0.5em, radius 3, hover inverts to a text-color fill with an underlined background-color label | `MenuLink`: `type.body`, 44 tall, `radius.sm`, inverts the same way while pressed |
| Groups | 1 px tint-x separators, 8 above and below | 1 pt `tintX` separators, `spacing.sm` above and below, user name in `type.heading` |
| Actions | Solid "Log out" at the bottom | Outlined "Log out" (solid "Log in" when signed out), `fullWidth`, and a "Delete account" link in `danger` |

### Login form

| | Web `LogInForm` | Mobile `LoginForm` in `app/login.tsx` |
| --- | --- | --- |
| Layout | 300 column on the page background | 300 column, centered, on `background`, below a `ScreenHeader` with `BackButton`, title in `type.pageTitle` |
| Label | Above the input, 17.6, weight 600, text color, 8 gap | `type.formLabel`, `spacing.sm` below |
| Input | 300 by 42, white fill, black 16 px text, padding 8 by 12, 1 px tint-x border, radius 3, radius 8 while focused | 44 minimum height, `inputBackground`, `inputText` at 16, padding 8 by 12, 1 pt `border`, `radius.sm` |
| Submit | Solid, 40 tall, spinner while pending | Solid `Button`, `fullWidth`, `loading` while pending |
| More | "or" divider, the email code form, password reset and sign up links | Sign up `link` button with the `link` role, `spacing.xxl` above |

`app/emailVerificationModal.tsx` carries the email code flow: `DismissModalBar` titled "Log in", an outlined `fullWidth` "Login or Sign Up to View!" button, the web's "or" divider (1 pt `border` rules, `spacing.lg` around them), then the email and code fields with the `LoginForm` metrics and a solid `fullWidth` submit.

### Loading

| | Web | Mobile |
| --- | --- | --- |
| Page | `Spinner`: two expanding rings, 4 px `--mi-lighter-foreground-color`, 80 px (60 small), centered in a 200 px minimum height. `FullPageLoadingSpinner`: tint overlay | `ActivityIndicator size="large"` in `accent`. `collections.tsx` and `wishlist.tsx` show it below the screen header, other screens return it before the header renders |
| In a button | `LoadingSpinner` (`AiOutlineLoading`, one turn per 0.5 s) replaces the start icon | `Button` `loading`: spinner in the label color over the hidden label. `PlayFeaturedButton`: small spinner in `buttonText` |
| Search | Spinner at the end of the input | Small `accent` spinner in the input's trailing slot |
| Next page | Not applicable | Large `ActivityIndicator` in the list footer with `spacing.xxl` above and below |
| Skeleton | `LoadingBlocks`: tint to tint-x shimmer, radius 5, on roster, search and post pages | Not used: no mobile screen maps to those pages |

## Usage rules

### Buttons

- One solid `Button` carries the primary action of a screen or form, such as "Log in", "Verify email" or "Play album".
- `outlined` buttons carry secondary actions beside a solid one, such as "Cancel" next to "Delete account". Album actions (wishlist, add to collection) are outlined `onlyIcon` circles, and share is a solid one.
- `link` buttons sit inside running text or below a form. `transparent` buttons label a strip or toolbar, and header icons use `HeaderButton`.
- The release play button is a solid `rounded` button, 70% wide, with a 1 pt `button` border, as "Play album" is on the web.
- Confirmations follow the web `ConfirmDialog`: a right-aligned row with the outlined cancel first and the solid confirm second, `spacing.sm` apart and 24 above. A destructive action then confirms with `Alert.alert` (`style: "destructive"`), as `deleteAccount.tsx` does. Destructive links use `colors.danger`.

### Forms

- Labels sit above inputs in `type.formLabel` and `colors.text`, with `spacing.sm` below.
- Inputs have a 44 pt minimum height (web 42), an `inputBackground` fill, `inputText` at 16, `spacing.sm` by `spacing.md` padding, a 1 pt `colors.border` border and `radius.sm`, with `inputPlaceholder` placeholders.
- `spacing.xl` separates fields. The submit button is a `fullWidth` solid `Button` below the last field.
- Chain fields with `returnKeyType="next"` and submit from the last one with `returnKeyType="go"`, as `LoginForm` does.

| Field | Props |
| --- | --- |
| Email | `keyboardType="email-address"` (or `inputMode="email"`), `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="email"`, `textContentType="emailAddress"` |
| Password | `secureTextEntry`, `autoComplete="password"`, `textContentType="password"` |
| Verification code | `inputMode="numeric"`, `autoComplete="one-time-code"`, `textContentType="oneTimeCode"`, as on the web |
| Search | `returnKeyType="search"`, `autoCorrect={false}`, `autoCapitalize="none"`, `autoFocus` |

### Errors

- Field errors: one line of `type.small` in `colors.danger` under the input, with `accessibilityRole="alert"`, matching the web's 14 px `--mi-red-700` text.
- Request and network errors: `ErrorNotification` at the top of the content. There are no toasts.
- Report failures after a confirmed destructive action with `Alert.alert`.

### Empty states

- Grids use `CollectionEmpty` as `ListEmptyComponent`: the web's bordered `Box` with a 1 pt `tintX` border, `radius.sm`, 8 by 12 padding and `type.body`. The header and footer stay in place.
- Search shows its no-results message as a card, matching the web's centered message.
- Other lists show one plain sentence in `type.body` and `colors.secondaryText`, with `gutter` side padding and `spacing.lg` above, as the artist page does.
- Use text only, as the web does.

### Loading states

- Screen load: `ActivityIndicator size="large"` in `colors.accent`, centered below the screen header, as `collections.tsx` and `wishlist.tsx` do.
- Next page: a large `ActivityIndicator` in `ListFooterComponent` with `spacing.xxl` above and below.
- Buttons: pass `loading` to `Button`. It keeps its size, shows a spinner in the label color and sets `disabled` and `busy`. The web keeps the label and swaps the start icon for a spinner.
- Skeletons: none today. A new one follows `LoadingBlocks` with a `tint` to `tintX` shimmer and respects reduced motion.

### Press feedback

Use `Pressable` with a `style` callback, as `Button`, `HeaderButton`, `TagPill` and `Footer` do.

| Platform | Icon buttons | Buttons and surfaces (chips, cards, rows, links) |
| --- | --- | --- |
| Android | `android_ripple` with `borderless: true` and radius 22 in `colors.tintX` or `colors.border` (same value), or `coverChipBorder` on the search overlay. Opacity stays 1 | `android_ripple={{ color: colors.tintX }}`, with `foreground: true` over images |
| iOS | Opacity 0.6 while pressed | Opacity 0.6. Chips switch to a `tintX` fill, search rows add a `tint` fill, and menu links invert to a `text` fill, as the web hover does |

### Icons

- Use the web's glyph when `@expo/vector-icons` ships its set: `FontAwesome5` for `react-icons/fa` (search, `user-alt`, `chevron-left`, `times`), `MaterialIcons` for `react-icons/md` (skip), and Ionicons for `react-icons/io` and `io5` (heart, add).
- Sets with no Expo equivalent get the closest glyph: Ionicons `play-outline` and `pause-outline` for `VscPlay` and `TfiControlPause`, Feather `repeat` and `shuffle` for `RxLoop` and `RxShuffle`, FontAwesome5 `share-alt` for `BsShare`.
- Mobile-only controls, such as the footer navigation and the favorite star, use Ionicons.

### Accessibility

- Give every icon-only control an `accessibilityLabel`, plus an `accessibilityHint` when the label doesn't make the result clear.
- Set roles: `button` for actions, `link` for navigation to content, `adjustable` for the progress bar, `alert` for errors, `header` for screen titles and section labels.
- Set states: `selected` on the active footer item, the playing track row and active shuffle and repeat, `disabled` on disabled controls, `busy` while loading. Repeat also reports its mode through `accessibilityValue`.
- Every control gets a 44 pt hit area (`touchTarget`). When the visual is smaller, add `hitSlop` up to 44, and pad the parent by the slop where Android would clip it, as `TagPillList` does.
- Text needs 4.5:1 against its background and icons need 3:1. `inactive` is 3.8:1 on white, so it's for icons and inactive states only.
- Measured pairs, light / dark: `text` on `background` 21 / 16.7, `secondaryText` 9.6 / 9.2, `accent` 5.5 / 5.5, `buttonText` on `button` 5.5, `danger` 11.6 / 7.8, chip `accent` on its `tint` fill 5.2 / 4.5, `inactive` 3.8 / 5.0. Recheck these when a token changes.

## Intentional platform differences

| Topic | Web | Mobile |
| --- | --- | --- |
| Touch targets | 30 px (`--mi-touch-target-min`) | 44 pt (`touchTarget`), with `hitSlop` when the visual is smaller |
| Refreshing the home feed | "Refresh" button on the recent releases row | Pull to refresh, the row keeps the play-all button |
| Rows and inputs | Track rows 36, inputs 42 | 44 minimum for track rows, menu links, search rows and inputs |
| Donate | "Donate now" button in the header | None, to follow App Store rules |
| Artist colors | Artist and release pages apply each artist's colors (`ArtistColorsProvider`) | Instance palette everywhere |
| Release tags | The web source renders `TrackGroupPills` after the about text, the live World Wore page showed none | The album screen renders its tag chips in the same place |
| Player and navigation | Player bar, navigation in the header and menu | `Footer` combines three nav buttons (Recent Releases, Your Collection, Your Wishlist) with the player, and hides the player part on now playing |
| Now playing | None | Full-screen `now-playing` modal opened from the footer art |
| Search | `CommandSearch` with type filters and a "More results" link to the search page | Overlay with popular tags, two list links and grouped results, without type filters or "More results" |
| Login | Email and password, an "or" divider, the email code form and the password reset link | Email, password and the sign up link. The email code form lives in `emailVerificationModal.tsx` for purchase and wishlist flows, and there's no password reset link |
| Dark mode | None | Follows the system setting through `useColorScheme()`, with the derived dark tokens |
| Safe areas | Not applicable | Screen headers pad by the top inset, `Footer` by the bottom inset |
| Body font | `--mi-font-family-stack` (`system-ui`, `sans-serif`, emoji fonts) | Platform default, Cubano only through `fonts.display` |
| Press states | Hover and focus styles | Android ripple, iOS opacity 0.6 or a tinted fill |
| Header edge | `box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1)` | Hairline bottom border in `colors.border` |
| Player edge | Drop shadow, foreground at 30% | Hairline top border in `colors.playerShadow` |

## Reference implementations

| Platform | Files | Imitate |
| --- | --- | --- |
| Web | `client/src/components/common/Button.tsx`, `Button.stories.tsx` | One component whose `variant`, `size` and `buttonRole` props cover every look, with colors from CSS variables and the hover, disabled and loading states built in. |
| Mobile | `components/Button.tsx`, `components/TagPill.tsx`, `components/Footer.tsx` | Colors and sizes from tokens only, 44 pt targets through computed `hitSlop` or a fixed 44 pt wrapper, an Android ripple with an iOS fallback, and labels, roles and states on every control. |

Before committing UI changes, run `npx eslint . --ext .ts,.tsx`. The baseline is 2 errors, both unresolved `msw` imports in `stories/screens/`, and UI changes add none.
