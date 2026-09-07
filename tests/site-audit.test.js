const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = process.cwd();
const INTERNAL_HOST = "worthchex.com";
const ignoredDirectories = new Set([".git", ".github"]);
const failures = [];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const allFiles = walk(ROOT);
const htmlFiles = allFiles.filter(file => file.toLowerCase().endsWith(".html"));
const fileSet = new Set(allFiles.map(file => path.relative(ROOT, file).replaceAll(path.sep, "/")));

assert.ok(htmlFiles.length >= 20, `Expected a substantial HTML site; found only ${htmlFiles.length} pages.`);

function normaliseInternalTarget(raw, sourceFile) {
  const withoutHash = raw.split("#")[0];
  if (!withoutHash) return null;
  const withoutQuery = withoutHash.split("?")[0];
  if (!withoutQuery) return null;

  const sourceRelative = path.relative(ROOT, sourceFile).replaceAll(path.sep, "/");
  const sourceDirectory = path.posix.dirname(sourceRelative);
  const resolved = withoutQuery.startsWith("/")
    ? path.posix.resolve("/", `/${withoutQuery}`)
    : path.posix.resolve("/", sourceDirectory, withoutQuery);
  let targetPath = resolved.replace(/^\/+/, "");

  if (targetPath === "") targetPath = "index.html";
  else if (targetPath.endsWith("/")) targetPath += "index.html";

  if (fileSet.has(targetPath)) return targetPath;
  const asIndex = targetPath.endsWith(".html") ? targetPath : `${targetPath}/index.html`;
  if (fileSet.has(asIndex)) return asIndex;
  return targetPath;
}

function expectedCanonical(sourceFile) {
  const relative = path.relative(ROOT, sourceFile).replaceAll(path.sep, "/");
  if (relative === "index.html") return "https://worthchex.com/";
  const directory = path.posix.dirname(relative);
  return `https://${INTERNAL_HOST}/${directory}/`;
}

for (const file of htmlFiles) {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const html = fs.readFileSync(file, "utf8");

  // Google Search Console site-verification HTML is intentionally not a full web page.
  if (path.basename(relative).startsWith("google") && !/<html\b/i.test(html)) continue;

  const titleMatches = html.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) || [];
  if (titleMatches.length !== 1) failures.push(`${relative}: expected exactly one <title>, found ${titleMatches.length}`);

  const descriptionMatches = html.match(/<meta\b[^>]*name=["']description["'][^>]*>/gi) || [];
  if (descriptionMatches.length !== 1) failures.push(`${relative}: expected exactly one meta description, found ${descriptionMatches.length}`);

  const canonicalMatches = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  if (canonicalMatches.length !== 1) {
    failures.push(`${relative}: expected exactly one canonical, found ${canonicalMatches.length}`);
  } else if (canonicalMatches[0][1] !== expectedCanonical(file)) {
    failures.push(`${relative}: canonical ${canonicalMatches[0][1]} does not match expected ${expectedCanonical(file)}`);
  }

  if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) {
    failures.push(`${relative}: explicit noindex found on a page expected to be indexable`);
  }

  const ids = new Map();
  for (const match of html.matchAll(/\bid=["']([^"']+)["']/gi)) {
    const id = match[1];
    ids.set(id, (ids.get(id) || 0) + 1);
  }
  for (const [id, count] of ids) {
    if (count > 1) failures.push(`${relative}: duplicate id="${id}" (${count} occurrences)`);
  }

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1].trim();
    if (!href || href.startsWith("#") || /^mailto:|^tel:|^javascript:/i.test(href)) continue;
    if (/^http:\/\/worthchex\.com/i.test(href)) {
      failures.push(`${relative}: insecure internal HTTP link ${href}`);
      continue;
    }
    if (/^https?:\/\//i.test(href)) {
      try {
        const url = new URL(href);
        if ((url.hostname === INTERNAL_HOST || url.hostname === `www.${INTERNAL_HOST}`) && url.protocol !== "https:") {
          failures.push(`${relative}: internal absolute URL is not HTTPS: ${href}`);
        }
        if (url.hostname !== INTERNAL_HOST && url.hostname !== `www.${INTERNAL_HOST}` && /\btarget=["']_blank["']/i.test(match[0]) && !/\brel=["'][^"']*noopener/i.test(match[0])) {
          failures.push(`${relative}: target=_blank external link missing rel=noopener: ${href}`);
        }
      } catch {
        failures.push(`${relative}: malformed absolute link ${href}`);
      }
      continue;
    }
    if (/^\/\//.test(href)) continue;
    const target = normaliseInternalTarget(href, file);
    if (target && !fileSet.has(target)) failures.push(`${relative}: broken internal link ${href} -> ${target}`);
  }

  for (const match of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1].trim();
    if (/^https?:\/\//i.test(src)) continue;
    const target = normaliseInternalTarget(src, file);
    if (target && !fileSet.has(target)) failures.push(`${relative}: missing script ${src}`);
  }

  for (const match of html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const href = match[1].trim();
    if (/^https?:\/\//i.test(href)) continue;
    const target = normaliseInternalTarget(href, file);
    if (target && !fileSet.has(target)) failures.push(`${relative}: missing stylesheet ${href}`);
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    if (!/\balt=["'][^"']*["']/i.test(match[1])) failures.push(`${relative}: image missing alt attribute`);
  }

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    const source = match[2].trim();
    if (!source || /type=["']application\/ld\+json["']/i.test(attrs)) continue;
    try {
      new vm.Script(source, { filename: relative });
    } catch (error) {
      failures.push(`${relative}: inline script syntax error: ${error.message}`);
    }
  }
}

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(match => match[1].trim());
assert.ok(sitemapUrls.length >= 20, `Expected at least 20 sitemap URLs; found ${sitemapUrls.length}.`);
const sitemapSet = new Set(sitemapUrls);
if (sitemapSet.size !== sitemapUrls.length) failures.push("sitemap.xml: duplicate <loc> entries found");
for (const urlString of sitemapUrls) {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:" || url.hostname !== INTERNAL_HOST) failures.push(`sitemap.xml: non-canonical URL ${urlString}`);
    const target = normaliseInternalTarget(url.pathname || "/", path.join(ROOT, "index.html"));
    if (!target || !fileSet.has(target)) failures.push(`sitemap.xml: URL does not map to a repository page: ${urlString}`);
  } catch {
    failures.push(`sitemap.xml: malformed URL ${urlString}`);
  }
}

const robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
if (!/^\s*User-agent:\s*\*\s*$/mi.test(robots)) failures.push("robots.txt: missing User-agent: *");
if (!/^\s*Allow:\s*\/\s*$/mi.test(robots)) failures.push("robots.txt: missing Allow: /");
if (!/^\s*Sitemap:\s*https:\/\/worthchex\.com\/sitemap\.xml\s*$/mi.test(robots)) failures.push("robots.txt: sitemap directive is missing or non-canonical");

assert.deepEqual(failures, [], `Site audit found ${failures.length} issue(s):\n${failures.join("\n")}`);
console.log(`WorthChex site audit passed: ${htmlFiles.length} HTML pages, ${sitemapUrls.length} sitemap URLs, local asset/link checks and inline-script syntax checks.`);
