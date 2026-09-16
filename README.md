# Randy’s Move OS

Move OS is a calm, mobile-friendly home for planning the Chicago move. It is intentionally organized around only two phases—**Pre-Move** and **Post-Move**—and three kinds of work:

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

- A focused Home view with four next actions, waiting items, quiet status rows, and the move countdown
- One flowing Pre-Move and Post-Move action list with timing filters and a compact Money / Work / Home / Moving / Life filter
- A separate Full Plan view for optional work, completed history, projects, goals, and reflections
- Clear, lightweight visual separation between Goals, Projects, Tasks, optional work, decisions, and references
- Dedicated Apartment Search, Move Fund, and Job Search tools that stay out of the daily task list
- Apartment comparisons including approval rules, fees, deposits, pet and parking costs, sublets, and specials
- A quick task editor that opens with only title, area, due date, and status; organization details stay under More options
- Universal search, quick add, References, Settings, light/dark themes, and JSON backup
- Responsive layouts built for phone, tablet, embedded, and desktop widths

## Existing data and migration

The browser key remains `move-os-v1`, so existing saved information is not reset. On load, schema 9 safely maps the earlier Clear / Build / Become, stage, stream, relationship, and status fields into the new phase / type / area model. Legacy fields remain optional in the stored objects for backward compatibility, but they are no longer required or exposed as the everyday interface.

Apartments, move money, profile details, dates, completion state, notes, references, and parent/dependency links are preserved.

## Move Action Items Google Sheet

The UI continues to use the `MoveRepository` boundary. Without a Sheet connection, `LocalMoveRepository` keeps a safe browser copy. When a deployed Apps Script URL is entered in **Settings → Move Action Items sync**, `GoogleSheetsMoveRepository` reads and writes the action rows while the browser copy acts as an offline fallback.

The Sheet tab should be named `Move Action Items` and supports these core columns:

`ID`, `Title`, `Phase`, `Type`, `Area`, `Status`, `Parent ID`, `Due Date`, `Notes`, `Current Value`, `Target Value`, `Unit`, `Blocker`, `Importance`, `Sort Order`, `Completed At`

To connect it:

1. Open the Google Sheet and choose **Extensions → Apps Script**.
2. Paste the contents of `docs/move-action-items-apps-script.gs`.
3. Deploy it as a web app that the site can access.
4. Paste the deployed web app URL into Move OS Settings.

Stable IDs are used for updates so editing an item does not create duplicate rows. If the Sheet cannot be reached, the interface clearly shows that sync is pending and preserves the change locally.

## Privacy

Move OS is not a place for Social Security numbers, passwords, full account numbers, or medical-document contents. Store only the planning details needed for the move. JSON exports contain all Move OS data and should be handled as personal files.
