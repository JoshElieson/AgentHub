/**
 * Harvest MCP servers from the official MCP Registry API.
 *
 *   node scripts/harvest-mcp-registry.mjs [--limit=N] [--out=path]
 *
 * Writes scripts/harvested-mcp-servers.json
 * Applies safety + quality gates; verifies npm package existence when possible.
 */
import fs from "fs";
import path from "path";
import {
  mapPool,
  sanitizeName,
  validateMcpCandidate,
} from "./lib/catalog-safety.mjs";

const args = process.argv.slice(2);
function opt(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}
const LIMIT = parseInt(opt("limit", "0"), 10) || 0;
const OUT = path.resolve(
  opt("out", path.join(process.cwd(), "scripts", "harvested-mcp-servers.json"))
);
const EXISTING_PATH = path.join(process.cwd(), "scripts", "_existing-mcp-names.json");

const UA = { "User-Agent": "Nuclexa-catalog-harvest/1.0", Accept: "application/json" };

async function fetchJson(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function npmExists(pkg) {
  try {
    const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
      headers: UA,
      method: "HEAD",
    });
    // some registries dislike HEAD — fallback GET
    if (r.status === 404) return false;
    if (r.ok) return true;
    const g = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, {
      headers: UA,
    });
    return g.ok;
  } catch {
    return false;
  }
}

async function pypiExists(pkg) {
  try {
    const r = await fetch(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`, {
      headers: UA,
    });
    return r.ok;
  } catch {
    return false;
  }
}

function pickLatestByName(entries) {
  // Prefer isLatest; else prefer package over remote-only; else first
  const byName = new Map();
  for (const e of entries) {
    const s = e.server || e;
    const name = s.name;
    if (!name) continue;
    const meta = e._meta?.["io.modelcontextprotocol.registry/official"];
    const prev = byName.get(name);
    if (!prev) {
      byName.set(name, e);
      continue;
    }
    const prevMeta = prev._meta?.["io.modelcontextprotocol.registry/official"];
    if (meta?.isLatest && !prevMeta?.isLatest) byName.set(name, e);
    else if ((s.packages?.length || 0) > (prev.server?.packages?.length || 0)) {
      byName.set(name, e);
    }
  }
  return [...byName.values()];
}

function toCandidate(entry) {
  const s = entry.server || entry;
  const meta = entry._meta?.["io.modelcontextprotocol.registry/official"];
  if (meta?.status && meta.status !== "active") return null;

  const desc = (s.description || s.title || "").trim();
  const registryName = s.name;
  // Preserve namespace in the marketplace name to avoid collisions
  // (e.g. ai.adeu/adeu → ai-adeu-adeu).
  const localName = sanitizeName(registryName.replace(/[./]/g, "-"));

  const npmPkg = (s.packages || []).find((p) => p.registryType === "npm");
  const pypiPkg = (s.packages || []).find((p) => p.registryType === "pypi");
  const remote = (s.remotes || []).find((r) => /^https:\/\//i.test(r.url || ""));

  let command = "";
  let args = [];
  let env_vars = {};
  let _npm = null;
  let _pypi = null;
  let _remote_url = null;
  let github_url = null;

  // repository URL if present
  const repo =
    s.repository?.url ||
    s.websiteUrl ||
    (typeof s.repository === "string" ? s.repository : null);
  if (repo && /github\.com/i.test(repo)) github_url = repo.replace(/\.git$/, "");

  if (npmPkg) {
    command = "npx";
    const ident = npmPkg.identifier;
    _npm = ident;
    args = ["-y", ident];
    if (Array.isArray(npmPkg.environmentVariables)) {
      for (const ev of npmPkg.environmentVariables) {
        if (ev?.name) env_vars[ev.name] = ev.isSecret ? `<YOUR_${ev.name}>` : "";
      }
    }
  } else if (pypiPkg) {
    command = "uvx";
    _pypi = pypiPkg.identifier;
    args = [pypiPkg.identifier];
    if (Array.isArray(pypiPkg.environmentVariables)) {
      for (const ev of pypiPkg.environmentVariables) {
        if (ev?.name) env_vars[ev.name] = ev.isSecret ? `<YOUR_${ev.name}>` : "";
      }
    }
  } else if (remote) {
    // Remote HTTP MCP — document as URL-based; command is a sentinel for UI
    command = "http";
    _remote_url = remote.url;
    args = [remote.url];
  } else {
    return null;
  }

  const tags = ["mcp", "registry"];
  if (npmPkg) tags.push("npm");
  if (pypiPkg) tags.push("pypi");
  if (remote) tags.push("remote");
  if (!Object.keys(env_vars).length) tags.push("no-secrets-required");

  return {
    name: localName,
    description: desc,
    github_url,
    command,
    args,
    env_vars,
    tags,
    _registry_name: registryName,
    _npm,
    _pypi,
    _remote_url,
    _smoke: "pending",
  };
}

async function fetchAllServers() {
  const all = [];
  let cursor;
  let pages = 0;
  while (true) {
    const u = new URL("https://registry.modelcontextprotocol.io/v0.1/servers");
    u.searchParams.set("limit", "100");
    if (cursor) u.searchParams.set("cursor", cursor);
    const j = await fetchJson(u.toString());
    const list = j.servers || [];
    all.push(...list);
    pages++;
    cursor = j.metadata?.nextCursor;
    if (pages % 50 === 0) console.log(`  …fetched ${all.length} rows (${pages} pages)`);
    if (!cursor || list.length === 0) break;
    if (LIMIT && all.length >= LIMIT * 3) break; // over-fetch then dedupe
  }
  console.log(`📦 Registry rows: ${all.length} across ${pages} pages`);
  return all;
}

async function run() {
  const existing = new Set(
    fs.existsSync(EXISTING_PATH) ? JSON.parse(fs.readFileSync(EXISTING_PATH, "utf8")) : []
  );
  console.log(`🔍 ${existing.size} MCP names already in DB`);

  const rows = await fetchAllServers();
  let latest = pickLatestByName(rows);
  if (LIMIT) latest = latest.slice(0, LIMIT);
  console.log(`🧩 Unique server names: ${latest.length}`);

  const drops = {};
  const bump = (r) => {
    drops[r] = (drops[r] || 0) + 1;
  };

  const rawCandidates = [];
  for (const e of latest) {
    const c = toCandidate(e);
    if (!c) {
      bump("no-install-target");
      continue;
    }
    rawCandidates.push(c);
  }
  console.log(`Candidates after shape: ${rawCandidates.length}`);

  // Smoke: verify npm/pypi package exists (minimal). Remotes: URL must be https.
  // For scale, trust registry metadata for packages and only HEAD-check a sample
  // plus any package whose identifier looks suspicious.
  console.log("🔬 Smoke-checking packages…");
  let smokeChecked = 0;
  let smokeFailed = 0;
  const smoked = await mapPool(rawCandidates, 24, async (c, idx) => {
    if (c._npm) {
      // Always verify scoped or short names; sample 15% of the rest
      const mustCheck =
        c._npm.startsWith("@") ||
        c._npm.length < 6 ||
        /[^a-z0-9@/_.-]/i.test(c._npm) ||
        idx % 7 === 0;
      if (mustCheck) {
        smokeChecked++;
        const ok = await npmExists(c._npm);
        c._smoke = ok ? "npm-ok" : "npm-missing";
        if (!ok) {
          smokeFailed++;
          return null;
        }
      } else {
        c._smoke = "npm-trusted-registry";
      }
    } else if (c._pypi) {
      smokeChecked++;
      const ok = await pypiExists(c._pypi);
      c._smoke = ok ? "pypi-ok" : "pypi-missing";
      if (!ok) {
        smokeFailed++;
        return null;
      }
    } else if (c._remote_url) {
      if (!/^https:\/\//i.test(c._remote_url)) {
        c._smoke = "bad-remote";
        return null;
      }
      // Don't hit arbitrary remote hosts (safety). Metadata-only for remotes.
      c._smoke = "remote-https-ok";
    }
    if ((idx + 1) % 2000 === 0) {
      console.log(`   …smoke ${idx + 1}/${rawCandidates.length} (checked ${smokeChecked}, fail ${smokeFailed})`);
    }
    return c;
  });
  console.log(`   smoke checked=${smokeChecked} failed=${smokeFailed}`);

  const afterSmoke = smoked.filter(Boolean);
  console.log(`✅ Passed smoke: ${afterSmoke.length}`);

  // Dedup by marketplace name (prefer npm over remote)
  afterSmoke.sort((a, b) => {
    const score = (x) => (x._npm ? 3 : x._pypi ? 2 : 1);
    return score(b) - score(a);
  });

  const approved = [];
  const rejected = [];
  const seen = new Set();

  for (const c of afterSmoke) {
    if (seen.has(c.name)) {
      bump("dupe-name");
      rejected.push({ name: c.name, reason: "dupe-name" });
      continue;
    }
    const v = validateMcpCandidate(c, { existingNames: existing });
    if (!v.ok) {
      bump(v.reason);
      rejected.push({ name: c.name, reason: v.reason, registry: c._registry_name });
      continue;
    }
    seen.add(v.mcp.name);
    approved.push(v.mcp);
  }

  const out = {
    harvested_at: new Date().toISOString(),
    source: "https://registry.modelcontextprotocol.io/v0.1/servers",
    servers: approved.map(({ _smoke, _registry_name, _npm, _pypi, _remote_url, ...rest }) => ({
      ...rest,
      tags: [...new Set([...(rest.tags || []), _smoke].filter(Boolean))],
    })),
    meta: {
      approved: approved.length,
      rejected: rejected.length,
      drops,
      smoke_sample: approved.slice(0, 5).map((s) => ({ name: s.name, smoke: s._smoke })),
    },
  };

  // Keep internal smoke on rejected log
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  fs.writeFileSync(
    OUT.replace(/\.json$/, ".rejected.json"),
    JSON.stringify({ rejected: rejected.slice(0, 5000), drops }, null, 2)
  );

  console.log("\n📊 MCP harvest summary");
  console.log(`   approved: ${approved.length}`);
  console.log(`   rejected: ${rejected.length}`);
  console.log("   drops:", drops);
  console.log(`💾 Wrote ${approved.length} → ${OUT}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
