# Move OS

Move OS is a calm, responsive companion for preparing a major move. It keeps the full plan in one place while surfacing only a few useful actions at a time.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production check:

```bash
npm run build
npm run lint
npm test
```

## GitHub Pages

The GitHub repository is the canonical source for Move OS. Pushes to `main`
automatically build and publish the static app through the Pages workflow in
`.github/workflows/deploy-pages.yml`.

To verify that version locally:

```bash
npm run build:pages
npm run preview:pages
```

The published app continues to store its Version 1 data in the browser. Moving
the site to GitHub does not upload or expose any saved Move OS data.

## Version 1

- Today dashboard centered on the current income, credit, and housing reality
- Central progress Hub, calendar, and constellation-style connection map
- Apartment Search Matrix for Chicago-first and Denver-backup comparisons, including standard leases, sublets, approval rules, desired qualities, rent, application fees, deposits, pet/parking costs, other move-in costs, and verified specials
- Parent projects with editable subtasks and calm completion summaries
- Explicit relationship types, including true blockers, parallel work, decision gates, and deferred decisions
- Supportive overwhelmed mode
- Dependency-aware items with plain-language blockers
- Clear, Build, Become, Vault, and Settings areas
- Remote, Chicago-hybrid, and Denver-backup employment routes; move-money buckets; Move Day timeline; and protected first month
- Workbook-traceable financial buckets with explicit Known, Estimate, Need to think, Need information, Waiting on event, Decided, and Not applicable states
- Required actions, optional actions, unscored reflection, and attached decision guidance
- Completed actions cross out and soften; a global control can hide them while preserving their data
- Create, edit, complete, and delete items and apartment candidates
- Light and dark themes
- Local browser persistence
- Complete JSON export and import
- Responsive sidebar, tablet layout, and mobile navigation

The included seed data is a categorized snapshot of the August 21, 2026 **Move OS Action Items** sheet plus the current scope supplied alongside it. Sheet rows explicitly described as FYIs, self-discovery, conditional, or not physical tasks are represented as guidance, reflection, or optional actions instead of required work. The current source snapshot removes earlier Element-employer assumptions and treats Chicago as the leading destination.

## Data and privacy

Version 1 stores data only in the current browser via `localStorage`. The Vault intentionally accepts only titles, links, dates, categories, and notes. Do not enter Social Security numbers, full account numbers, passwords, medical document contents, or other highly sensitive information.

## Architecture

Components work with the `MoveRepository` interface rather than calling browser storage directly. `LocalMoveRepository` is the Version 1 implementation.

A future `GoogleSheetsMoveRepository` can implement the same interface against one **Move Database** spreadsheet with these anticipated tabs:

- Items
- Money
- Timeline
- Employment
- Housing
- Home
- People
- Reflections
- Reference

That integration should map Sheet rows to the types in `app/types.ts`, keep repository methods as the boundary, and leave the UI components unchanged. Google authentication and Sheets access are deliberately outside Version 1.

The responsive layout is designed to remain usable when embedded in Google Sites at tablet-like widths.

## Recommendation rules

The transparent scoring logic lives in `app/priorities.ts`. It favors safety and legality, prevention of financial damage, income, housing approval, deadlines, steps that unlock other work, and meaningful relief. It suppresses completed, deferred, optional, blocked, and **Allowed to wait** work. Reflection and decision guidance never enter completion percentages or recommendations.
