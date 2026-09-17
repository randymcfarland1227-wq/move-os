# Randy’s Move OS

Move OS is a calm, mobile-friendly external memory and decision-support system for Randy’s move. Chicago is currently leading while Denver and remote routes remain open. The everyday plan still uses only two phases—**Pre-Move** and **Post-Move**—and three kinds of work:

- **Goals** are outcomes and never appear as checkboxes.
- **Projects** organize multi-step work and show child-task progress.
- **Tasks** are concrete actions that can actually be completed.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The GitHub Pages version can be checked with:

```bash
npm run build:pages
npm run preview:pages
```

## Publishing

GitHub is the canonical source. A push to `main` runs `.github/workflows/deploy-pages.yml` and publishes the static app to GitHub Pages.

## What is included

- A focused Home view: move header with the working move window, Current Focus (up to five tasks, pinned tasks first), The Big Plan, Recent Progress, and compact tools
- Four planning workspaces—Cash Flow for the Move, Get Approved & Secure a Home, Physical Move Plan, and Medication & Essential Continuity—each with an outcome, requirements, routes, what I already know, open questions, an action plan (Now / Next / When X happens / Later), waiting items, completed work, and decisions. Every part is editable.
- Route tracking that keeps primary, parallel, and backup possibilities visible without turning all of them into current tasks
- A Cash Flow tool that separates available, confirmed, expected, pending, estimated, and unknown money
- Conservative and projected move positions, editable cash accounts, recurring entries, and manual resale balances
- Universal **Capture** for a task, decision, working assumption, question to figure out, or something to remember—optionally filed under a plan
- One flowing Pre-Move and Post-Move action list with timing filters and a compact Money / Work / Home / Moving / Life filter
- A separate Full Plan view for optional work, completed history, projects, goals, and reflections
- Clear, lightweight visual separation between Goals, Projects, Tasks, optional work, decisions, and references
- Dedicated Apartment Search, Move Fund, and Job Search tools that stay out of the daily task list
- Apartment comparisons including approval rules, fees, deposits, pet and parking costs, sublets, and specials
- A quick task editor that opens with only title, area, due date, and status; organization details stay under More options
- Universal search, quick add, References, Settings, light/dark themes, and JSON backup
- Responsive layouts built for phone, tablet, embedded, and desktop widths

## Existing data and migration

The browser key remains `move-os-v1`, so existing saved information is not reset. On load, schema 11 safely maps earlier schemas into planning workspaces: readiness gates become plans, routes/watches/decisions gain plan context, known tasks gain a plan and plan section, and the move window becomes profile context. Legacy fields remain optional for backward compatibility, but they are no longer required in the everyday interface.

Apartments, move money, profile details, dates, completion state, notes, references, and parent/dependency links are preserved.

## Move Action Items Google Sheet

The UI continues to use the `MoveRepository` boundary. Without a Sheet connection, `LocalMoveRepository` keeps a safe browser copy. When a deployed Apps Script URL is entered in **Settings → Move Action Items sync**, `GoogleSheetsMoveRepository` reads and writes the action rows while the browser copy acts as an offline fallback.

The action tab should be named `Move Action Items` and supports these core columns:

`ID`, `Title`, `Phase`, `Type`, `Area`, `Status`, `Parent ID`, `Due Date`, `Notes`, `Current Value`, `Target Value`, `Unit`, `Blocker`, `Importance`, `Sort Order`, `Completed At`

To connect it:

1. Open the Google Sheet and choose **Extensions → Apps Script**.
2. Paste the contents of `docs/move-action-items-apps-script.gs`.
3. Deploy it as a web app that the site can access.
4. Paste the deployed web app URL into Move OS Settings.

Stable IDs are used for updates so editing an item does not create duplicate rows. If the Sheet cannot be reached, the interface clearly shows that sync is pending and preserves the change locally.

The supplied Apps Script also creates two compact system tabs when needed:

- `Move Context` stores the move profile plus plans, plan sections, requirements, routes, questions, guides, decisions, assumptions, and watch items as JSON. Action rows also carry Plan ID, Plan Section ID, Route ID, Requirement ID, Action Stage, Trigger, and Pinned columns.
- `Move Cash Flow` stores accounts, incoming/outgoing entries, and resale balances as JSON.

This keeps the existing action rows readable while still making Google Sheets the future shared persistence layer. Components only talk to the `MoveRepository`; they never call browser storage or Google Sheets directly.

## Resale Hub integration

Version 1 includes a deliberately disconnected `ResaleHubProvider` boundary. Manual eBay, Poshmark, and Depop balances work now. Available money and pending money remain separate, and pending balances are excluded from the projection unless explicitly included. When the Resale Hub exposes a stable balance endpoint, a connected provider can replace the placeholder without changing the Cash Flow screens.

## Privacy

Move OS is not a place for Social Security numbers, passwords, full account numbers, or medical-document contents. Store only the planning details needed for the move. JSON exports contain all Move OS data and should be handled as personal files.
