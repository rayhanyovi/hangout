# Mobile Validation

Validation date: 2026-03-10

## Routes Checked

- `/`
- `/rooms/new`
- `/r/[joinCode]` with a real persisted room snapshot

## Viewports Checked

- `390 x 844`
- `320 x 844`

## Validation Method

- Local Next.js dev server running on `127.0.0.1:3000`
- Manual browser inspection with Playwright snapshots
- Horizontal overflow check via `document.documentElement.scrollWidth > window.innerWidth`

## Findings

- No horizontal overflow was detected on the validated routes at either breakpoint.
- Home, create-room, and live-room flows remained readable and vertically navigable on small screens.
- The room header action buttons were slightly cramped on the narrowest viewport, so they now stack vertically on small screens and return to a row on `sm` and above.

## Residual Risks

- The audit did not include landscape mobile layouts.
- The audit focused on MVP routes and did not cover every async edge case on-device, such as live geolocation permissions during a real mobile browser session.
