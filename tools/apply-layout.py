#!/usr/bin/env python3
"""Apply the shared WorthChex header, footer, head tags and structured data to every page.

Run from the repository root:  python3 tools/apply-layout.py
The script is idempotent: running it again replaces the generated blocks rather than duplicating them.
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://worthchex.com"
ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1099780649652223" crossorigin="anonymous"></script>'
MODIFIED = "2026-10-16"

ICONS = {
    "affordability": '<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v4"/><rect x="3" y="7.5" width="18" height="12.5" rx="2.5"/><circle cx="16.5" cy="13.75" r="1.25"/>',
    "savings": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    "debt": '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6.5 15h4"/>',
    "salary": '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8.5 7V5.5A2.5 2.5 0 0 1 11 3h2a2.5 2.5 0 0 1 2.5 2.5V7M3 12.5h18"/>',
    "takehome": '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
    "mortgage": '<path d="M3 11 12 4l9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
    "compound": '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/><path d="M15 7h5v5"/>',
    "stampduty": '<path d="M3 21h18M5 21V11M9.5 21V11M14.5 21V11M19 21V11"/><path d="M2.5 11 12 4.5l9.5 6.5z"/>',
    "vat": '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    "car": '<path d="M4 16.5V13l1.8-4.6A2 2 0 0 1 7.7 7h8.6a2 2 0 0 1 1.9 1.4L20 13v3.5"/><path d="M3.5 13h17"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
    "loan": '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    "all": '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    "guides": '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/><path d="M8 7h7M8 10.5h5"/>',
    "about": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>',
    "method": '<path d="M9 3h6M10 3v5.5L4.8 18a2 2 0 0 0 1.8 3h10.8a2 2 0 0 0 1.8-3L14 8.5V3"/><path d="M7.5 14.5h9"/>',
    "privacy": '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
}

def icon(name, cls="wc-icon"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'

CALCS = [
    ("/take-home-pay-calculator/", "Take-home pay", "takehome"),
    ("/salary-calculator/", "Salary & pay rise", "salary"),
    ("/vat-calculator/", "VAT", "vat"),
    ("/mortgage-calculator/", "Mortgage", "mortgage"),
    ("/stamp-duty-calculator/", "Stamp Duty", "stampduty"),
    ("/affordability-calculator/", "Affordability", "affordability"),
    ("/car-finance-calculator/", "Car finance", "car"),
    ("/personal-loan-calculator/", "Personal loan", "loan"),
    ("/debt-payoff-calculator/", "Debt payoff", "debt"),
    ("/savings-calculator/", "Savings goal", "savings"),
    ("/compound-interest-calculator/", "Compound interest", "compound"),
]
CALC_ICON = {href: ic for href, _, ic in CALCS}
CALC_ICON["/calculators/"] = "all"

def logo(gid, dark=False):
    a, b = ("#a78bfa", "#60a5fa") if dark else ("#7c3aed", "#2563eb")
    mark = (f'<svg class="logo-mark" viewBox="0 0 48 40" aria-hidden="true" focusable="false"><defs><linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1">'
            f'<stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient></defs>'
            f'<path d="M4 7 13.5 34 24 17.5 34.5 34 44 7" fill="none" stroke="url(#{gid})" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<text x="24" y="15" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="800" font-size="18" fill="url(#{gid})">£</text></svg>')
    word = 'WorthChex' if dark else 'Worth<span class="logo-accent">Chex</span>'
    return f'<a href="/" class="wc-logo" aria-label="WorthChex home">{mark}<span class="logo-word">{word}</span></a>'

def link(href, label, ic=None):
    return f'<a href="{href}">{icon(ic) if ic else ""}{label}</a>'

NAV = (
    '<!-- wc:header -->'
    '<a class="skip-link" href="#main">Skip to content</a>'
    '<nav class="navbar" aria-label="Main navigation"><div class="nav-inner">'
    + logo("wcg-h") +
    '<div class="nav-links">'
    '<a href="/take-home-pay-calculator/">Take-home pay</a>'
    '<a href="/mortgage-calculator/">Mortgage</a>'
    '<a href="/stamp-duty-calculator/">Stamp Duty</a>'
    '<a href="/savings-calculator/">Savings</a>'
    '<a href="/money-guides/">Money guides</a>'
    '<a href="/calculators/" class="nav-cta">All calculators</a>'
    '</div>'
    '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-menu">'
    '<svg class="wc-icon icon-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
    '<svg class="wc-icon icon-close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>Menu</button>'
    '</div>'
    '<div class="nav-panel" id="site-menu"><div class="nav-panel-inner">'
    '<div><h2>Pay &amp; tax</h2>' + "".join(link(h, l, i) for h, l, i in CALCS[:3]) + '</div>'
    '<div><h2>Home &amp; borrowing</h2>' + "".join(link(h, l, i) for h, l, i in CALCS[3:9]) + '</div>'
    '<div><h2>Saving &amp; more</h2>' + "".join(link(h, l, i) for h, l, i in CALCS[9:]) +
    link("/calculators/", "All calculators", "all") + link("/money-guides/", "Money guides", "guides") + link("/about/", "About WorthChex", "about") + '</div>'
    '</div></div></nav>'
    '<!-- /wc:header -->'
)

def flist(items):
    return "<ul>" + "".join(f'<li><a href="{h}">{l}</a></li>' for h, l in items) + "</ul>"

FOOTER = (
    '<!-- wc:footer -->'
    '<footer class="site-footer"><div class="footer-grid">'
    '<div class="footer-brand">' + logo("wcg-f", dark=True) +
    '<p>Free UK money calculators and plain-English guides. Every calculation runs in your browser: no sign-up, no bank details.</p></div>'
    '<div><h2>Pay &amp; tax</h2>' + flist([("/take-home-pay-calculator/", "Take-home pay"), ("/salary-calculator/", "Salary & pay rise"), ("/vat-calculator/", "VAT")]) + '</div>'
    '<div><h2>Home &amp; borrowing</h2>' + flist([("/mortgage-calculator/", "Mortgage"), ("/stamp-duty-calculator/", "Stamp Duty"), ("/affordability-calculator/", "Affordability"), ("/car-finance-calculator/", "Car finance"), ("/personal-loan-calculator/", "Personal loan"), ("/debt-payoff-calculator/", "Debt payoff")]) + '</div>'
    '<div><h2>Saving</h2>' + flist([("/savings-calculator/", "Savings goal"), ("/compound-interest-calculator/", "Compound interest"), ("/money-guides/", "Money guides")]) + '</div>'
    '<div><h2>WorthChex</h2>' + flist([("/calculators/", "All calculators"), ("/about/", "About"), ("/methodology/", "Methodology"), ("/privacy/", "Privacy policy")] + ([("/contact/", "Contact")] if os.path.exists(os.path.join(ROOT, "contact", "index.html")) else [])) + '</div>'
    '</div>'
    '<div class="footer-bottom"><span>© 2026 WorthChex</span>'
    '<p>WorthChex provides estimates for education and planning. It is not financial, tax or legal advice. Check important decisions with the official source or a regulated adviser.</p></div>'
    '</footer>'
    '<!-- /wc:footer -->'
)

STYLE_FILES = ["style.css", "calculator-v2.css", "nav.css", "mobile-tweaks.css", "mobile-fix.css", "home.css", "content-enhancements.css", "site.css"]

def pages():
    for dirpath, dirnames, files in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in (".git", ".github", "tools", "tests", "node_modules")]
        for f in files:
            if f == "index.html":
                yield os.path.join(dirpath, f)

def url_path(path):
    rel = os.path.relpath(os.path.dirname(path), ROOT).replace(os.sep, "/")
    return "/" if rel == "." else f"/{rel}/"

def text(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()

def process(path):
    s = open(path, encoding="utf-8").read()
    up = url_path(path)
    is_home = up == "/"
    is_calc = up.endswith("-calculator/") or up == "/calculators/"
    is_guide = up.startswith("/money-guides/") and up != "/money-guides/"

    # ---- head: strip generated / managed tags
    s = re.sub(r"\s*<!-- wc:head -->.*?<!-- /wc:head -->\n?", "", s, flags=re.S)
    for f in STYLE_FILES:
        s = re.sub(r'\s*<link rel="stylesheet" href="(?:\.\./)*' + re.escape(f) + r'(?:\?[^"]*)?">', "", s)
    s = re.sub(r'\s*<script async src="https://pagead2\.googlesyndication\.com/[^"]*"[^>]*>\s*</script>', "", s)
    if 'name="theme-color"' not in s:
        s = s.replace('<link rel="canonical"', '<meta name="theme-color" content="#635bff"><link rel="canonical"', 1)
    if 'rel="icon"' not in s:
        s = s.replace('<link rel="canonical"', '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="canonical"', 1)
    if 'rel="manifest"' not in s:
        s = s.replace('<link rel="canonical"', '<link rel="manifest" href="/site.webmanifest"><link rel="canonical"', 1)
    s = re.sub(r'href="(?:\.\./)+favicon\.svg"', 'href="/favicon.svg"', s)
    s = re.sub(r'href="(?:\.\./)+site\.webmanifest"', 'href="/site.webmanifest"', s)
    s = s.replace('href="favicon.svg"', 'href="/favicon.svg"').replace('href="site.webmanifest"', 'href="/site.webmanifest"')

    title = text(re.search(r"<title>(.*?)</title>", s, re.S).group(1))
    desc = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s).group(1))
    canonical = re.search(r'<link rel="canonical" href="([^"]+)"', s).group(1)
    h1m = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
    h1 = text(h1m.group(1)) if h1m else title

    sheets = ["/style.css"] + (["/calculator-v2.css"] if is_calc or is_home else []) + ["/content-enhancements.css"] + (["/home.css"] if is_home else []) + ["/site.css"]
    esc = lambda v: html.escape(v, quote=True)
    head = [
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;display=swap">',
        "".join(f'<link rel="stylesheet" href="{h}?v=20261016b">' for h in sheets),
        f'<meta property="og:type" content="{"article" if is_guide else "website"}"><meta property="og:site_name" content="WorthChex"><meta property="og:locale" content="en_GB">',
        f'<meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(desc)}"><meta property="og:url" content="{canonical}">',
        f'<meta property="og:image" content="{SITE}/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="WorthChex: free UK money calculators">',
        f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(title)}"><meta name="twitter:description" content="{esc(desc)}"><meta name="twitter:image" content="{SITE}/og-image.png">',
        ADSENSE,
    ]
    # structured data
    crumbs = [{"@type": "ListItem", "position": 1, "name": "WorthChex", "item": SITE + "/"}]
    if is_guide:
        crumbs.append({"@type": "ListItem", "position": 2, "name": "Money guides", "item": SITE + "/money-guides/"})
    if not is_home:
        crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": h1 if is_guide else title.split("|")[0].strip(), "item": canonical})
    graph = []
    if not is_home:
        graph.append({"@type": "BreadcrumbList", "itemListElement": crumbs})
    if up.endswith("-calculator/"):
        graph.append({"@type": "WebApplication", "name": title.split("|")[0].strip(), "url": canonical, "description": desc,
                      "applicationCategory": "FinanceApplication", "operatingSystem": "Any", "browserRequirements": "Requires JavaScript",
                      "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "GBP"},
                      "publisher": {"@type": "Organization", "name": "WorthChex", "url": SITE + "/"}})
    if is_guide:
        graph.append({"@type": "Article", "headline": h1[:110], "description": desc, "url": canonical, "mainEntityOfPage": canonical,
                      "inLanguage": "en-GB", "dateModified": MODIFIED, "image": SITE + "/og-image.png",
                      "author": {"@type": "Organization", "name": "WorthChex", "url": SITE + "/about/"},
                      "publisher": {"@type": "Organization", "name": "WorthChex", "url": SITE + "/", "logo": {"@type": "ImageObject", "url": SITE + "/assets/worthchex-logo.webp"}}})
    if graph:
        head.append('<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False) + "</script>")
    block = "\n<!-- wc:head -->" + "\n".join(head) + "<!-- /wc:head -->\n"
    s = s.replace("</head>", block + "</head>", 1)

    # ---- header
    if "<!-- wc:header -->" in s:
        s, n = re.subn(r"<!-- wc:header -->.*?<!-- /wc:header -->", lambda m: NAV, s, count=1, flags=re.S)
    else:
        s, n = re.subn(r"<nav class=\"navbar\"[^>]*>.*?</nav>", lambda m: NAV, s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"{path}: navbar not found")

    # ---- main landmark id
    if re.search(r"<main\b", s):
        s = re.sub(r'<main\b(?![^>]*\bid=)', '<main id="main"', s, count=1)
    else:
        s = s.replace("<!-- /wc:header -->", '<!-- /wc:header --><div id="main"></div>', 1)

    # ---- footer
    if "<!-- wc:footer -->" in s:
        s, n = re.subn(r"<!-- wc:footer -->.*?<!-- /wc:footer -->", lambda m: FOOTER, s, count=1, flags=re.S)
    else:
        s, n = re.subn(r"<footer\b.*?</footer>", lambda m: FOOTER, s, count=1, flags=re.S)
    if n != 1:
        s = s.replace("</body>", FOOTER + "</body>", 1)

    # ---- site script
    s = re.sub(r'\s*<script src="/site\.js[^"]*"[^>]*></script>', "", s)
    s = s.replace("</body>", '<script src="/site.js?v=20261016b" defer></script>\n</body>', 1)

    # ---- tool card icons
    def swap_icon(m):
        attrs = m.group(1)
        if 'class="tool-card' not in attrs:
            return m.group(0)
        href = re.search(r'href="([^"]+)"', attrs).group(1)
        key = CALC_ICON.get("/" + re.sub(r"^(?:\.\./|\./|/)+", "", href))
        if not key:
            return m.group(0)
        return f'<a {attrs}><span class="tool-card-icon">{icon(key)}</span>'
    s = re.sub(r'<a ([^>]*)><span class="tool-card-icon">(?:<svg.*?</svg>|[^<]*)</span>', swap_icon, s, flags=re.S)

    # ---- remove internal version labels from visible eyebrows
    s = re.sub(r'(<span class="step">[^<]*?) V\d</span>', r"\1</span>", s)

    open(path, "w", encoding="utf-8").write(s)
    return up

if __name__ == "__main__":
    done = [process(p) for p in sorted(pages())]
    print(f"Updated {len(done)} pages")
