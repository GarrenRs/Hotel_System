# Reference — Operational Information

Long-lived, "reach for it often" facts that are **current** but not architecture:
deployment, environment/tooling gotchas on the dev machine, and the binding project
conventions.

| Doc | Contents |
|---|---|
| `deployment.md` | Per-client production rollout checklist (env vars, DB push/seed, branding swap) |
| `environment-notes.md` | Dev-machine tooling gotchas (PowerShell/curl/Prisma/Node) |
| `project-conventions.md` | Binding global rules for every task/phase |

Rule of thumb: anything that is a *decision about the running system* belongs in
`docs/architecture/`; anything that is *how to operate on this machine* belongs here.