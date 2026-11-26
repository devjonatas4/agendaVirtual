<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Roles live in `public.user_roles` (`admin`, `banda`) checked via `has_role()` in RLS; the first account created becomes admin via the signup trigger — keeps privileges out of user-editable data.
- Contractor contact and money live in `event_private` (admin-only RLS), separate from `events` — band members can read events without seeing private booking data.
- WhatsApp messages are sent via prefilled `wa.me` links from the owner's own WhatsApp Business app, not the WhatsApp API — no Meta template approval or webhook inbox needed; upgrade to the connector only if automatic sending is requested.
- Booking rules (phone normalization, date conflicts, message text) live as pure functions in `src/lib/booking.ts` with tests beside them — keeps rules testable without the backend.
