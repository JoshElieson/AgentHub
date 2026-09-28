/**
 * Shared safety + quality gates for marketplace skill/MCP ingestion.
 * Prefer false negatives: anything sketchy is rejected.
 */

export const MIN_DESC = 24;
export const MAX_DESC = 1024;
export const MIN_BODY = 400;
export const MIN_PROSE = 200;
export const MAX_BODY = 80_000;

/** Repo owners/paths we never harvest from (offensive, malware-adjacent, or known junk). */
export const DENY_SOURCE_REPOS = new Set(
  [
    "snailploit/claude-red",
    "mukul975/anthropic-cybersecurity-skills", // offensive tooling mix
    "example/mcp-server-reddit", // placeholder in our own seed
    "example/mcp-server-twitter",
    "example/mcp-server-stripe-billing",
    "example/mcp-server-sendgrid",
    "example/mcp-server-twilio",
    "example/mcp-server-aws-lambda",
  ].map((s) => s.toLowerCase())
);

/** Substrings in repo / name / description that force reject. */
export const DENY_SUBSTRINGS = [
  "jailbreak",
  "dan prompt",
  "do anything now",
  "ignore previous instructions",
  "ignore all previous",
  "bypass safety",
  "bypass filter",
  "prompt injection payload",
  "credential stealer",
  "steal password",
  "steal token",
  "exfiltrate",
  "keylogger",
  "ransomware",
  "malware dropper",
  "c2 server",
  "command and control",
  "reverse shell",
  "bind shell",
  "weaponiz",
  "zero-day exploit kit",
  "csam",
  "child porn",
  "child sexual",
  "nudes of minor",
];

/** Patterns in install/command fields that are unsafe to recommend. */
export const UNSAFE_INSTALL_RE = [
  /curl\s+[^\n|]*\|\s*(?:ba)?sh/i,
  /wget\s+[^\n|]*\|\s*(?:ba)?sh/i,
  /Invoke-Expression\s*\(\s*[^)]*DownloadString/i,
  /irm\s+[^\s]+\s*\|\s*iex/i,
  /eval\s*\(\s*['"`]?atob/i,
  /base64\s+-d\s*\|\s*(?:ba)?sh/i,
  /nc\s+-e\s+\/bin\/(?:ba)?sh/i,
];

/** High-signal offensive cybersecurity skill names (defensive OK). */
export const OFFENSIVE_NAME_RE =
  /\b(exploit|payload|cve-exploit|red[-_]?team|pentest-attack|metasploit|mimikatz|cobalt[-_]?strike|sqlmap|hashcat|bruteforce|brute-force|phishing-kit|ransomware|rootkit|backdoor|keylog)\b/i;

const EN_STOP = new Set(
  (
    "the be to of and a in that have it for not on with he as you do at this but his by from they we say her " +
    "she or an will my one all would there their what so up out if about who get which go me when make can like " +
    "time no just him know take into year your good some could them see other than then now look only come its " +
    "over think also use two how our work first well way even new want because any these give day most us is are " +
    "was were has had been being does did should must more such using where while each between through after " +
    "before here help create build write code file user data app server tool manage query connect"
  ).split(/\s+/)
);
const FOREIGN_STOP = new Set(
  (
    "de la el los las en un una uno y que para con del por sus como más este esta estas estos pero muy son está " +
    "están también cuando donde desde hacia sobre entre sin ser hacer puede debe necesita usuario archivo " +
    "você não são então isso aqui fazer seu sua le les des une pour avec vous votre dans cette plus sont être " +
    "faire peut doit lorsque der die das und für mit ein eine ist den von auf wie sie ihre werden kann muss"
  ).split(/\s+/)
);
const NON_LATIN_RE = /[Ͱ-ϿЀ-ӿ֐-׿؀-ۿऀ-ॿ฀-๿ぁ-んァ-ヶ一-鿿가-힯]/g;
const DIACRITIC_RE = /[áéíóúüñàâãäçèêëìîïòôõùûœ]/i;
const PLACEHOLDER = /^(todo|tbd|placeholder|coming soon|n\/a|none|test|asdf|xxx)$/i;

export function sanitizeName(raw) {
  let n = String(raw || "").trim();
  n = n.replace(/^\d+[-_]/, "");
  n = n
    .toLowerCase()
    .replace(/[^a-z0-9-_./]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/^[-/.]+|[-/.]+$/g, "");
  // marketplace unique key: flatten path-like names
  n = n.replace(/\//g, "-").replace(/\./g, "-").replace(/-+/g, "-");
  return n.slice(0, 80).replace(/-$/, "");
}

export function sanitizeText(s) {
  let out = "";
  for (const ch of String(s || "")) {
    const c = ch.codePointAt(0);
    if (c < 0x20 && c !== 9 && c !== 10 && c !== 13) continue;
    if (c >= 0x7f && c <= 0x9f) continue;
    if (c >= 0xd800 && c <= 0xdfff) continue;
    out += ch;
  }
  return out;
}

export function strippedProseLength(md) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/^#{1,6}\s.*$/gm, " ")
    .replace(/[>*_|#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

export function isNonEnglish(name, description) {
  const desc = (description || "").trim();
  const letters = (desc.match(/\p{L}/gu) || []).length;
  const nonLatin = (desc.match(NON_LATIN_RE) || []).length;
  if (letters >= 4 && nonLatin / letters > 0.15) return true;

  const words = (`${name} ${desc}`.toLowerCase().match(/[\p{L}][\p{L}'’]*/gu) || []);
  if (words.length < 6) return false;
  let en = 0;
  let foreign = 0;
  let evidence = 0;
  for (const w of words) {
    if (EN_STOP.has(w)) en++;
    else if (FOREIGN_STOP.has(w)) {
      foreign++;
      evidence++;
    } else if (DIACRITIC_RE.test(w)) evidence++;
  }
  const enRatio = en / words.length;
  return (foreign >= 3 && enRatio < 0.1) || (en === 0 && evidence >= 2 && words.length >= 5);
}

export function normalizeRepo(repo) {
  return String(repo || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function haystack(...parts) {
  return parts.filter(Boolean).join("\n").toLowerCase();
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function safetyScan({
  name = "",
  description = "",
  body = "",
  sourceRepo = "",
  command = "",
  args = [],
  install = "",
} = {}) {
  const repo = normalizeRepo(sourceRepo);
  if (repo && DENY_SOURCE_REPOS.has(repo)) {
    return { ok: false, reason: "deny-source-repo" };
  }
  // also match owner/repo prefix deny
  for (const d of DENY_SOURCE_REPOS) {
    if (repo === d || repo.startsWith(d + "/") || repo.endsWith("/" + d)) {
      return { ok: false, reason: "deny-source-repo" };
    }
  }

  const text = haystack(name, description, body, command, install, ...(args || []));
  for (const s of DENY_SUBSTRINGS) {
    if (text.includes(s)) return { ok: false, reason: `deny-substring:${s}` };
  }

  if (OFFENSIVE_NAME_RE.test(name) || OFFENSIVE_NAME_RE.test(description.slice(0, 200))) {
    // allow defensive security wording
    const defensive =
      /\b(defend|defense|defensive|harden|hardening|detect|detection|monitor|secure|owasp|best.?practice|audit.?log)\b/i;
    if (!defensive.test(description) && !defensive.test(body.slice(0, 800))) {
      return { ok: false, reason: "offensive-tooling" };
    }
  }

  const installBlob = [command, ...(args || []), install, body.slice(0, 4000)].join("\n");
  for (const re of UNSAFE_INSTALL_RE) {
    if (re.test(installBlob)) return { ok: false, reason: "unsafe-install" };
  }

  // Obfuscation / credential grab hints in skill bodies
  if (/\b(process\.env\.(?:AWS_SECRET|OPENAI_API_KEY|GITHUB_TOKEN)|\/\.ssh\/id_rsa|\/\.aws\/credentials)\b/.test(body) &&
      /\b(upload|post|fetch|axios|send|exfil|webhook|discord\.com\/api\/webhooks)\b/i.test(body)) {
    return { ok: false, reason: "credential-exfil-pattern" };
  }

  return { ok: true };
}

/**
 * Skill metadata + body quality gate (after safetyScan).
 */
export function validateSkillCandidate(skill, { existingNames = null } = {}) {
  const name = sanitizeName(skill.name);
  if (!name || name.length < 2) return { ok: false, reason: "bad-name" };
  if (existingNames?.has(name)) return { ok: false, reason: "already-in-db" };

  let description = sanitizeText((skill.description || "").trim());
  if (PLACEHOLDER.test(description)) return { ok: false, reason: "placeholder-desc" };
  if (description.length < MIN_DESC) return { ok: false, reason: "short-desc" };
  if (description.length > MAX_DESC) description = description.slice(0, MAX_DESC - 1).trim() + "…";

  let body = sanitizeText((skill.markdown_instructions || skill.body || "").trim());
  if (body.length < MIN_BODY || strippedProseLength(body) < MIN_PROSE) {
    return { ok: false, reason: "thin-body" };
  }
  if (body.length > MAX_BODY) {
    const src = skill.source_url || "";
    body = body.slice(0, MAX_BODY).trim() + `\n\n…(truncated — see full skill at ${src})`;
  }

  if (isNonEnglish(name, description)) return { ok: false, reason: "non-english" };

  const safe = safetyScan({
    name,
    description,
    body,
    sourceRepo: skill.source_repo || skill.source_url || "",
  });
  if (!safe.ok) return safe;

  if (!skill.source_url && !skill.source_repo) {
    return { ok: false, reason: "missing-source" };
  }

  return {
    ok: true,
    skill: {
      name,
      description,
      trigger_phrases: skill.trigger_phrases?.length
        ? skill.trigger_phrases
        : generateTriggerPhrases(name),
      markdown_instructions: body,
      tags: Array.isArray(skill.tags) ? skill.tags.slice(0, 12) : ["general"],
      script_urls: [],
      source_url:
        skill.source_url ||
        (skill.source_repo
          ? `https://github.com/${normalizeRepo(skill.source_repo)}`
          : null),
    },
  };
}

export function generateTriggerPhrases(name) {
  const parts = name.split("-").filter(Boolean);
  if (parts.length > 1) {
    return [parts.join(" "), `run ${parts.join(" ")}`, parts.slice(1).join(" ")];
  }
  return [name, `run ${name}`];
}

/**
 * MCP candidate gate. Smoke = npm/pypi package existence check done separately.
 */
export function validateMcpCandidate(mcp, { existingNames = null } = {}) {
  const name = sanitizeName(mcp.name);
  if (!name || name.length < 2) return { ok: false, reason: "bad-name" };
  if (existingNames?.has(name)) return { ok: false, reason: "already-in-db" };

  let description = sanitizeText((mcp.description || "").trim());
  if (PLACEHOLDER.test(description)) return { ok: false, reason: "placeholder-desc" };
  if (description.length < MIN_DESC) return { ok: false, reason: "short-desc" };
  if (description.length > MAX_DESC) description = description.slice(0, MAX_DESC - 1).trim() + "…";

  const command = String(mcp.command || "").trim();
  if (!command) return { ok: false, reason: "missing-command" };

  // Reject obviously fake example hosts
  const github = mcp.github_url || "";
  if (/github\.com\/example\//i.test(github)) return { ok: false, reason: "placeholder-github" };

  if (isNonEnglish(name, description)) return { ok: false, reason: "non-english" };

  const safe = safetyScan({
    name,
    description,
    body: description,
    sourceRepo: github,
    command,
    args: mcp.args || [],
  });
  if (!safe.ok) return safe;

  // Prefer installable packages or https remotes
  const hasPkg = Boolean(mcp._npm || mcp._pypi || (mcp.args || []).some((a) => /@|mcp/.test(String(a))));
  const hasRemote = Boolean(mcp._remote_url);
  if (!hasPkg && !hasRemote && !github) {
    return { ok: false, reason: "no-install-target" };
  }

  return {
    ok: true,
    mcp: {
      name,
      description,
      github_url: github || null,
      command,
      args: Array.isArray(mcp.args) ? mcp.args : [],
      env_vars: mcp.env_vars && typeof mcp.env_vars === "object" ? mcp.env_vars : {},
      tags: Array.isArray(mcp.tags) ? mcp.tags.slice(0, 12) : ["mcp"],
      _smoke: mcp._smoke || "skipped",
      _registry_name: mcp._registry_name || null,
    },
  };
}

export async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

export function parseFrontmatter(textContent, folderName) {
  let name = folderName;
  let description = "";
  let markdown_instructions = textContent;

  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
  const frontmatterMatch = textContent.match(frontmatterRegex);

  if (frontmatterMatch) {
    const yamlText = frontmatterMatch[1];
    markdown_instructions = textContent.replace(frontmatterRegex, "").trim();
    const lines = yamlText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim().toLowerCase();
      let val = line.slice(colonIdx + 1).trim();

      // Folded/block scalars: >- | > | |- |
      if (/^[>|][-+]?\s*$/.test(val) || val === ">" || val === "|") {
        const parts = [];
        while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
          i++;
          parts.push(lines[i].trim());
        }
        val = parts.join(" ").trim();
      } else {
        val = val.replace(/^["']|["']$/g, "").trim();
      }

      if (key === "name") name = val;
      else if (key === "description") description = val;
    }
  }

  // Strip leftover YAML markers if any
  description = String(description || "")
    .replace(/^>\-?\s*/, "")
    .replace(/^\|\-?\s*/, "")
    .trim();

  return { name, description, markdown_instructions };
}
