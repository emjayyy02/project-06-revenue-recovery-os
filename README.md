# Revenue Recovery OS

## V1 — Customer Churn & Recovery Intelligence

AI-assisted customer retention system for detecting explainable churn risk,
identifying revenue exposure, recommending recovery interventions, and
executing approved recovery workflows.

**Status:** M11.2 — local development and public demo behavior prepared; not deployed.

## M11.2 application modes

Only explicit `APP_MODE=development` enables backend writes. `demo`, missing,
or invalid modes return `403` / `DEMO_READ_ONLY` before database initialization
for mutation requests. AI assistance remains available and uses deterministic
fallback in restricted modes, even if a provider key is present.

The frontend uses the shared `VITE_APP_MODE` flag with the same fail-safe default.
Demo mode disables mutation controls and client helpers and displays
“Public demo — Actions disabled” in the sidebar. Reads, navigation, filters,
refresh, themes, and assistance remain available.

Local setup: use `backend/.dev.vars.example` and `frontend/.env.example` as
references. Keep `APP_MODE=development` in backend `.dev.vars` and
`VITE_APP_MODE=development` in frontend `.env.local`; restart existing dev servers
after changing environment variables. Rename a legacy `OPEN_ROUTER_API_KEY`
entry manually to `OPENROUTER_API_KEY`, preserving its value. Never commit secrets.
`ALLOWED_ORIGINS` is documented for a later checkpoint and is not consumed yet.

For isolated browser verification, run Vite with process-level
`VITE_APP_MODE=demo` on port 5175 and `VITE_APP_MODE=development` on port 5176.
Run `node frontend/verification/m112-browser.cjs` with `M10_PLAYWRIGHT` pointing
to an available Playwright package and `M11_SCREENSHOT_DIR` to an existing output
directory. API responses are intercepted; this verification does not write to
Supabase or dispatch automation.

Deployment, the separate demo database, database hardening, production origins,
and SPA rewrites remain deferred to later M11 checkpoints.
