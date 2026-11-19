# Codex workflow for Rikki Mobile Bar

## Define the gate before making changes

- Record the requested outcome, deliverable, scope, and observable pass conditions. For a small task, one work unit and one targeted check can be enough.
- For a larger task, split by behavior or failure domain. Give each unit its required inputs, bounded output, file or resource scope, and check. Add a dependency when a unit consumes a named output or must wait for access to shared mutable state.
- Retrieve the context each unit needs from the relevant entry points, callers, tests, and source material. Capture the starting state with Git status and diff when available. In a plain folder, capture the starting contents or hashes of files you plan to change and state the limits of scope verification.

## Run the work and use the result

- Run independent reads and checks concurrently when they can safely share the workspace. When delegation is authorized, give each worker its own brief, evidence, and nonoverlapping write scope. Use scripts and tools for mechanical comparisons, assertions, and deduplication.
- For each unit, produce the result, run its check, and correct from the evidence. Record the check, expected result, actual result, and exit status or artifact reference. Distinguish product failures from missing prerequisites and pre-existing failures.
- Send a failed unit back with its ID, verdict, reason, evidence, and allowed correction scope. Preserve accepted units and rerun dependent checks if their inputs change. After at most three failed correction attempts on the same unit, reassess its contract, prerequisites, or split before trying again. Continue independent work while a unit is blocked.
- Combine accepted outputs, compare the changes against the agreed scope, and verify through the normal entry point. Report each material gate as passed, failed, or blocked, with enough evidence to reproduce the verdict. For checks requiring judgment, state what you inspected and the acceptance criteria you used.

## Match verification to the consequences

| Change | Gate |
| --- | --- |
| Contained and reversible | Run the targeted check and verify the edit scope. |
| Shared or wide-reaching | Run targeted and integration checks. Inspect affected callers, baseline failures, and scope changes before accepting. |
| External or hard to reverse | Prepare and verify locally. Check authorization at the consequential action, such as a production write, destructive migration, money movement, deployment, or merge. Use existing authorization when it covers the action. |

Use deterministic evidence first, followed by the run history and relevant prior rollback evidence when available. Keep model judgment for criteria that require it. Surface decisions requiring the user at the point of consequence and continue authorized work in the meantime.

## Project checks

Select checks based on what the change can break. Check prerequisites before running a gate. This checkout can arrive without `node_modules` or Git metadata. Install lockfile dependencies with `npm ci` when needed for the task, then rerun the check. Missing dependencies are a setup failure. For scope checks in an exported folder, use the captured starting state.

| Area | Check |
| --- | --- |
| Source lint | `npm run lint` |
| TypeScript and production output | `npm run build` |
| Routes, metadata, sitemap, and built links | `node scripts/audit-seo.mjs` after a successful `npm run build` |
| Drink and walk-up checkout | `node --test scripts/drink-checkout.test.mjs scripts/walkup-checkout.test.mjs` |
| Workflow or documentation | Read back the deliverable and verify referenced paths, command names, and required steps against workspace files. |

For user-facing behavior, reproduce the requested interaction or inspect the rendered result when the environment supports it. For research, verify material claims against the source and identify inferences. A successful build or a citation's presence only covers what that check actually measures.

## Carry proven constraints into the next plan

When a verified result establishes a reusable cause or invariant, add or update one specific planning rule in this file or nearer the affected code, within the task's authorized scope. Record the evidence and where the rule changes future splitting or verification. Keep transient run details in the task record. Consolidate or remove guidance when later evidence supersedes it.

The prerequisite check above comes from the initial checkout-test run in this workspace, where both files stopped at import because `@supabase/supabase-js` was missing.
