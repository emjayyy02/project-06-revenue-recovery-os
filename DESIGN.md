---
name: Revenue Recovery OS
description: A restrained dark workspace for explainable risk and recovery decisions.
colors:
  rr-bg: "#10151c"
  rr-surface: "#151d27"
  rr-line: "#2b3542"
  rr-text: "#e5eaf1"
  rr-muted: "#a2b0c2"
  rr-blue: "#70b9ff"
  rr-blue-surface: "#1a3048"
  rr-green: "#83cfb0"
  rr-amber: "#dfbf7c"
  rr-red: "#f0959e"
  rr-low: "#aab7c8"
  rr-uncalculated: "#526173"
  button-primary: "#90c8ff"
  button-primary-hover: "#aed7ff"
  button-primary-text: "#101b28"
  field-bg: "#131d28"
  nav-active: "#1b2b3c"
  nav-active-text: "#cce6ff"
typography:
  body:
    fontFamily: "Segoe UI, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
    letterSpacing: "0"
  section-title:
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0"
  control:
    fontSize: "12px"
  supporting-metric:
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  control: "4px"
  initials: "5px"
  decision: "0"
spacing:
  inline: "8px"
  compact: "12px"
  group: "16px"
  section: "24px"
  column: "36px"
components:
  button-primary:
    backgroundColor: "{colors.button-primary}"
    textColor: "{colors.button-primary-text}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.button-primary-hover}"
  customer-field:
    backgroundColor: "{colors.field-bg}"
    textColor: "{colors.rr-text}"
    rounded: "{rounded.control}"
    padding: "8px 10px"
  nav-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.nav-active-text}"
    rounded: "{rounded.control}"
    padding: "11px 13px"
---

# Design System: Revenue Recovery OS

## Overview

**Creative North Star: "The Recovery Workspace"**

A premium dark operations interface built around quiet surfaces, clear numerical hierarchy, and a restrained blue signal. Dividers and spacing organize information; semantic color identifies risk, execution, and recovery without replacing text labels.

The shared identity connects Dashboard, Customers, Approvals, Analytics, and the established Customer 360. It supports an operator reading evidence and making decisions. This is a record of the implemented M10.5 visual system, not a new product specification; PRODUCT.md remains the authority for product behavior.

**Key Characteristics:**

- Dark tonal surfaces with fine dividers.
- Restrained blue identity and stroke icons.
- Large numerical anchors with compact supporting detail.
- Semantic status color paired with explicit labels.
- Flat analytical sections and selective decision surfaces.

## Colors

The palette combines cool charcoal neutrals with a clear blue accent and muted semantic signals. Frontmatter retains the exact shared CSS token names and values.

### Primary

- **Signal Blue** (`rr-blue`): product mark, active navigation indicator, text actions, keyboard focus, and coverage progress.
- **Blue Surface** (`rr-blue-surface`): informational status backing.
- **Primary Button**: a lighter blue action fill with dark text and a brighter hover state.

### Secondary

- **Recovery Green** (`rr-green`): recorded recovery and success.
- **Review Amber** (`rr-amber`): medium/high risk, pending approvals, and awaiting outcomes.
- **Critical Rose** (`rr-red`): critical risk, execution failure, and not-recovered outcomes.

### Neutral

- **Workspace / Surface / Line**: background, selective panel fill, and structural dividers.
- **Text / Muted**: primary information and secondary explanations.
- **Low / Uncalculated**: distinct neutral chart segments; uncalculated is not low risk.

**The Labeled Signal Rule.** Pair semantic color with a visible status label or legend and count; color alone does not explain a state.

## Typography

The shell uses the body stack recorded in frontmatter. The system favors readable compact operational text, section titles, and tabular numerals for amounts, counts, and percentages. Supporting text is generally 11–13px; badges and dense table metadata use 10px.

Supporting metric size is recorded in frontmatter. Dashboard exposure and Analytics performance use distinct larger numerical anchors, while section titles remain restrained. These are surface-specific hierarchy choices, not a requirement to enlarge every metric. Page headings use the shared system font, and compact uppercase eyebrows identify operational sections. These treatments are part of the chosen M10.5 direction.

**The Numerical Hierarchy Rule.** Give the page's principal operational measure more visual weight than supporting counts; align repeated numeric values using tabular figures.

## Layout

Desktop uses a sticky full-height sidebar (232px) and a flexible content column. Content padding is 30px 36px 48px; analytical and operations pages cap their width at 1320px and center within the content area. Sections use whitespace and one-pixel dividers instead of a universal card grid.

At 1100px and below, the sidebar becomes 196px, content padding becomes 24px, and paired analytical sections stack. At 720px and below, navigation becomes a four-item horizontal row above content, content padding becomes 24px 16px 32px, and chart legends and activity timestamps reflow. The risk ring caps at 200px on this narrow layout.

Customer filters use four columns, becoming two at 900px. The search spans the full row and caps at 620px. The customer table retains its 1120px minimum width within its own horizontal scrolling container. Pending approval cards become two columns at 1200px and above; history collapses from two columns at 1100px. Decision metadata collapses further at 420px.

## Elevation & Depth

The shared analytical and operations surfaces are flat. Tonal fills, one-pixel rules, and semantic rails establish grouping. Active desktop navigation uses an inset blue line; on mobile this moves to the bottom edge. This is a selected-state marker, not ambient elevation. Existing Customer 360 surface architecture remains authoritative for its own detailed account sections.

**The Section First Rule.** Use spacing and dividers for analytical grouping; use filled containers selectively for decision records, checkpoints, and feedback states.

## Shapes

Controls and navigation use the small corner radius recorded in frontmatter. Customer initials use a slightly softer square. Approval records have square corners and a thin semantic left rail. Circular shapes are reserved for status dots, activity markers, and the risk ring. Shared interface icons use inline SVG with a 24-unit viewBox, no fill, a 1.6-unit current-color stroke, and rounded caps and joins; the common rendered size is 18px.

## Components

### Buttons and fields

Controls have a minimum height of 38px. Primary actions use the light blue fill; secondary controls use dark tonal fills and borders; destructive actions use a transparent fill and rose text/border. Disabled operations buttons use reduced opacity and the not-allowed cursor. Keyboard focus uses a blue 2px outline with a 4px offset. Hover adds brightness, with specific fill changes on button variants. Reduced-motion preference disables shell transitions and animations.

Customer filters sit directly on the page. Inputs and selects share dark fill, fine border, and compact typography. Search adds a small inline stroke icon and extra left padding. Labels remain visible above controls.

### Navigation and identity

The recovery mark is a restrained blue rising signal drawn over an axis. Four labeled routes share the stroke icon family. Active navigation has a blue inset indicator and distinct fill. The desktop footer identifies the demo environment; the mobile arrangement preserves the compact product identity and labeled navigation.

### Status chips and customer identity

Status badges combine a small current-color dot with text. Customer table badges remove the filled backing and border to reduce density; execution badges in that table omit the dot. Initials accompany the company name and muted email instead of illustrative avatars. Hover and keyboard focus within a customer row share a subtle tonal highlight.

### Analytical summaries

The dashboard gives revenue exposure the strongest numerical emphasis. The risk ring represents current customer counts across low, medium, high, critical, and uncalculated; its adjacent legend exposes every count. The separate coverage bar compares scored accounts with total accounts. Revenue exposure bars explicitly exclude uncalculated accounts and explain that account value is not predicted loss.

The outcome stack uses actual recovered, not-recovered, and awaiting-outcome counts. A zero total renders an empty track and an explicit empty message. Recent activity separates sent interventions from recorded outcomes and retains readable timestamps.

### Decisions and history

Pending records use a warm rail; rejected records use a neutral rail; failures and not-recovered outcomes use rose; recovered outcomes use green. Compact history keeps its company identity, playbook, execution status, and outcome information visible. Controls wrap at narrow widths. The visual treatment does not merge execution success with customer recovery or change approval and final-outcome behavior.

## Do's and Don'ts

### Do:

- **Do** use the shared blue signal and inline stroke icon family.
- **Do** keep analytical sections flat and distinguish primary metrics from supporting counts.
- **Do** pair status colors with labels and expose the counts behind charts.
- **Do** preserve keyboard focus, responsive reflow, and local table scrolling.
- **Do** follow the established Customer 360 architecture for account details.

### Don't:

- **Don't** invent chart trends, counts, or recovery outcomes for visual effect.
- **Don't** treat uncalculated accounts as low risk or omit their coverage context.
- **Don't** equate a sent intervention with a recovered customer.
- **Don't** replace the product mark or interface SVGs with decorative glyph icons.
- **Don't** turn the current flat analytical composition into a wall of identical filled cards.
