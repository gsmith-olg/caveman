# CavemanTalk

Examples of [Caveman mode](../skills/caveman/SKILL.md) doing its job: same
facts, same code, same numbers — fewer words carrying them. Each example
below shows a normal answer next to the Caveman answer for the identical
question. Nothing technical is dropped; only the fluff around it is.

See [`examples/forge-caveman-demo`](../examples/forge-caveman-demo) for a
script that reproduces this side-by-side with a live model call and prints
the output-token savings.

## Example 1 — Debugging a re-render

**Prompt:** "Why does my React component re-render every time its parent
renders?"

**Normal:**

> Great question! There are actually a few reasons this can happen. React
> re-renders a child component whenever its parent re-renders, by default,
> regardless of whether the child's props have actually changed. This is
> just how React's default reconciliation works. If you'd like to avoid
> this, you could wrap your component in `React.memo`, and make sure you're
> using `useCallback`/`useMemo` for any function or object props so their
> references stay stable across renders.

**Caveman:**

> React re-renders children on every parent render, default. Not a bug.
> Fix: wrap component in `React.memo`, keep prop references stable with
> `useCallback`/`useMemo`.

## Example 2 — Explaining a concept

**Prompt:** "Explain database connection pooling."

**Normal (lite):** "Connection pooling reuses open connections instead of
creating new ones per request. Avoids repeated handshake overhead."

**Full:** "Pool reuse open DB connections. No new connection per request.
Skip handshake overhead."

**Ultra:** "Pool reuse open DB connections. No per-request handshake."

## Example 3 — Reporting a bug found while reading code

**Normal:**

> Sure, I'd be happy to help! Looking at the code, I think I've found the
> issue you're experiencing. It looks like the problem is in the auth
> middleware — the token expiry check is using `<` instead of `<=`, which
> means tokens expire one tick early.

**Caveman:**

> Bug in auth middleware. Token expiry check uses `<` not `<=`. Fix:

```js
if (now <= token.expiresAt) { ... }
```

## Example 4 — Refusing to pad a "no" with hedging

**Prompt:** "Can this migration run without downtime?"

**Normal:** "That's a great question. Unfortunately, based on the schema
changes involved, this particular migration would not be able to run
without some amount of downtime, I'm afraid."

**Caveman:** "No. Migration drops a column read by live queries; needs
downtime or a two-phase rollout."

## Example 5 — Auto-Clarity override (irreversible action)

Caveman drops its own terseness rules when the stakes call for full
sentences — see [Auto-Clarity](../skills/caveman/SKILL.md#auto-clarity):

> **Warning:** This will permanently delete all rows in the `users` table
> and cannot be undone.
>
> ```sql
> DROP TABLE users;
> ```
>
> Caveman resumes after. Verify backup exists first.

## Example 6 — Wenyan mode

Same "connection pooling" question, classical-Chinese-flavored levels:

- **wenyan-full:** "池蓄已開之連，不逐請而新開，省握手之費。"
- **wenyan-ultra:** "池蓄連，免逐請新開，省握手。"

## What stays untouched

Caveman compresses the reply *style*, never the facts inside it. Across
every example above: code blocks, exact error text, numbers, units, and
negations (`not`/`never`/`no`/`only`/`except`) are byte-identical to what a
normal-mode answer would contain. Persisted artifacts — commit messages,
code comments, PR/issue bodies — are exempt and always read in normal prose;
see [`SKILL.md`'s Boundaries section](../skills/caveman/SKILL.md#boundaries).
