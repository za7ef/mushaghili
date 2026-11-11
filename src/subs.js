import { ungzip } from 'pako';
import { File } from 'expo-file-system';
const CP1256 = "€پ‚ƒ„…†‡ˆ‰ٹ‹Œچژڈگ‘’“”•–—ک™ڑ›œ‌‍ں ،¢£¤¥¦§¨©ھ«¬­®¯°±²³´µ¶·¸¹؛»¼½¾؟ہءآأؤإئابةتثجحخدذرزسشصض×طظعغـفقكàلâمنهوçèéêëىيîïًٌٍَôُِ÷ّùْûü‎‏ے";

function decodeUtf8Strict(b) {
  let out = '', i = 0;
  if (b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) i = 3;
  while (i < b.length) {
    const c = b[i];
    let cp, n;
    if (c < 0x80) { cp = c; n = 0; }
    else if ((c & 0xE0) === 0xC0) { cp = c & 0x1F; n = 1; }
    else if ((c & 0xF0) === 0xE0) { cp = c & 0x0F; n = 2; }
    else if ((c & 0xF8) === 0xF0) { cp = c & 0x07; n = 3; }
    else return null;
    if (i + n >= b.length + (n ? 0 : 1)) return null;
    for (let k = 1; k <= n; k++) {
      const d = b[i + k];
      if (d === undefined || (d & 0xC0) !== 0x80) return null;
      cp = (cp << 6) | (d & 0x3F);
    }
    out += String.fromCodePoint(cp);
    i += n + 1;
  }
  return out;
}

export function decodeSubBytes(b) {
  const u = decodeUtf8Strict(b);
  if (u !== null) return u;
  let out = '';
  for (let i = 0; i < b.length; i++) out += b[i] < 128 ? String.fromCharCode(b[i]) : CP1256[b[i] - 128];
  return out; // Windows-1256 (common for Arabic subtitles)
}

function toSec(t) {
  const m = t.trim().replace(',', '.').split(':');
  let s = 0;
  for (const p of m) s = s * 60 + parseFloat(p);
  return s;
}

export function parseSubs(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const cues = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/((?:\d+:)?\d+:\d+[.,]\d+)\s*-->\s*((?:\d+:)?\d+:\d+[.,]\d+)/);
    if (!m) continue;
    const buf = [];
    i++;
    while (i < lines.length && lines[i].trim() !== '') { buf.push(lines[i]); i++; }
    const txt = buf.join('\n').replace(/<[^>]+>/g, '').replace(/\{[^}]*\}/g, '').trim();
    if (txt) cues.push({ start: toSec(m[1]), end: toSec(m[2]), text: txt });
  }
  return cues;
}

export async function readBytes(uri) {
  if (uri.startsWith('file:')) {
    return await new File(uri).bytes();
  }
  const r = await fetch(uri);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return new Uint8Array(await r.arrayBuffer());
}


/* ---------- online search (OpenSubtitles legacy REST, keyless) ---------- */

const OS_UA = 'TemporaryUserAgent';

export function guessQuery(name) {
  let n = decodeURIComponent(name || '');
  n = n.replace(/\.[a-z0-9]{2,4}$/i, '');
  let season, episode;
  const m = n.match(/s(\d{1,2})[ ._-]?e(\d{1,3})/i) || n.match(/(\d{1,2})x(\d{2,3})/i);
  if (m) { season = +m[1]; episode = +m[2]; n = n.slice(0, m.index); }
  n = n.replace(/[._]+/g, ' ')
    .replace(/[\[\(][^\]\)]*[\]\)]/g, ' ')
    .replace(/\b(19|20)\d{2}\b.*$/, '')
    .replace(/\b(2160p|1080p|720p|480p|web[- ]?dl|webrip|bluray|brrip|hdrip|x26[45]|h ?26[45]|hevc|aac|ddp?5 ?1|hdr|10bit)\b.*$/i, '')
    .replace(/[\[\(].*?[\]\)]/g, '')
    .replace(/\s+/g, ' ').trim();
  if (/^(index|master|playlist|video|stream|media|output|file|movie|chunklist)\d*$/i.test(n)) n = '';
  return { query: n, season, episode };
}

export async function searchSubs({ query, season, episode }, lang = 'ara') {
  const q = encodeURIComponent(query.toLowerCase());
  let path = '';
  if (episode) path += `/episode-${episode}`;
  path += `/query-${q}`;
  if (season) path += `/season-${season}`;
  path += `/sublanguageid-${lang}`;
  const r = await fetch(`https://rest.opensubtitles.org/search${path}`, { headers: { 'User-Agent': OS_UA, 'X-User-Agent': OS_UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const arr = await r.json();
  return (Array.isArray(arr) ? arr : [])
    .filter((x) => /^(srt|vtt|sub)$/i.test(x.SubFormat || 'srt'))
    .map((x) => ({
      id: x.IDSubtitleFile, file: x.SubFileName, link: x.SubDownloadLink, downloads: +x.SubDownloadsCnt || 0,
      title: x.MovieName, season: x.SeriesSeason, episode: x.SeriesEpisode, lang: x.ISO639,
    }))
    .sort((a, b) => {
      const norm = (t) => (t || '').replace(/["']/g, '').trim().toLowerCase();
      const ea = norm(a.title) === norm(query) ? 1 : 0, eb = norm(b.title) === norm(query) ? 1 : 0;
      return eb - ea || b.downloads - a.downloads;
    });
}

export async function downloadSub(link) {
  const r = await fetch(link, { headers: { 'User-Agent': OS_UA, 'X-User-Agent': OS_UA } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  let b = new Uint8Array(await r.arrayBuffer());
  if (b[0] === 0x1f && b[1] === 0x8b) b = ungzip(b);
  return b;
}

export function cleanCues(cues) {
  return cues.filter((c) => !/opensubtitles|osdb\.link|watch online|www\./i.test(c.text));
}
