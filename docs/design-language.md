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
| `background` | `--mi-background-color` | `#ffffff` | `#111111` | Screen and list background |
| `header` | `--mi-background-color` (the web header uses the page background) | `#ffffff` | `#111111` | Screen header fill |
| `muted` | `--mi-alternate-background-color` (6% text mix) | `#f0f0f0` | `#1f1e1e` | Cover placeholders, menu rows, summary cards |
| `border` | `--mi-tint-x-color`, as used by `--mi-border` | `rgba(50, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.18)` | Borders, hairlines, separators, footer button ripple |
| `text` | `--mi-text-color` | `#000000` | `#f5f0f0` | Primary text, `ThemedText` default |
| `secondaryText` | `--mi-light-foreground-color` (73% mix) | `#454545` | `#b7b4b4` | Secondary text, dismiss chevron, share icon |
| `inactive` | `--mi-neutral-500` | `#8b8083` | `#8b8083` | Unselected nav icons, unplayable tracks, unset wishlist and favorite icons, disabled solid button label |
| `disabled` | `--mi-disabled-color` (13.3% mix) | `#dddddd` | `#2f2f2f` | Disabled button fill, label and border |
| `accent` | `--mi-button-color` used as text | `#BE3455` | `#e0607e` | Links, section labels, header and player icons, active nav icons, logo circle, progress fill, chip text, spinners |
| `button` | `--mi-button-color` | `#BE3455` | `#BE3455` | Filled button and play circle fill |
| `buttonText` | `--mi-button-text-color` | `#ffffff` | `#ffffff` | Text and icons on filled buttons, logo glyph |
| `danger` | `--mi-red-700` (light), `--mi-warning-color` (dark) | `#6e162d` | `#f2897a` | Inline errors, destructive actions |
| `alert` | `Box variant="warning"` fill: warning at 30% over the background | `#fbdcd7` | `#553531` | Notice box fill |
| `alertBorder` | `--mi-warning-color` | `#f2897a` | `#f2897a` | Notice box left rule |
| `playerBackground` | `--mi-fixed-bg-color` in `Player` | `#f5f0f0` | `#111111` | `Footer` fill |
| `playerForeground` | `--mi-fixed-fg-color` in `Player` | `#111111` | `#f5f0f0` | Text on the player fill |
| `playerShadow` | `Player` drop-shadow color: fixed foreground at 30% | `rgba(17, 17, 17, 0.3)` | `rgba(245, 240, 240, 0.3)` | `Footer` top hairline |
| `tint` | `--mi-tint-color` | `rgba(50, 0, 0, 0.03)` | `rgba(255, 255, 255, 0.08)` | Tag chip fill, grid cover placeholder |
| `tintX` | `--mi-tint-x-color` | `rgba(50, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.18)` | Chip border, pressed fill, ripples on buttons, chips and cards |
| `tintXX` | `--mi-tint-xx-color` | `rgba(50, 0, 0, 0.2)` | `rgba(255, 255, 255, 0.35)` | Strongest tint, equal to `tintX` in light |
| `inputBackground` | `--mi-background-color` on `Input` | `#ffffff` | `#111111` | Text input fill |
| `inputText` | `--mi-text-color` on `Input` | `#000000` | `#f5f0f0` | Text input text |
| `inputPlaceholder` | none (browser default) | `#757575` | `#8b8083` | Placeholder text |
| `overlay` | `CommandSearch` backdrop (`bg-black/85`) | `rgba(0, 0, 0, 0.85)` | `rgba(0, 0, 0, 0.85)` | Backdrop behind full-screen search |
| `scrim` | Header `Menu` backdrop (`rgba(0,0,0,.5)`) | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.5)` | Backdrop behind menus and dialogs |
| `coverChip` | `Pill variant="cover"` fill: `--mi-black` at 80% | `rgba(17, 17, 17, 0.8)` | `rgba(17, 17, 17, 0.8)` | Chip fill on artwork |
| `coverChipBorder` | `Pill variant="cover"` border: `--mi-white` at 25% | `rgba(255, 255, 255, 0.25)` | `rgba(255, 255, 255, 0.25)` | Chip border on artwork |
| `coverChipText` | `Pill variant="cover"` text: `--mi-white` | `#ffffff` | `#ffffff` | Chip text on artwork |

Dark values exist only on mobile, since the web has no system dark mode. They apply the web's dark tint profile (`SITE_THEME_PROFILE.tint.dark` in `client/src/utils/themeVariables.ts`: white at 0.08, 0.18 and 0.35) to a `#111111` background with `#f5f0f0` text, and recompute the web's `color-mix` percentages on that pair. `accent` changes to `#e0607e` in dark because `#BE3455` on `#111111` is 3.4:1. Filled buttons keep `#BE3455` with white text (5.5:1) in both themes.

### Web values without a mobile token

Add a token before using one of these on mobile.

| Web variable | Value | Web use |
| --- | --- | --- |
| `--mi-lighter-foreground-color` (68.2% mix) | `#515151` | Spinner rings, disabled input text |
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
| `spacing.xs` | `0.25rem` | 4 | same | Chip and track row vertical padding, compact button padding |
| `spacing.sm` | `0.5rem` | 8 | same | Chip horizontal padding, chip gap, input and button vertical padding, cover to title |
| `spacing.md` | `0.75rem` | 12 | same | Grid column gap, input and button horizontal padding, header button gap |
| `spacing.lg` | `1rem`, `--mi-side-paddings-small` | 16 | same | Tag list margin, modal content padding, form column padding |
| `spacing.xl` | `1.5rem` | 24 | same | Space after a form field |
| `spacing.xxl` | `2rem`, `--mi-side-paddings-normal` | 32 | same | Space between sections |
| `gutter` | `--mi-side-paddings-xsmall` | 8 (`spacing.sm`) | same | Screen side padding at phone width |

### Radius

| Mobile token | Web variable or value | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `radius.sm` | `--mi-border-radius` | 3 | same | Buttons, inputs, notice boxes |
| `radius.md` | `--mi-border-radius-focus` | 8 | same | Focused inputs, top corners of phone-width modal sheets, web `rounded` buttons |
| `radius.lg` | `--mi-border-radius-x` | 15 | same | Tag chips, modal corners on wide screens |
| `radius.pill` | `9999px` | 9999 | same | Release play button, mobile `rounded` and icon-only buttons |

### Touch target

| Mobile token | Web variable | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `touchTarget` | `--mi-touch-target-min` (30px) | 44 | same | Minimum hit area for every control, minimum input height |

## Type scale

Body text uses the system font on both apps. The web stack (`--mi-font-family-stack`) starts with `system-ui`, and mobile sets no font family, which gives San Francisco on iOS and Roboto on Android. `fonts.display` is Cubano Sharp, bundled from the web's `client/public/fonts/cubano-sharp.otf` and loaded in `app/_layout.tsx`. Use it only where the web uses `SplashTitle`: the splash heading and the home section titles ("Explore music", "Sustained by", "Mailing list").

| Mobile style | Size / line height | Weight | Web source at 390 px | Use |
| --- | --- | --- | --- | --- |
| `type.display` | 28 / 35, `fonts.display` | 400 | `SplashTitle`: Cubano, 1.75rem, line height 1.25 | Splash and home section titles |
| `type.pageTitle` | 32 / 40 | 400 | `h1` at <= 768 px | Page titles, such as the tag and login screens |
| `type.title` | 24 / 26.4 | 600 | Release `h1` in `ItemViewTitle` (fluid, 24 at 390 px) | Release and track titles |
| `type.heading` | 20.8 / 28.8 | 400 | `h2` at <= 768 px, `Modal` title | Modal titles, in-page headings such as "About" |
| `type.label` | 16 / 16, uppercase | 400 | `SectionHeader` heading (`h3.h5`) | Section labels such as "RECENT RELEASES", in `colors.accent` |
| `type.body` | 16 / 24 | 400 | Body text and paragraphs | Body copy, track titles, inputs, button labels |
| `type.small` | 14 / 21 | 400 | `--mi-font-size-small`, artist links | Artist bylines, inline errors, notice messages |
| `type.caption` | 12.8 / 19.2 | 400 | `<small>` | Helper text under forms and lists, compact button labels |
| `type.xsmall` | 12 / 16 | 400 | `--mi-font-size-xsmall` | Captions |
| `type.cardTitle` | 14 / 19.25 | 400 | `ReleaseCard` title | Release grid titles |
| `type.cardMeta` | 12 / 18 | 400 | `ReleaseCard` artist link | Release grid artist names, in `colors.accent` |
| `type.chip` | 12.8 / 16 | 400 | `Pill` (0.8rem) | Tag chips |
| `type.formLabel` | 17.6 / 26.4 | 600 | Login form labels | Form labels |
| `type.large` | 19.2 / 22.4 | 400 | Artist name `h1`, big buttons (1.2rem) | Artist name (with weight 600), "Releases" tab, `Button` size big |

Measured elements without a style of their own start from the nearest style:

| Element | Web at 390 px | Mobile |
| --- | --- | --- |
| Track row | title 14 on a 28 line, index 14, duration 12 weight 700 | `type.small` for title and index, `type.xsmall` weight 700 for the duration |
| Player title | 12 / 18, weight 600 | `type.xsmall` with `lineHeight: 18`, `fontWeight: "600"` |
| Player meta | 10.4 | `fontSize: 10.4` |

Web heading defaults at <= 768 px, for elements without a measured value: `h1` 32 / 40, `h2` 20.8 / 28.8, `h3` 19.2, `h4` 20.8, `h5` 19.2 (16 at <= 430 px), `h6` 17.6.

- `type` styles carry no color. Pair them with `ThemedText` or a color from `useColors()`.
- Web headings use weight 400. Use 600 only where the web does: the release title, form labels and the player title.

## Spacing and layout

| Pattern | Mobile | Web source |
| --- | --- | --- |
| Screen side padding | `gutter` (8), the web page gutter at 390 px | `--mi-side-paddings-xsmall` at <= 768 px |
| Release cover | Square, window width minus 2 x `gutter` (372 at 390) | Release page cover |
| Release grid | 2 columns, `spacing.md` (12) column gap, `spacing.lg` (16) below each card | `TrackgroupGrid` at <= 768 px (181 px columns at 390), `ReleaseCard` |
| Grid card | Cover, `spacing.sm` (8), title, `spacing.xs` (4), artist link | `ReleaseCard` |
| Between sections | `spacing.xxl` (32) | `SectionHeader` top margin (2rem) |
| Section label | 14 padding above, 10 below, then `spacing.sm` (8) to the content | `SectionHeader`: 0.85rem and 0.65rem padding, 0.25rem margin, plus the grid's 0.25rem top padding |
| Tag chip list | `spacing.sm` (8) gap, `spacing.lg` (16) above and below | `TrackGroupPills` |
| Track row | 36 tall: `spacing.xs` (4) vertical padding around a 28 line | `TrackRow` |
| Form column | 300 wide and centered, `spacing.lg` (16) side padding, 10% of the window height above | Login page, `--mi-container-small` |
| Form field | Label, `spacing.sm` (8), input, `spacing.xl` (24) before the next field | `FormComponent` |
| Modal content | `spacing.lg` (16) on the sides and bottom | `Modal` at <= 576 px |
| Screen header | 50 tall, `gutter` side padding | `Header` |

## Radii and borders

Borders are 1 pt in `colors.border`, which holds the same value as `tintX` (the web's `--mi-border` is `solid 1px var(--mi-tint-x-color)`). The edges of the screen header and the footer, and list separators, use `StyleSheet.hairlineWidth`. Mobile has no shadow tokens: where the web draws a shadow (header, player bar), mobile draws a hairline.

| Element | Radius | Border |
| --- | --- | --- |
| Solid button | `radius.sm` | None |
| Outlined button | `radius.sm` | 1 pt in the label color (`accent`) |
| Icon-only button | `radius.pill` (circle) | None, except player play/pause: 1 pt `colors.accent` |
| Release play button | `radius.pill` | 1 pt `colors.button` |
| Input | `radius.sm`, `radius.md` while focused | 1 pt `colors.border` |
| Notice box | `radius.sm` | 4 pt left rule in `colors.alertBorder` |
| Tag chip | `radius.lg` | 1 pt `colors.tintX`, `colors.coverChipBorder` on artwork |
| Modal sheet at phone width | `radius.md` on the top corners | 1 pt `colors.border` under the title bar |
| Covers and artwork | 0 | None |
| Screen header | 0 | Hairline bottom edge in `colors.border` |
| Footer | 0 | Hairline top edge in `colors.playerShadow` |

## Component inventory

Web paths are relative to `client/src/components/`. Status describes the mobile code today.

| Web component | Mobile counterpart | Status |
| --- | --- | --- |
| `common/Button.tsx` | `components/Button.tsx` | Matches, with the differences below |
| `common/Pill.tsx` in `TrackGroup/TrackGroupPills.tsx` | `TagPill`, `TagPillList` | Matches the `tint` variant |
| `Player/index.tsx`, `PlayingTrackDetails.tsx`, `PlayerActions.tsx` | `Footer` | Matches, with the [platform differences](#intentional-platform-differences) |
| `Header/Header.tsx`, `common/Logo.tsx` | `ScreenHeader`, `HeaderButton`, `BackButton` (`components/ScreenHeader.tsx`), `MirloLogo`, `SearchButton`, `MenuButton` | Matches. Screens not yet on `ScreenHeader` differ |
| `common/SectionHeader.tsx` | `SectionHeader` in `components/ScreenHeader.tsx` | Matches |
| `common/TrackList/TrackRow.tsx` | `TrackItem` inside `PlayPauseWrapper` | Differs |
| `common/ReleaseCard.tsx` in `TrackgroupGrid` | `TrackGroupItem` in a 2-column `FlatList` | Matches |
| `common/Box.tsx`, `FormError.tsx`, `Snackbar.tsx` | `ErrorNotification` | Matches `Box variant="warning"` |
| `common/Modal.tsx` | Modal routes in `app/_layout.tsx`, `DismissModalBar` | Partial |
| `common/Input.tsx`, `FormComponent.tsx`, `LogInForm.tsx` | `LoginForm` | Matches. `app/emailVerificationModal.tsx` differs |
| `common/Spinner.tsx`, `LoadingSpinner.tsx`, `Artist/LoadingBlocks.tsx` | `ActivityIndicator` | Native by design, skeletons to build |
| Plain text, no component | Plain `Text` per screen | Differs, see [Empty states](#empty-states) |
| None | `app/now-playing.tsx` with `Player`: cover, seek `Slider`, album and artist links, shuffle and loop | Mobile only |

### Button

| Variant | Web look and use | Mobile `Button` |
| --- | --- | --- |
| Default (`solid` on mobile) | `--mi-button-color` fill, `--mi-button-text-color` text. Primary actions: "Log in", "Sign up", "More releases" | `button` fill, `buttonText` label |
| `outlined` | 1 px border and text in the button color, bold, transparent fill. Secondary actions: "Browse tags", "View all artists" | 1 pt border and label in `accent`, weight 700 |
| `link` | Button color text, underlined, no padding. Actions inside text | `accent` label, underlined, no padding |
| `transparent` | Button color text and icon, bold, no border. Header and player icon buttons | `accent` label, weight 700, no border |
| `dashed`, `pill`, `chip` | Dashed outline in artist management, small pills in embed widgets, chips in the artist header (styled by `ArtistButton`) | Not used on mobile |

- Sizes: the web default is 16 px text with 8 by 11.2 padding (40 tall), `compact` is 12.8 px with 4.8 by 8, `tiny` is 12.8 px and 24 tall, and `big` is 19.2 px with 16 by 20.8. Mobile snaps these to the spacing scale: default `type.body` with 8 by 12, `compact` `type.caption` with 4 by 8, `big` 19.2 with 16 by 24.
- Modifiers: web `rounded` sets radius 8, `onlyIcon` makes a circle (30 px at <= 768 px), and `buttonRole="warning"` uses `--mi-warning-color`. Mobile `rounded` uses `radius.pill`, `onlyIcon` makes a 30 pt circle, and `fullWidth` stretches the button.
- States: web hover dims solid buttons and fills outlined and transparent ones, disabled sets opacity 0.6, and `isLoading` swaps the start icon for `LoadingSpinner`. Mobile shows opacity 0.6 on iOS and a `tintX` ripple on Android while pressed. Disabled solid buttons get a `disabled` fill with an `inactive` label, and other variants a `disabled` label. `loading` hides the content behind a spinner in the label color and sets `busy`. `hitSlop` brings every button to 44.
- Screens not yet on `Button` build buttons inline, such as `deleteAccount.tsx` (`#a21d1d` fill, radius 14) and the purchase and verification modals (white fills).

### Tag chip

| | Web `Pill variant="tint"` in `TrackGroupPills` | Mobile `TagPill` |
| --- | --- | --- |
| Size | 26 tall, padding 4 by 8, text 12.8 / 16 | Same, plus `hitSlop` of 9 above and below and 4 at the sides (44 tall) |
| Colors | Accent text, tint fill, 1 px tint-x border, radius 15 | `accent`, `tint`, `tintX`, radius 15 |
| List | Wrapping row, gap 8, margin 16 above and below | `TagPillList`: gap 8, 9 padding plus 7 margin above and below, so Android keeps the slop inside the parent |
| States | Hover: tint-x fill. Links to `/releases?tag=` | Pressed: `tintX` fill on iOS, `tintX` ripple on Android. `link` role, opens `/tags/[tag]` |
| Other variants | Default (lighten-x fill), `cover` (80% black fill, white text, 25% white border), `warning` (striped fill, warning border, bold) | `variant="cover"` for chips on artwork: `coverChip` fill, `coverChipBorder` border, `coverChipText` label |

### Player bar

| | Web `Player` | Mobile `Footer` |
| --- | --- | --- |
| Size | 59 tall | 56 minimum row, plus the seek area and the bottom inset |
| Colors | `--mi-fixed-bg-color` and `--mi-fixed-fg-color` by page tone: off-white on light pages, `#111` on dark | `playerBackground` by system theme |
| Edge | Drop shadow, 1.6 px blur, foreground at 30% | Hairline top border in `playerShadow` |
| Progress | 6.4 accent fill on the top edge, 16 px hit area, `slider` role, 5 s and 30 s keyboard steps | 6.4 accent fill, 24 pt hit area, drag to seek, `adjustable` role with 10 s steps |
| Track info | 48 px art, title 12 / 18 weight 600, meta 10.4 | 40 pt art in a 44 pt button when the window is at least 360 wide, opens now playing, no title text |
| Controls | Skip: 30 px buttons with 22 px `MdSkipPrevious` and `MdSkipNext`. Play/pause: 40 circle, 1 px accent border, 17.6 glyph (`VscPlay` outline, `TfiControlPause` thin bars) | Skip: `MaterialIcons` at 22 in 44 pt buttons. Play/pause: 40 circle, 1 pt `accent` border, Ionicons `play-outline` and `pause-outline` at 18 |
| Navigation | None | Recent Releases, Your Collection, Your Wishlist: Ionicons at 26, filled in `accent` when active, outlined in `inactive` otherwise |
| Pressed | Hover only | Opacity 0.6 on iOS, borderless ripple (radius 22, `border` color) on Android |
| Extras | `PlayerActions`: floating wishlist, support and buy buttons above the bar. Loop and shuffle hide at <= 576 px | None |

### Screen header

| | Web `Header` | Mobile `ScreenHeader` |
| --- | --- | --- |
| Size | 50 tall, sticky, 8 side padding | 50 tall below the top inset, `gutter` side padding, `spacing.md` between buttons |
| Fill and edge | Page background, `box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1)` | `header` fill, hairline bottom border in `border` |
| Left | Logo, 32 px, pink | Home: `MirloLogo` (32, `accent` circle, `buttonText` glyph), scrolls the list to the top. Pushed screens: `BackButton` (FontAwesome5 `chevron-left` at 20 in `accent`) |
| Right | Search (`FaSearch` 20), menu (16 by 14 bars) or log in (`FaUserAlt`), 30 px buttons, all pink | `SearchButton` (`search` at 20) and `MenuButton` (`user` at 16), FontAwesome5 in `accent`, in 30 pt `HeaderButton`s with `hitSlop` up to 44 |
| States | Hover: tint fill | Pressed: opacity 0.6 on iOS, borderless `tintX` ripple on Android |
| Modal routes | Not applicable | `DismissModalBar`: `chevron-down-outline` at 40 in `secondaryText`, 8% of the window height |

### Track row

| | Web `TrackRow` at phone width | Mobile `TrackItem` |
| --- | --- | --- |
| Size | 36 tall: 4 vertical padding, 28 line height | 5 padding plus 5 margin above and below a 16 pt line |
| Index | 14 px in a 28 box, play glyph on hover, pause glyph while playing | `1.` at 16, 30 wide |
| Title | 16, one line, co-authors after it | 16, one line, contributors on a second line |
| Trailing | Duration (bold at phone width), 28 px options button (`DropdownMenu`) | Favorite star at 15 when logged in, duration at 15 |
| Colors | Text color, hover tint-x fill | `secondaryText`, `inactive` when not playable |
| States | Playing: weight 600. Not playable: opacity 0.6 | Selected: bold. Not playable: `inactive`. No pressed feedback |

Follow: the web row metrics, a `tintX` pressed fill, and a 28 pt options button with a 44 pt hit area (to build).

### Release grid item

| | Web `ReleaseCard` in `TrackgroupGrid` | Mobile `TrackGroupItem` |
| --- | --- | --- |
| Layout | 2 columns at phone width: 181 px columns, 12 gap, 8 gutters, 16 below each card | `numColumns={2}`, `useGridColumnWidth()` for the column width, `spacing.md` gap, `gutter` padding, `spacing.lg` below each card |
| Cover | Square, full column width, no radius | Square, 600 px image, `tint` placeholder |
| Title | 14 / 19.25, weight 400, text color, one line, 8 below the cover | `type.cardTitle`, one line, `spacing.sm` above |
| Artist | 12 / 18 link in the button color, one line | `type.cardMeta` in `accent`, one line, `spacing.xs` above |
| States | Hover shows play, buy and wishlist actions over the cover | Pressed: opacity 0.6 on iOS, foreground `tintX` ripple on Android. `link` role, labeled with title and artist |

### Notices and errors

| | Web | Mobile |
| --- | --- | --- |
| Notice | `Box` success, info and warning: color at 30% over the background, 4 px left rule, radius 3, text color, padding 8 by 11.2 at <= 768 px, no dismiss | `ErrorNotification`: `alert` fill, 4 pt `alertBorder` rule, `radius.sm`, padding 8 by 11.2, title in `type.body` weight 600, message in `type.small`, `alert` role. Dismiss: FontAwesome5 `times` at 16 with `hitSlop` up to 44 |
| Field error | 14 px `--mi-red-700` text with `role="alert"`. `FormError`: warning fill, white text, padding 8 by 16 | `LoginForm`: `type.small` in `danger` under the input |
| Toast | `Snackbar`: warning (`#f2897a`, black text), error (pink, white), success (`--mi-green-500`, white bold), radius 4, near the top at <= 576 px | None |

### Modal

| | Web `Modal` at <= 576 px | Mobile |
| --- | --- | --- |
| Presentation | Bottom sheet, full width, radius 8 on the top corners, slide up over 300 ms, backdrop `rgba(0, 0, 0, 0.6)`. `size="small"` is 90% wide and centered | Native modal routes (`presentation: "modal"`, slide from bottom): now playing, menu, about, delete account, purchase and verification flows. Search is a fading `transparentModal`. `album-tracks.tsx` opens a React Native `Modal` card (radius 20, padding 35) |
| Header | Title `h2` (20.8 / 28.8), close button (`FaTimes`), 1 px tint-x bottom border, lighten fill | `DismissModalBar` or the menu's own 60 pt bar, no title |
| Content | Padding 16 on the sides and bottom | Set per screen |
| Dismiss | Close button, backdrop tap, Escape, focus trap | Dismiss bar, swipe down on iOS, back on Android |

Follow: keep native modal routes, and add a title bar (`type.heading` plus a close control with a 44 pt target) and `spacing.lg` content padding (to build).

### Login form

| | Web `LogInForm` | Mobile `LoginForm` in `app/login.tsx` |
| --- | --- | --- |
| Layout | 300 column on the page background | 300 column, centered, on `background`, below a `ScreenHeader` with `BackButton`, title 32 / 40 |
| Label | Above the input, 17.6, weight 600, text color, 8 gap | 17.6 / 26.4, weight 600, `spacing.sm` below |
| Input | 300 by 42, white fill, black 16 px text, padding 8 by 12, 1 px tint-x border, radius 3, radius 8 while focused. Disabled: tint fill, lighter foreground text | 44 minimum height, `inputBackground`, `inputText` at 16, padding 8 by 12, 1 pt `border`, `radius.sm` |
| Submit | Solid, 40 tall, spinner while pending | Solid `Button`, `fullWidth`, `loading` while pending |
| Links | Accent color, underlined | `Button variant="link"` with the `link` role, `spacing.xxl` above |
| Errors | `Snackbar` warning | Field errors in `type.small` and `danger`, request errors in `ErrorNotification` |

`app/emailVerificationModal.tsx` still uses a full-screen `#BE3455` background with white 20 pt labels, 300 by 40 inputs without a border and a white button. Follow: the `LoginForm` pattern.

### Loading

| | Web | Mobile |
| --- | --- | --- |
| Page | `Spinner`: two expanding rings, 4 px `--mi-lighter-foreground-color`, 80 px (60 small), centered in a 200 px minimum height. `FullPageLoadingSpinner`: tint overlay | `ActivityIndicator size="large"` in `accent`, centered with `flex: 1`, screen header hidden |
| In a button | `LoadingSpinner` (`AiOutlineLoading`, one turn per 0.5 s) replaces the start icon | `Button` `loading`: spinner in the label color over the hidden content. `PlayFeaturedButton`: small spinner in `buttonText` |
| Next page | Not applicable | Large `ActivityIndicator` in the list footer |
| Skeleton | `LoadingBlocks`: tint to tint-x shimmer, radius 5 | To build |

## Usage rules

### Buttons

- One solid `Button` carries the primary action of a screen or form, such as "Log in", "Verify email" or "Play album".
- `outlined` buttons carry secondary actions beside a solid one, such as "Cancel" next to "Delete account".
- `link` buttons sit inside running text or below a form. Icon actions in the screen header use `HeaderButton`.
- The release play button is a solid `rounded` button (`radius.pill`), as "Play album" is on the web.
- Destructive actions use `colors.danger` and confirm with `Alert.alert` (`style: "destructive"`) before they run, as `deleteAccount.tsx` does.

### Forms

- Labels sit above inputs: 17.6, weight 600, `colors.text`, `spacing.sm` below.
- Inputs have a 44 pt minimum height (web 42), an `inputBackground` fill, `inputText` at 16, `spacing.sm` by `spacing.md` padding, a 1 pt `colors.border` border, `radius.sm` (`radius.md` while focused) and `inputPlaceholder` placeholders.
- `spacing.xl` separates fields. The submit button is a `fullWidth` solid `Button` below the last field.
- Chain fields with `returnKeyType="next"` and submit from the last one with `returnKeyType="go"`, as `LoginForm` does.

| Field | Props |
| --- | --- |
| Email | `keyboardType="email-address"`, `autoCapitalize="none"`, `autoCorrect={false}`, `autoComplete="email"`, `textContentType="emailAddress"` |
| Password | `secureTextEntry`, `autoComplete="password"`, `textContentType="password"` |
| Verification code | `keyboardType="number-pad"`, `autoComplete="one-time-code"`, `textContentType="oneTimeCode"` (the web uses `inputMode="numeric"`) |
| Search | `returnKeyType="search"`, `autoCorrect={false}` |

### Errors

- Field errors: one line of `type.small` in `colors.danger` under the input, with `accessibilityRole="alert"`, matching the web's 14 px `--mi-red-700` text.
- Request and network errors: `ErrorNotification` at the top of the content.
- Confirm destructive actions and report their failures with `Alert.alert`.

### Empty states

- Show one plain sentence in `type.body` and `colors.secondaryText`, with `gutter` side padding and `spacing.lg` above it.
- Use text only, as the web does: "No results found" in the content column, or italic text at 0.7 opacity for missing album info.
- Render it inside the normal screen layout so the header and footer stay in place. Today `collections.tsx` and `wishlist.tsx` replace the whole screen with a bare `Text` ("No purchases found", "No wishlist found"), and search shows a 20 pt sentence with a 20 pt margin.

### Loading states

- Screen load: `ActivityIndicator size="large"` in `colors.accent`, centered in the content area below the screen header.
- Next page: a large `ActivityIndicator` in `ListFooterComponent` with `spacing.xxl` above and below.
- Buttons: pass `loading` to `Button`. It keeps its size, shows a spinner in the label color and sets `disabled` and `busy`. The web keeps the label and swaps the start icon for a spinner.
- Skeletons: to build, following `LoadingBlocks` with a `tint` to `tintX` shimmer.

### Press feedback

Use `Pressable` with a `style` callback, as `Button`, `HeaderButton`, `TagPill` and `Footer` do.

| Platform | Icon buttons | Buttons and tinted surfaces (chips, cards, rows) |
| --- | --- | --- |
| Android | `android_ripple` with `borderless: true` and radius 22 in `colors.tintX` or `colors.border` (same value), opacity stays 1 | `android_ripple={{ color: colors.tintX }}`, with `foreground: true` over images |
| iOS | Opacity 0.6 while pressed | Opacity 0.6, or a `colors.tintX` fill on chips (the web hover color) |

### Icons

- Use the web's glyph when `@expo/vector-icons` ships it: `FontAwesome5` for `react-icons/fa`, which covers most web icons (search, user, chevrons, close), and `MaterialIcons` for `react-icons/md` (the skip buttons).
- `react-icons/vsc`, `tfi` and `ai` have no Expo set. Use the closest Ionicons outline glyph, as `Footer` does with `play-outline` and `pause-outline`.
- Mobile-only controls without a web glyph, such as the footer navigation and the dismiss chevron, use Ionicons.

### Accessibility

- Give every icon-only control an `accessibilityLabel`, plus an `accessibilityHint` when the label doesn't make the result clear.
- Set roles: `button` for actions, `link` for navigation to content, `adjustable` for the progress bar, `alert` for errors, `header` for screen titles and section labels.
- Set states: `selected` on the active footer item, `disabled` on disabled controls, `busy` while loading.
- Every control gets a 44 pt hit area (`touchTarget`). When the visual is smaller, add `hitSlop` up to 44, and pad the parent by the slop where Android would clip it, as `TagPillList` does.
- Text needs 4.5:1 against its background and icons need 3:1. `inactive` is 3.8:1 on white, so it's for icons and inactive states only.

## Intentional platform differences

| Topic | Web | Mobile |
| --- | --- | --- |
| Touch targets | 30 px (`--mi-touch-target-min`) | 44 pt (`touchTarget`), with `hitSlop` when the visual is smaller |
| Dark mode | None | Follows the system setting through `useColorScheme()`, with the derived dark tokens |
| Player and navigation | Player bar, navigation in the header and menu | `Footer` holds the player controls and three nav buttons: Recent Releases, Your Collection, Your Wishlist |
| Safe areas | Not applicable | Screen headers pad by the top inset, `Footer` by the bottom inset |
| Body font | `--mi-font-family-stack` (`system-ui`, `sans-serif`, emoji fonts) | Platform default, Cubano only through `fonts.display` |
| Press states | Hover and focus styles | Android ripple, iOS opacity 0.6 or a `tintX` fill |
| Now playing | None | Full-screen `now-playing` modal opened from the footer art |
| Artist colors | Artist and release pages apply each artist's colors (`ArtistColorsProvider`) | Instance palette everywhere, pending a product decision |
| Header edge | `box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1)` | Hairline bottom border in `colors.border` |
| Player edge | Drop shadow, foreground at 30% | Hairline top border in `colors.playerShadow` |

## Reference implementations

| Platform | Files | Imitate |
| --- | --- | --- |
| Web | `client/src/components/common/Button.tsx`, `Button.stories.tsx` | One component whose `variant`, `size` and `buttonRole` props cover every look, with colors from CSS variables and the hover, disabled and loading states built in. |
| Mobile | `components/TagPill.tsx`, `components/Footer.tsx` | Colors from `useColors()`, 44 pt targets through `hitSlop` or a fixed 44 pt wrapper, an Android ripple with an iOS fallback, and labels, roles and states on every control. |
