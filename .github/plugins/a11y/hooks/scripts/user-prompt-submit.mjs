#!/usr/bin/env node
/**
 * UserPromptSubmit hook (DESIGN.md §2.3d). Never blocks anything — it only
 * injects accessibility context when the prompt looks UI-touching, and only
 * when opted in via .a11yrc.json's hooksEnabled (see a11y-init --with-hooks).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOM = String.fromCharCode(0xfeff);

function readStdin() {
  const chunks = [];
  process.stdin.setEncoding('utf8');
  return new Promise((resolve) => {
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => {
      const text = chunks.join('');
      resolve(text.startsWith(BOM) ? text.slice(1) : text);
    });
    // No stdin (e.g. manual test run): resolve empty rather than hang.
    process.stdin.on('error', () => resolve(''));
  });
}

/** Mirrors a11y-overview's routing table (DESIGN §4.4) — same topic-guide selection as the skill router. */
const ROUTES = [
  {
    guide: 'a11y-dialogs',
    patterns: [/\bdialog\b/i, /\bmodal\b/i, /\bpopover\b/i, /\bdrawer\b/i],
    note: 'focus trap + restore, aria-modal semantics, Esc closes, accessible name via aria-labelledby',
  },
  {
    guide: 'a11y-forms',
    patterns: [/\bforms?\b/i, /\binputs?\b/i, /\bvalidation\b/i, /\blabels?\b/i, /\btext ?fields?\b/i],
    note: 'every control needs a programmatic label; identify errors in text, never color alone',
  },
  {
    guide: 'a11y-keyboard',
    patterns: [/\bkeyboard\b/i, /\btabindex\b/i, /\bfocus order\b/i, /\btab order\b/i, /\bfocus management\b/i],
    note: 'everything a mouse can do, the keyboard must do too; never a positive tabIndex',
  },
];

/** Broader signal that the prompt touches UI code even without a specific-guide match. */
const GENERIC_PATTERNS = [
  /\.tsx\b/i,
  /\.jsx\b/i,
  /\.vue\b/i,
  /\.svelte\b/i,
  /\bcomponents?\b/i,
  /\baccessib\w*/i,
  /\baria\b/i,
  /\bwcag\b/i,
  /\bscreen reader/i,
];

function allow() {
  process.stdout.write('{}');
  process.exit(0);
}

async function main() {
  let input;
  try {
    input = JSON.parse(await readStdin());
  } catch {
    allow();
    return;
  }

  const cwd = input.cwd || process.cwd();

  const configPath = join(cwd, '.a11yrc.json');
  let hooksEnabled = false;
  if (existsSync(configPath)) {
    try {
      hooksEnabled = JSON.parse(readFileSync(configPath, 'utf8')).hooksEnabled === true;
    } catch {
      // malformed config: fail open, never block a prompt over this
    }
  }
  if (!hooksEnabled) {
    allow();
    return;
  }

  // Defensive: different doc sources disagree on the exact stdin field name
  // for the prompt text (prompt_text vs prompt vs user_prompt) — accept all.
  const prompt = input.prompt_text ?? input.prompt ?? input.user_prompt ?? '';

  const matchedRoute = ROUTES.find((r) => r.patterns.some((p) => p.test(prompt)));
  const isUiTouching = Boolean(matchedRoute) || GENERIC_PATTERNS.some((p) => p.test(prompt));

  if (!isUiTouching) {
    allow();
    return;
  }

  const parts = [
    'Accessibility reminder (a11y-skills): use semantic HTML before ARIA, keep everything keyboard-operable, label every control, keep a logical heading order, and never introduce a keyboard trap, auto-playing audio, fast flashing, or unstoppable motion.',
  ];
  if (matchedRoute) {
    parts.push(`See the ${matchedRoute.guide} skill: ${matchedRoute.note}.`);
  }
  const context = parts.join(' ');

  // Emit both the current-docs schema (hookSpecificOutput.additionalContext)
  // and the flatter fields some doc sources describe (additionalContext /
  // systemMessage at the top level) — defensive redundancy so this works
  // regardless of which shape the running Claude Code version reads.
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context },
      additionalContext: context,
      systemMessage: context,
    }),
  );
  process.exit(0);
}

main();
