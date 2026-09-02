#!/usr/bin/env node
// forge-caveman-demo — a working demo of Forge (the agent host you're reading
// this on right now) answering the same coding question twice through the
// same model: once as it normally would, once with Caveman mode's system
// rules layered on top. It's the README's "See it" table, except the numbers
// come from a live call instead of a screenshot.
//
// Run it:
//   node examples/forge-caveman-demo/demo.mjs
//   node examples/forge-caveman-demo/demo.mjs --all      # every sample prompt
//   node examples/forge-caveman-demo/demo.mjs --prompt "Why is my Docker build slow?"
//
// It talks to whatever Bedrock Converse-compatible endpoint is configured via
// BEDROCK_PROXY_URL / FORGE_LLM_URL (Forge's own model relay when run inside
// a Forge sandbox). Nothing here is Forge- or Caveman-internal API: swap the
// endpoint and this same script demos the skill against any Converse-shaped
// provider.
//
// This is the "hello world" of wiring an agent (Forge) up to the Caveman
// skill. If you're instead pointing an actual ForgeCode CLI install
// (https://forgecode.dev, binary `forge`) at Caveman, see README.md in this
// folder — that path is a one-line `npx skills add`, no script needed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..');
const ENDPOINT = process.env.BEDROCK_PROXY_URL || process.env.FORGE_LLM_URL || 'http://localhost:42837';
const MAX_TOKENS = Number(process.env.CAVEMAN_DEMO_MAX_TOKENS || 400);

// Same rule file Claude Code's SessionStart hook injects. Single source of
// truth — this demo does not fork its own copy of the rules.
const CAVEMAN_RULES = readFileSync(
  path.join(REPO_ROOT, 'src', 'rules', 'caveman-activate.md'),
  'utf8'
).trim();

const BASELINE_SYSTEM = 'You are Forge, a helpful AI coding agent. Answer clearly and completely.';
const CAVEMAN_SYSTEM = `${BASELINE_SYSTEM}\n\n${CAVEMAN_RULES}`;

const SAMPLE_PROMPTS = [
  'Why does my React component re-render every time its parent renders?',
  'Explain the difference between git rebase and git merge.',
  'My Docker build takes 10 minutes. What are the first three things to check?',
];

function parseArgs(argv) {
  const out = { all: false, prompt: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') out.all = true;
    else if (argv[i] === '--prompt') out.prompt = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') out.help = true;
  }
  return out;
}

async function converse(systemText, userText) {
  const body = {
    system: [{ text: systemText }],
    messages: [{ role: 'user', content: [{ text: userText }] }],
    inferenceConfig: { maxTokens: MAX_TOKENS, temperature: 0.2 },
  };
  const res = await fetch(`${ENDPOINT}/v1/converse`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`converse call failed: HTTP ${res.status} ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  const content = json?.output?.message?.content ?? [];
  const answer = content.map((c) => c.text ?? '').join('').trim();
  const usage = json?.usage ?? {};
  return { answer, inputTokens: usage.inputTokens ?? null, outputTokens: usage.outputTokens ?? null };
}

function pct(from, to) {
  if (!from) return 'n/a';
  return `${Math.round((1 - to / from) * 100)}%`;
}

async function runOne(prompt) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`PROMPT: ${prompt}`);
  console.log('='.repeat(72));

  const normal = await converse(BASELINE_SYSTEM, prompt);
  console.log(`\n--- Forge, normal mode (${normal.outputTokens ?? '?'} output tokens) ---`);
  console.log(normal.answer);

  const caveman = await converse(CAVEMAN_SYSTEM, prompt);
  console.log(`\n--- Forge, Caveman mode (${caveman.outputTokens ?? '?'} output tokens) ---`);
  console.log(caveman.answer);

  console.log(`\nOutput tokens saved: ${pct(normal.outputTokens, caveman.outputTokens)}`);
  return { prompt, normal, caveman };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('Usage: node demo.mjs [--all] [--prompt "..."]');
    return;
  }
  const health = await fetch(`${ENDPOINT}/v1/health`).then((r) => r.json()).catch(() => null);
  if (health) {
    console.log(`Model relay: ${ENDPOINT}  (model=${health.model}, calls remaining=${health.callsRemaining})`);
  } else {
    console.log(`Model relay: ${ENDPOINT} (no /v1/health response — proceeding anyway)`);
  }

  const prompts = args.prompt ? [args.prompt] : args.all ? SAMPLE_PROMPTS : [SAMPLE_PROMPTS[0]];
  const results = [];
  for (const prompt of prompts) {
    results.push(await runOne(prompt));
  }

  const withTokens = results.filter((r) => r.normal.outputTokens && r.caveman.outputTokens);
  if (withTokens.length) {
    const totalNormal = withTokens.reduce((s, r) => s + r.normal.outputTokens, 0);
    const totalCaveman = withTokens.reduce((s, r) => s + r.caveman.outputTokens, 0);
    console.log(`\n${'='.repeat(72)}`);
    console.log(`TOTAL: ${totalNormal} → ${totalCaveman} output tokens (${pct(totalNormal, totalCaveman)} saved) across ${withTokens.length} prompt(s)`);
  }
}

main().catch((err) => {
  console.error(`\ndemo failed: ${err.message}`);
  process.exitCode = 1;
});
