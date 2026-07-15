# Antagonist Control Room module

## Current entry point

- Public page: `html/antagonists/control-room/index.html`
- Public content: `data/antagonists/control-room/recruitment-content.json`
- Renderer: `js/antagonists/control-room/recruitment-renderer.js`
- Draft storage adapter: `js/antagonists/control-room/contribution-store.js`
- Styles: `css/antagonists/control-room/recruitment.css`
- Canonical contribution contract: `data/antagonists/control-room/contribution-record.schema.json`
- Hero asset: `assets/antagonists/control_room_workspace/page_character.jpg`

## Failure boundary

The module owns its HTML, CSS, renderer, content, and storage adapter. If its content request or renderer fails, it shows an isolated error inside `#recruitmentApp`; it does not change global navigation or other Mathbhoot features.

## Current data behavior

`contribution-store.js` is intentionally a local-draft adapter. It stores one private draft in the contributor's browser and does not claim that Mathbhoot received it. This is not the production submission system.

## Production source of truth

The future backend should store all signed-in contributor submissions in one protected `contributions` collection or database table whose records follow `contribution-record.schema.json`. A static JSON file must never be writable from the public browser: that would expose contributor data, allow tampering, and provide no reliable authentication or concurrent-write protection.

Required backend collections:

- `users`: authenticated identity and role (`contributor`, `reviewer`, `owner`).
- `contributions`: canonical proposal, contributor ID, status, timestamps, review note, revision, and token award.
- `contribution_events`: append-only audit history for submit, review, revision, approval, rejection, implementation, and token changes.

Required authorization rules:

- Contributors may read and edit only their own drafts.
- Submitted records cannot be silently changed; revisions create auditable events.
- Only the owner or an authorized reviewer may review, approve, reject, or award tokens.
- Administrative secrets must never appear in browser code.
- Public clients must not list contributor emails or other private records.

## Reward-token meaning

Creator tokens are non-financial recognition points inside Mathbhoot. They must not be marketed or implemented as cryptocurrency, cash, investment, transferable value, or a guaranteed future benefit.

## Migration boundary

When a backend is approved, replace the implementation behind the contribution storage interface; do not place provider calls throughout the renderer. The page structure and canonical JSON schema should remain provider-independent.
