import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─────────────────────────────────────────────────────────────────────────────
// Detect & remove non-English skills from the Supabase `skills` table.
//   node scripts/remove-non-english-skills.mjs            # dry-run (preview only)
//   node scripts/remove-non-english-skills.mjs --apply    # actually delete
//
// Detection runs over the DESCRIPTION (the user-facing / activation text — the
// right language signal; the body often contains foreign example snippets even
// in English skills). A skill is flagged when EITHER:
//   (a) its description is predominantly non-Latin script (CJK / Hangul / Kana /
//       Cyrillic / Arabic / Hebrew / Devanagari / Thai / Greek), OR
//   (b) it is Latin-script but has clear foreign-stopword evidence
//       (Spanish/Portuguese/French/Italian/German) with almost no English.
// This keeps English skills that merely mention a foreign term, e.g.
// "Grow WeChat Official Accounts (微信公众号)…".
// FKs are ON DELETE CASCADE, so dependent stars/installs/ratings go with it.
// ─────────────────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply');

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseAnonKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const EN = new Set(
  ('the be to of and a in that have it for not on with he as you do at this but his by from they we ' +
    'say her she or an will my one all would there their what so up out if about who get which go me when ' +
    'make can like time no just him know take into year your good some could them see other than then now ' +
    'look only come its over think also use two how our work first well way even new want because any these ' +
    'give day most us is are was were has had been being does did should must more such using where while ' +
    'each between through after before here when help create build write code file user data app').split(/\s+/)
);

// Foreign function words that rarely occur in English. Includes the common
// short articles/prepositions — safe because flagging requires several of them
// together with near-zero English (an English description never hits that).
const FOREIGN = new Set(
  (// Spanish
    'de la el los las en un una uno y que para con del por sus como más este esta estas estos pero muy ' +
    'son está están también cuando donde desde hacia sobre entre sin ser hacer puede debe necesita usuario ' +
    'archivo siguiente análisis español datos ' +
    // Portuguese
    'você não são então isso aqui fazer seu sua usuário deve arquivo guia ferramenta dos das da uma ' +
    // French
    'le les des une pour avec vous votre dans cette plus sont être faire peut doit lorsque fichier ' +
    'utilisateur ainsi aussi comme nous vos lors et du au aux ce cet ' +
    // Italian
    'il lo gli della dei che questo questa più sono essere può deve quando dove uno utente per ' +
    // German
    'der die das und für mit ein eine ist den von auf wie sie ihre werden kann muss wenn oder auch sich ' +
    'nicht dass einen einem dieser diese benutzer datei').split(/\s+/)
);

// Non-Latin script ranges (unicode property escapes).
const NON_LATIN =
  /[Ͱ-ϿЀ-ӿ֐-׿؀-ۿऀ-ॿ฀-๿぀-ヿ㐀-䶿一-鿿가-힯]/g;

function isLetter(ch) {
  return /\p{L}/u.test(ch);
}

function detect(name, description) {
  const desc = (description || '').trim();

  // (a) Non-Latin script ratio over the description.
  const letters = (desc.match(/\p{L}/gu) || []).length;
  const nonLatin = (desc.match(NON_LATIN) || []).length;
  if (letters >= 4 && nonLatin / letters > 0.15) {
    return { nonEnglish: true, reason: 'non-latin-desc', nonLatinRatio: +(nonLatin / letters).toFixed(2), enRatio: 0, foreign: 0 };
  }

  // (b) Latin-foreign over name + description.
  const words = (`${name} ${desc}`.toLowerCase().match(/[\p{L}][\p{L}'’]*/gu) || []);
  if (words.length < 6) return { nonEnglish: false, reason: 'too-short', words: words.length };

  const DIACRITIC = /[áéíóúüñàâãäçèêëìîïòôõùûœ]/i;
  let en = 0;
  let foreign = 0;
  let evidence = 0; // tokens that are foreign-stopwords OR carry romance diacritics
  for (const w of words) {
    if (EN.has(w)) en++;
    else if (FOREIGN.has(w)) { foreign++; evidence++; }
    else if (DIACRITIC.test(w)) evidence++;
  }
  const enRatio = en / words.length;
  // Either lots of foreign stopwords, or zero English with clear foreign/diacritic
  // evidence (catches short foreign blurbs padded with English proper nouns).
  const nonEnglish = (foreign >= 3 && enRatio < 0.1) || (en === 0 && evidence >= 2 && words.length >= 5);
  return { nonEnglish, reason: nonEnglish ? 'latin-foreign' : 'english', enRatio: +enRatio.toFixed(3), foreign, evidence, en, words: words.length };
}

async function run() {
  // page through all rows
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('skills')
      .select('id, name, description')
      .range(from, from + PAGE - 1);
    if (error) {
      console.error('❌ read error:', error.message);
      process.exit(1);
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  console.log(`Scanned ${rows.length} skills.\n`);

  const flagged = [];
  const byReason = {};
  for (const r of rows) {
    const d = detect(r.name, r.description ?? '');
    if (d.nonEnglish) {
      flagged.push({ ...r, _d: d });
      byReason[d.reason] = (byReason[d.reason] ?? 0) + 1;
    }
  }

  console.log(`Flagged ${flagged.length} non-English skills. By reason:`, byReason);
  console.log('\nSample (up to 60):');
  for (const f of flagged.slice(0, 60)) {
    console.log(
      `  [${f._d.reason}] ${f.name} — en:${f._d.enRatio ?? '-'} f"${f._d.foreign ?? '-'}" :: ${(f.description || '').slice(0, 70)}`
    );
  }

  if (!APPLY) {
    console.log('\n(dry-run) re-run with --apply to delete the flagged skills.');
    return;
  }

  console.log(`\n🗑️  Deleting ${flagged.length} skills…`);
  let ok = 0;
  let fail = 0;
  const errs = [];
  const ids = flagged.map((f) => f.id);
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { error } = await supabase.from('skills').delete().in('id', batch);
    if (error) {
      // retry individually
      for (const id of batch) {
        const { error: e2 } = await supabase.from('skills').delete().eq('id', id);
        if (e2) { fail++; errs.push(e2.message); } else ok++;
      }
    } else {
      ok += batch.length;
    }
  }
  console.log(`Deleted ${ok}, failed ${fail}.`);
  if (errs.length) console.log('errors:', [...new Set(errs)].slice(0, 5).join(' | '));

  const { count } = await supabase.from('skills').select('id', { count: 'exact', head: true });
  console.log(`Total skills now: ${count}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
