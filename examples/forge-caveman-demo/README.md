# Forge + Caveman mode — working demo

A small, runnable demo that puts an agent through the same coding question
twice: once talking normally, once with [Caveman mode](../../skills/caveman)
switched on. It's the README's ["See it"](../../README.md#see-it) table, but
the numbers come from a live model call instead of a screenshot.

There are two things people mean by "Forge" in this repo, and this demo
covers both:

1. **Forge, the agent host.** If you're reading this from inside a Forge
   sandbox, Forge already has a model relay wired up
   (`BEDROCK_PROXY_URL` / `FORGE_LLM_URL`). `demo.mjs` calls it twice per
   prompt — baseline system prompt, then baseline + the exact rule file
   Caveman's Claude Code hook injects (`src/rules/caveman-activate.md`) — and
   prints both answers plus the output-token difference.
2. **ForgeCode, the CLI agent.** [ForgeCode](https://forgecode.dev) (binary
   `forge`) is one of the 30+ agents Caveman's skill installs into — see the
   `ForgeCode` row in [`../../INSTALL.md`](../../INSTALL.md). If you have the
   real `forge` CLI, point it at Caveman directly, no script required:

   ```bash
   npx skills add JuliusBrussee/caveman -a forgecode
   ```

   Then say `/caveman` (or "caveman mode") in a ForgeCode session — Caveman
   doesn't auto-activate for ForgeCode today, so that's the one step it needs.

## Run the live demo

```bash
node examples/forge-caveman-demo/demo.mjs                       # one sample prompt
node examples/forge-caveman-demo/demo.mjs --all                 # all three sample prompts
node examples/forge-caveman-demo/demo.mjs --prompt "Your own question here"
```

No dependencies, no build step — plain Node 18+ (`fetch` built in). It reads
`BEDROCK_PROXY_URL` (falling back to `FORGE_LLM_URL`, then
`http://localhost:42837`) and POSTs a Bedrock Converse-shaped request:

```json
{
  "system": [{ "text": "..." }],
  "messages": [{ "role": "user", "content": [{ "text": "..." }] }],
  "inferenceConfig": { "maxTokens": 400, "temperature": 0.2 }
}
```

Point it at any other Converse-compatible endpoint (including
[`caveman-proxy`](../../proxy) sitting in front of your own Bedrock
credentials) by exporting `BEDROCK_PROXY_URL` before running it. The
`CAVEMAN_DEMO_MAX_TOKENS` env var controls the response cap (default `400`;
raise it if you want the model room to finish its thought instead of cutting
off mid-explanation on both sides equally).

## What a run looks like

```
$ CAVEMAN_DEMO_MAX_TOKENS=800 node examples/forge-caveman-demo/demo.mjs

Model relay: http://forge-bedrock:42837  (model=us.anthropic.claude-sonnet-5, calls remaining=48)

========================================================================
PROMPT: Why does my React component re-render every time its parent renders?
========================================================================

--- Forge, normal mode (800 output tokens) ---
# Why React Components Re-render When Their Parent Renders
...

--- Forge, Caveman mode (413 output tokens) ---
React re-render default behavior. Not bug.

**Why:** React re-renders children when parent re-renders, regardless of
props change. Default reconciliation check.
...

Output tokens saved: 48%

========================================================================
TOTAL: 800 → 413 output tokens (48% saved) across 1 prompt(s)
```

Same technical content in both answers — memo, `useCallback`/`useMemo`,
stable prop references, `children` composition — just none of the headline,
bullet-list preamble, or restated question in the Caveman version. That's the
whole trick: Caveman mode is a system-prompt rule file
(`src/rules/caveman-activate.md`), not a different model or a different set
of facts.

## Files

| File        | What                                                              |
| ----------- | ----------------------------------------------------------------- |
| `demo.mjs`  | The demo. Calls the model twice per prompt, prints both, diffs tokens. |
| `README.md` | This file.                                                        |

## Why this lives in `examples/`, not `benchmarks/`

[`benchmarks/`](../../benchmarks) runs a pinned 10-task suite against the real
Claude API to produce the numbers in the main README and is meant to be
reproducible and averaged. This demo is deliberately smaller and
interactive — one or a few prompts, printed live — so it doubles as the
fastest way to *see* Caveman mode change a real answer, without needing an
Anthropic API key of your own when run inside a Forge sandbox.
