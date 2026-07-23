# solevia-apps

Monorepo for Solevia's mobile apps and shared packages (pnpm + Turborepo).

Layout:
  apps/pop-zen        first app (existing code)
  apps/app-two        second app
  packages/ads        ad mediation wrapper, placements, frequency caps
  packages/consent    ATT prompt, GDPR/UMP consent flow
  packages/analytics  events, attribution
  packages/ui         shared components
  packages/config     eslint, tsconfig, EAS profiles

Status: folder skeleton only — build tooling not wired up yet.
