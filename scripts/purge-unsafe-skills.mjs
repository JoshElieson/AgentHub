/**
 * Post-insert safety purge: remove skills that look like offensive how-tos
 * rather than defensive education. Prefer false negatives.
 *
 *   node scripts/purge-unsafe-skills.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const dry = process.argv.includes("--dry-run");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NAME_RE =
  /\b(remote-code-execution|rce|sql-injection-exploit|xss-exploit|buffer-overflow-exploit|privilege-escalation-exploit|reverse-shell|bind-shell|webshell|keylogger|ransomware|credential-harvest|token-stealer|c2-|command-and-control|phishing-kit|malware-drop|rootkit|backdoor-implant|exploit-dev|weaponiz|jailbreak|dan-prompt|ignore-previous)\b/i;

const BODY_OFFENSE_RE =
  /\b(here'?s how to exploit|step[- ]by[- ]step exploit|craft (a |an )?malicious payload to|generate ransomware|build a keylogger|ignore all (safety|previous) instructions|jailbreak (claude|gpt|the model))\b/i;

const DEFENSIVE_RE =
  /\b(detect|detection|defend|defensive|mitigat|prevent|harden|hardening|secure coding|owasp|remediat|patch|monitor|blue.?team|threat model)\b/i;

async function fetchAll() {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("skills")
      .select("id,name,description,markdown_instructions,tags")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

function shouldPurge(s) {
  const name = s.name || "";
  const desc = s.description || "";
  const body = (s.markdown_instructions || "").slice(0, 6000);
  const hay = `${name}\n${desc}\n${body}`;

  if (NAME_RE.test(name) || NAME_RE.test(desc)) {
    // Keep if clearly defensive
    if (DEFENSIVE_RE.test(desc) || DEFENSIVE_RE.test(body.slice(0, 1500))) {
      // still purge pure exploit walkthrough names
      if (/\b(exploit-dev|weaponiz|phishing-kit|ransomware|keylogger|webshell|reverse-shell)\b/i.test(name)) {
        return "offensive-name";
      }
      return null;
    }
    return "offensive-name";
  }

  if (BODY_OFFENSE_RE.test(hay) && !DEFENSIVE_RE.test(body.slice(0, 1500))) {
    return "offensive-body";
  }

  // Tags that mark offensive packs
  const tags = (s.tags || []).join(" ").toLowerCase();
  if (/\b(red-team|offensive|exploit-kit|jailbreak)\b/.test(tags) && !DEFENSIVE_RE.test(desc)) {
    return "offensive-tags";
  }

  return null;
}

async function run() {
  console.log("Scanning skills for post-insert purge…");
  const all = await fetchAll();
  console.log(`Loaded ${all.length}`);

  const doomed = [];
  for (const s of all) {
    const reason = shouldPurge(s);
    if (reason) doomed.push({ id: s.id, name: s.name, reason });
  }

  console.log(`Flagged ${doomed.length}`);
  console.log(doomed.slice(0, 40));

  fs.writeFileSync(
    "scripts/_purged-skills.json",
    JSON.stringify({ at: new Date().toISOString(), doomed }, null, 2)
  );

  if (dry) {
    console.log("Dry run — no deletes.");
    return;
  }

  let deleted = 0;
  for (let i = 0; i < doomed.length; i += 50) {
    const batch = doomed.slice(i, i + 50);
    const ids = batch.map((d) => d.id);
    const { error } = await supabase.from("skills").delete().in("id", ids);
    if (error) {
      console.error("Delete error", error.message);
      for (const d of batch) {
        const { error: e2 } = await supabase.from("skills").delete().eq("id", d.id);
        if (!e2) deleted++;
        else console.error("  fail", d.name, e2.message);
      }
    } else {
      deleted += batch.length;
    }
  }

  const { count } = await supabase.from("skills").select("id", { count: "exact", head: true });
  console.log(`Deleted ${deleted}. Skills remaining: ${count}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
