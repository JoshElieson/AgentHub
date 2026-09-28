import fs from "fs";

const path = "scripts/harvested-mega-skills.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));

function cleanDesc(d) {
  let s = String(d || "").trim();
  s = s.replace(/^>-?\s*/, "").replace(/^\|-?\s*/, "");
  s = s.replace(/^['"]+|['"]+$/g, "").trim();
  return s;
}

let fixed = 0;
let dropped = 0;
const kept = [];
for (const s of j.skills) {
  const before = s.description;
  s.description = cleanDesc(s.description);
  if (s.description !== before) fixed++;
  if (s.description.length < 24) {
    dropped++;
    continue;
  }
  kept.push(s);
}
j.skills = kept;
j.meta.approved = kept.length;
j.meta.desc_cleaned = fixed;
j.meta.desc_dropped_short = dropped;
fs.writeFileSync(path, JSON.stringify(j, null, 2));
console.log({ kept: kept.length, fixed, dropped });
