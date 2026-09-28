import fs from "fs";

const src = "scripts/harvested-mcp-servers.json";
const j = JSON.parse(fs.readFileSync(src, "utf8"));
const installable = j.servers.filter((s) => s.command === "npx" || s.command === "uvx");
const out = {
  ...j,
  servers: installable,
  meta: {
    ...(j.meta || {}),
    filtered: "npm+pypi-only",
    before: j.servers.length,
    after: installable.length,
  },
};
const dest = "scripts/harvested-mcp-servers.installable.json";
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log({ before: j.servers.length, installable: installable.length, dest });
