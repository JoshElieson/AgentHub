import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// node scripts/insert-ponytail-skill.mjs

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const skill = {
  name: 'ponytail',
  description: 'Lazy-senior-dev ruleset that enforces a strict decision ladder before writing any code: YAGNI → stdlib → native platform feature → existing dep → one-liner → minimal impl. Claims 80-94% less code, 3-6× faster, 42-75% cheaper across Claude models. Never cuts validation, error handling, security, or accessibility.',
  trigger_phrases: [
    'use the simplest solution',
    'avoid over-engineering this',
    'write minimal code',
    'keep it as lean as possible',
    'do I really need to write this',
    'lazy engineering approach',
    'ponytail mode',
  ],
  tags: ['productivity', 'code-quality', 'minimalism', 'yagni', 'refactoring', 'engineering', 'claude-code'],
  source_url: 'https://github.com/DietrichGebert/ponytail',
  markdown_instructions: `# Ponytail

> "The best code is the code you never wrote." — lazy senior dev ruleset

## When active
Activate whenever a request involves writing, refactoring, or reviewing code. Default intensity: **full**.

## The decision ladder
Work through these rungs in order. Stop at the first that works:

1. **Does this need to exist?** YAGNI — if no requirement drives it, skip it.
2. **Does the standard library provide it?** Prefer \`Array.prototype\`, \`Path\`, \`datetime\`, etc. over custom utilities.
3. **Is there a native platform feature?** CSS \`gap\` over JS margin math. \`fetch\` over axios when axios isn't installed.
4. **Is there an already-installed dependency?** Use it rather than re-implementing.
5. **Can it be one line?** Write the one-liner.
6. **Only then:** write the minimum viable implementation that satisfies the requirement and no more.

## Intensity levels

| Level | Behaviour |
|-------|-----------|
| **lite** | Build as requested, then suggest the lazier path in a follow-up note. |
| **full** *(default)* | Enforce the ladder strictly before generating anything. |
| **ultra** | YAGNI extremist — challenge requirements, deliver one-liners, refuse abstractions until proven necessary. |

Switch with \`/ponytail lite\`, \`/ponytail ultra\`, or \`/ponytail off\`.

## Hard exceptions — never simplify these
- Input validation and sanitisation
- Authentication / authorisation checks
- Data-loss prevention (transactions, backups, rollbacks)
- Accessibility (ARIA, keyboard nav, contrast)
- Security (XSS, CSRF, injection guards)
- Calibration constants or hardware knobs
- Non-trivial logic paths (keep one self-check or assertion)

## Code style rules
- Prefer deletion over addition when refactoring.
- No interfaces, base classes, or abstractions for a single implementation.
- No feature flags or backwards-compat shims when you can just change the code.
- No error handling for scenarios that cannot happen.
- Mark intentional simplifications: \`// ponytail: intentionally skips X because Y\`.
- If prose explaining the code is longer than the code itself, cut the prose.

## Commands
| Command | Effect |
|---------|--------|
| \`/ponytail [lite|full|ultra|off]\` | Set intensity |
| \`/ponytail-review\` | Flag over-engineering in the current diff |
| \`/ponytail-audit\` | Scan the whole repository for unnecessary complexity |
| \`/ponytail-debt\` | Collect deferred shortcuts into a list |
| \`/ponytail-help\` | Show this quick reference |

Persistence is automatic across the session. Only \`/ponytail off\` or "normal mode" disables it.
`,
};

const { data: existing } = await supabase
  .from('skills')
  .select('id')
  .eq('name', skill.name)
  .maybeSingle();

if (existing) {
  console.log(`Skill "${skill.name}" already exists (id: ${existing.id}). Updating…`);
  const { error } = await supabase
    .from('skills')
    .update(skill)
    .eq('id', existing.id);
  if (error) throw error;
  console.log('Updated.');
} else {
  const { error } = await supabase.from('skills').insert([skill]);
  if (error) throw error;
  console.log(`Inserted skill "${skill.name}".`);
}
