---
description: Execute the full Planner > Builder > Review > QA pipeline
agent: general
---

You are executing the **Planner > Builder > Review > QA** pipeline for the Beplus Visual Mega Navigation project.

## Task
$ARGUMENTS

## Pipeline Phases

Execute each phase sequentially. Only proceed to the next phase if the current one succeeds. Report results to the user as you go.

---

### Phase 1: PLANNER

Launch the `planner` subagent with the task description. Wait for it to return a detailed implementation plan.

```
Subagent: planner
Input: Create a detailed implementation plan for the following task: $ARGUMENTS
```

If the planner fails or returns an empty/invalid plan, STOP and report the failure.

**Output to user:** Show the plan summary (files to change + steps).

---

### Phase 2: BUILDER

Launch the `builder` subagent, passing it the plan from Phase 1.

```
Subagent: builder
Input: Implement the following plan. Read AGENTS.md and docs/AGENT.md first for conventions. [PLAN FROM PHASE 1]
```

Wait for the builder to complete all code changes, run quality checks, and return a change summary.

If the builder reports build/check failures it couldn't fix, STOP and report.

**Output to user:** Show the builder's change summary.

---

### Phase 3: REVIEW

Launch the `reviewer` subagent, passing it the builder's change summary and verification instructions.

```
Subagent: reviewer
Input: Review the following code changes for quality, safety, and convention compliance. Run composer check and npm run check:js as applicable. [CHANGE SUMMARY FROM PHASE 2]
```

Wait for the reviewer's verdict.

If the verdict is **Reject** (blocking issues exist), STOP and report the issues to the user. Do NOT proceed to QA.

If the verdict is **Approve** or **Approve with nits**, proceed to Phase 4.

**Output to user:** Show the review verdict and any nits found.

---

### Phase 4: QA

Launch the `qa` subagent for final verification.

```
Subagent: qa
Input: Run full test suite and quality verification for the following changes. Run all applicable checks: composer check, npm run check:js, composer test:php, npm run test:js. Verify no build/ files were edited directly. [CONTEXT FROM ALL PREVIOUS PHASES]
```

Wait for the QA report.

**Output to user:** Show the final QA verdict (PASS / CONDITIONAL PASS / FAIL).

---

## Final Summary

After all 4 phases complete, present a summary:

```
## Pipeline Complete

| Phase | Status |
|-------|--------|
| Planner | ✓ Plan created |
| Builder | ✓ Changes implemented |
| Review | ✓ Approved (with/without nits) |
| QA | ✓ PASS |

### What was done
[Brief summary of the implementation]

### Files changed
[List of files]
```
