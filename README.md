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

## Version 1

- Today dashboard with deterministic Clear, Build, and Become recommendations
- Supportive overwhelmed mode
- Dependency-aware items with plain-language blockers
- Clear, Build, Become, Vault, and Settings areas
- Employment routes, move-money buckets, Move Day timeline, and protected first month
- Create, edit, settle, and delete items
- Light and dark themes
- Local browser persistence
- Complete JSON export and import
- Responsive sidebar, tablet layout, and mobile navigation

The included seed data demonstrates the intended experience and can be edited freely.

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

The transparent scoring logic lives in `app/priorities.ts`. It favors safety and legality, prevention of financial damage, income, housing approval, deadlines, steps that unlock other work, and meaningful relief. It suppresses settled work, blocked work, and anything consciously marked **Allowed to wait**.
