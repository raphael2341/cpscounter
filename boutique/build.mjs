#!/usr/bin/env node
// Génère, à partir de catalogue.json :
//   dist/fr/…, dist/us/…         site vitrine statique (accueil, catégories, fiches produits)
//   dist/apercu.html             la même boutique dans un seul fichier autonome (tablette, téléphone)
//   exports/shopify-fr.csv, -us  fichiers d'import produits Shopify (brouillons)
//   exports/catalogue-interne.md tableau des prix, marges et fournisseurs (usage interne)
//
// Usage : node build.mjs    (Node 18+ ; aucune dépendance)

import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const EXPORTS = join(ROOT, 'exports');

const catalogue = JSON.parse(readFileSync(join(ROOT, 'catalogue.json'), 'utf8'));
const { meta, marches, categories, produits } = catalogue;
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

// ---------------------------------------------------------------------------
// Textes d'interface par langue
// ---------------------------------------------------------------------------

const UI = {
  fr: {
    home: 'Accueil',
    allProducts: 'Tout le catalogue',
    allFile: 'tous-les-produits.html',
    categoryDir: 'categorie',
    productDir: 'produit',
    favoritesId: 'coups-de-coeur',
    favorites: 'Nos coups de cœur',
    favoritesIntro: 'Les indispensables pour un hiver tout doux.',
    favoriteBadge: 'Coup de cœur',
    universes: 'Nos univers',
    gifts: (prix) => `Idées cadeaux jusqu'à ${prix}`,
    giftsIntro: 'De petites attentions qui font chaud au cœur.',
    seeFavorites: 'Voir nos coups de cœur',
    seeAll: 'Voir tout le catalogue',
    seeCategory: 'Voir la sélection',
    count: (n) => `${n} produit${n > 1 ? 's' : ''}`,
    addToCart: 'Ajouter au panier',
    cartPreview: "Aperçu : le paiement sera activé à l'ouverture de la boutique.",
    highlights: 'Points forts',
    related: 'Dans la même catégorie',
    photoSoon: 'Photo à venir',
    breadcrumb: "Fil d'Ariane",
    nav: 'Catégories',
    otherMarket: 'Version US ($)',
    footerNote: 'Boutique en préparation : contenus et prix susceptibles d’évoluer.',
  },
  en: {
    home: 'Home',
    allProducts: 'Shop all',
    allFile: 'all-products.html',
    categoryDir: 'collections',
    productDir: 'products',
    favoritesId: 'favorites',
    favorites: 'Our favorites',
    favoritesIntro: 'The essentials for a soft, snug winter.',
    favoriteBadge: 'Favorite',
    universes: 'Shop by category',
    gifts: (prix) => `Gifts for ${prix} or less`,
    giftsIntro: 'Small, thoughtful gifts that warm the heart.',
    seeFavorites: 'See our favorites',
    seeAll: 'Shop all products',
    seeCategory: 'Shop now',
    count: (n) => `${n} product${n > 1 ? 's' : ''}`,
    addToCart: 'Add to cart',
    cartPreview: 'Preview only: checkout will be enabled when the store opens.',
    highlights: 'Highlights',
    related: 'More from this category',
    photoSoon: 'Photo coming soon',
    breadcrumb: 'Breadcrumb',
    nav: 'Categories',
    otherMarket: 'Version française (€)',
    footerNote: 'Store in preparation: content and prices may change.',
  },
};

const SEUIL_CADEAUX = 25;

// Icônes de catégorie (trait, 24×24), utilisées tant qu'il n'y a pas de photo.
const ICONES = {
  plaid:
    '<path d="M4 6.5h13a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H4z"/><path d="M4 12.5h14a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 18 17.5H4z"/><path d="M8 6.5v11M12 6.5v11"/>',
  chaleur:
    '<path d="M8 4.5c-1.6 2 1.6 3.5 0 5.5s1.6 3.5 0 5.5"/><path d="M12 4.5c-1.6 2 1.6 3.5 0 5.5s1.6 3.5 0 5.5"/><path d="M16 4.5c-1.6 2 1.6 3.5 0 5.5s1.6 3.5 0 5.5"/><path d="M5 19.5h14"/>',
  tasse:
    '<path d="M5 10h11v4.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3.5c-.9 1.1.9 2.1 0 3.2M12.5 3.5c-.9 1.1.9 2.1 0 3.2"/>',
  flamme:
    '<path d="M12 3c1.6 2.6 5 4.8 5 9a5 5 0 0 1-10 0c0-2.3 1.2-3.9 2.6-5.1.1 1.6.9 2.7 2.1 3.1C11.2 7.6 11 5.3 12 3z"/><path d="M7.5 21h9"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
};

// ---------------------------------------------------------------------------
// Validation du catalogue
// ---------------------------------------------------------------------------

function valider() {
  const erreurs = [];
  const langues = [...new Set(Object.values(marches).map((m) => m.langue))];

  const idsCat = new Set();
  for (const c of categories) {
    if (idsCat.has(c.id)) erreurs.push(`Catégorie en double : ${c.id}`);
    idsCat.add(c.id);
    if (!ICONES[c.icone]) erreurs.push(`Catégorie ${c.id} : icône inconnue « ${c.icone} »`);
    for (const l of langues) {
      if (!c[l]?.nom || !c[l]?.slug) erreurs.push(`Catégorie ${c.id} : nom ou slug manquant en « ${l} »`);
    }
  }

  const ids = new Set();
  const slugs = Object.fromEntries(langues.map((l) => [l, new Set()]));
  const vedettes = new Set();
  for (const p of produits) {
    const ref = `Produit ${p.id}`;
    if (ids.has(p.id)) erreurs.push(`${ref} : identifiant en double`);
    ids.add(p.id);
    if (!catById[p.categorie]) erreurs.push(`${ref} : catégorie inconnue « ${p.categorie} »`);
    for (const l of langues) {
      const t = p[l];
      if (!t?.nom || !t?.slug || !t?.description) {
        erreurs.push(`${ref} : nom, slug ou description manquant en « ${l} »`);
        continue;
      }
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.slug)) erreurs.push(`${ref} : slug invalide « ${t.slug} »`);
      if (slugs[l].has(t.slug)) erreurs.push(`${ref} : slug en double « ${t.slug} »`);
      slugs[l].add(t.slug);
      if (!Array.isArray(t.points_forts) || t.points_forts.length === 0) erreurs.push(`${ref} : points forts manquants en « ${l} »`);
    }
    if (!(typeof p.prix_vente === 'number' && p.prix_vente > 0)) erreurs.push(`${ref} : prix de vente invalide`);
    if (p.vedette != null) {
      if (vedettes.has(p.vedette)) erreurs.push(`${ref} : rang de vedette ${p.vedette} déjà utilisé`);
      vedettes.add(p.vedette);
    }
    const a = p.prix_achat;
    if (a != null) {
      if (!['USD', 'EUR'].includes(a.devise)) erreurs.push(`${ref} : devise d'achat inconnue « ${a.devise} »`);
      if (!['verifie', 'estimation'].includes(a.fiabilite)) erreurs.push(`${ref} : fiabilité inconnue « ${a.fiabilite} »`);
      if (!(a.min > 0 && a.max >= a.min)) erreurs.push(`${ref} : fourchette de prix d'achat invalide`);
    }
    for (const f of p.fournisseurs ?? []) {
      if (!/^https:\/\//.test(f.url)) erreurs.push(`${ref} : lien fournisseur invalide ${f.url}`);
    }
  }

  if (erreurs.length) {
    console.error('Le catalogue contient des erreurs :\n- ' + erreurs.join('\n- '));
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Outils
// ---------------------------------------------------------------------------

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function monnaie(marche, valeur, decimales = !Number.isInteger(valeur)) {
  return new Intl.NumberFormat(marche.locale, {
    style: 'currency',
    currency: marche.devise,
    minimumFractionDigits: decimales ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(valeur);
}

// Coût d'achat converti dans une devise. Par prudence on prend le haut de la fourchette.
function coutMax(p, devise) {
  const a = p.prix_achat;
  if (!a) return null;
  if (a.devise === devise) return a.max;
  const taux = meta.taux_usd_vers_eur;
  return devise === 'EUR' ? a.max * taux : a.max / taux;
}

const arrondi2 = (v) => Math.round(v * 100) / 100;

const vedettes = () => produits.filter((p) => p.vedette != null).sort((a, b) => a.vedette - b.vedette);
const produitsDe = (catId) => produits.filter((p) => p.categorie === catId);

function ecrire(chemin, contenu) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, contenu);
}

// ---------------------------------------------------------------------------
// Site vitrine
// ---------------------------------------------------------------------------

function icone(nom, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nom]}</svg>`;
}

function visuel(ctx, p, { classe = '', etiquette = '', badge = '' } = {}) {
  const cat = catById[p.categorie];
  const t = p[ctx.lang];
  const media = p.image
    ? `<img src="${esc(/^https?:/.test(p.image) ? p.image : ctx.assets + p.image)}" alt="${esc(t.nom)}" loading="lazy">`
    : icone(cat.icone, 'visual__icon');
  return `<div class="visual visual--${cat.id} ${classe}">${media}${badge}${
    etiquette && !p.image ? `<span class="visual__label">${esc(etiquette)}</span>` : ''
  }</div>`;
}

// Adresses des pages. Mode « site » : fichiers HTML séparés. Mode « apercu » : un seul
// fichier où chaque page est un écran, désigné par un #nom (fr-produit-…, us-products-…).
function liens(code, mode, base = '') {
  const lang = marches[code].langue;
  const ui = UI[lang];
  const autre = Object.keys(marches).find((k) => k !== code) ?? code;
  const tous = ui.allFile.replace(/\.html$/, '');
  if (mode === 'apercu') {
    return {
      accueil: () => `#${code}`,
      tous: () => `#${code}-${tous}`,
      categorie: (c) => `#${code}-${ui.categoryDir}-${c[lang].slug}`,
      produit: (p) => `#${code}-${ui.productDir}-${p[lang].slug}`,
      autreMarche: () => `#${autre}`,
    };
  }
  return {
    accueil: () => `${base}index.html`,
    tous: () => `${base}${ui.allFile}`,
    categorie: (c) => `${base}${ui.categoryDir}/${c[lang].slug}.html`,
    produit: (p) => `${base}${ui.productDir}/${p[lang].slug}.html`,
    autreMarche: () => `${base}../${autre}/index.html`,
  };
}

function contexte(code, mode, profondeur = 0) {
  const marche = marches[code];
  const lang = marche.langue;
  const base = '../'.repeat(profondeur);
  return {
    code,
    marche,
    lang,
    ui: UI[lang],
    href: liens(code, mode, base),
    assets: mode === 'apercu' ? 'assets/' : `${base}../assets/`,
  };
}

function carte(ctx, p) {
  const t = p[ctx.lang];
  const cat = catById[p.categorie];
  const badge = p.vedette != null ? `<span class="badge">${esc(ctx.ui.favoriteBadge)}</span>` : '';
  return `<a class="card" href="${ctx.href.produit(p)}">
  ${visuel(ctx, p, { badge })}
  <span class="card__body">
    <span class="card__cat">${esc(cat[ctx.lang].nom)}</span>
    <span class="card__title">${esc(t.nom)}</span>
    <span class="card__price">${monnaie(ctx.marche, p.prix_vente)}</span>
  </span>
</a>`;
}

const grille = (ctx, liste) => `<div class="grid">${liste.map((p) => carte(ctx, p)).join('\n')}</div>`;

// En-tête, contenu et pied de page d'une page (sans la balise <html>).
function habillage(ctx, { corps, actif }) {
  const { ui, marche, lang, href } = ctx;
  const lienCat = (c) =>
    `<a href="${href.categorie(c)}"${actif === c.id ? ' aria-current="page"' : ''}>${esc(c[lang].nom)}</a>`;
  return `<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="brand" href="${href.accueil()}">${icone('flamme', 'brand__mark')}<span>${esc(marche.nom_boutique)}</span></a>
    <nav class="site-nav" aria-label="${esc(ui.nav)}">
      ${categories.map(lienCat).join('\n      ')}
      <a href="${href.tous()}"${actif === 'tous' ? ' aria-current="page"' : ''}>${esc(ui.allProducts)}</a>
    </nav>
  </div>
</header>
<main>
${corps}
</main>
<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <div>
      <p class="brand brand--footer">${icone('flamme', 'brand__mark')}<span>${esc(marche.nom_boutique)}</span></p>
      <p class="muted">${esc(marche.slogan)}</p>
    </div>
    <ul class="footer-links">
      ${categories.map((c) => `<li>${lienCat(c)}</li>`).join('\n      ')}
    </ul>
    <div class="footer-meta">
      <p class="muted">${esc(ui.footerNote)}</p>
      <p><a href="${href.autreMarche()}">${esc(ui.otherMarket)}</a></p>
    </div>
  </div>
</footer>`;
}

const POLICES =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap">';

function documentHtml(ctx, vue) {
  const { titre, description, jsonld } = vue;
  return `<!doctype html>
<html lang="${ctx.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
${POLICES}
<link rel="stylesheet" href="${ctx.assets}style.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
${habillage(ctx, vue)}
<div class="toast" role="status" aria-live="polite"></div>
<script src="${ctx.assets}app.js" defer></script>
</body>
</html>
`;
}

function filAriane(ctx, elements) {
  const items = elements
    .map(([libelle, href]) => (href ? `<li><a href="${href}">${esc(libelle)}</a></li>` : `<li aria-current="page">${esc(libelle)}</li>`))
    .join('');
  return `<nav class="crumbs wrap" aria-label="${esc(ctx.ui.breadcrumb)}"><ol>${items}</ol></nav>`;
}

// Chaque fonction « vue… » renvoie { titre, description, corps, jsonld?, actif? }.

function vueAccueil(ctx) {
  const { ui, marche, lang, href } = ctx;
  const cadeaux = produits.filter((p) => p.prix_vente <= SEUIL_CADEAUX && p.vedette == null);
  const tuiles = categories
    .map((c) => `<div class="visual visual--${c.id}">${icone(c.icone, 'visual__icon')}</div>`)
    .join('');
  const univers = categories
    .map((c) => {
      const n = produitsDe(c.id).length;
      return `<a class="universe" href="${href.categorie(c)}">
  <span class="visual visual--${c.id} universe__visual">${icone(c.icone, 'visual__icon')}</span>
  <span class="universe__body">
    <span class="universe__title">${esc(c[lang].nom)}</span>
    <span class="universe__intro">${esc(c[lang].intro)}</span>
    <span class="universe__more">${esc(ui.count(n))} · ${esc(ui.seeCategory)} →</span>
  </span>
</a>`;
    })
    .join('\n');

  const corps = `<section class="hero">
  <div class="wrap hero__inner">
    <div class="hero__text">
      <p class="eyebrow">${esc(marche.slogan)}</p>
      <h1>${esc(marche.hero_titre)}</h1>
      <p class="lede">${esc(marche.hero_texte)}</p>
      <div class="actions">
        <a class="btn" href="#${ui.favoritesId}">${esc(ui.seeFavorites)}</a>
        <a class="btn btn--ghost" href="${href.tous()}">${esc(ui.seeAll)}</a>
      </div>
    </div>
    <div class="hero__art" aria-hidden="true">${tuiles}</div>
  </div>
</section>

<ul class="perks wrap">
  ${marche.reassurance.map((r) => `<li>${icone('check', 'perks__icon')}${esc(r)}</li>`).join('\n  ')}
</ul>

<section class="section wrap" id="${ui.favoritesId}">
  <div class="section__head">
    <h2>${esc(ui.favorites)}</h2>
    <p class="muted">${esc(ui.favoritesIntro)}</p>
  </div>
  ${grille(ctx, vedettes())}
</section>

<section class="section section--tinted">
  <div class="wrap">
    <div class="section__head"><h2>${esc(ui.universes)}</h2></div>
    <div class="universes">
${univers}
    </div>
  </div>
</section>

<section class="section wrap">
  <div class="section__head">
    <h2>${esc(ui.gifts(monnaie(marche, SEUIL_CADEAUX)))}</h2>
    <p class="muted">${esc(ui.giftsIntro)}</p>
  </div>
  ${grille(ctx, cadeaux)}
</section>`;

  return { titre: `${marche.nom_boutique} | ${marche.slogan}`, description: marche.hero_texte, corps };
}

function vueCategorie(ctx, c) {
  const { ui, lang, href } = ctx;
  const liste = produitsDe(c.id);
  const corps = `${filAriane(ctx, [[ui.home, href.accueil()], [c[lang].nom]])}
<header class="page-head wrap">
  <span class="visual visual--${c.id} page-head__icon">${icone(c.icone, 'visual__icon')}</span>
  <div>
    <h1>${esc(c[lang].nom)}</h1>
    <p class="lede">${esc(c[lang].intro)}</p>
    <p class="muted">${esc(ui.count(liste.length))}</p>
  </div>
</header>
<section class="section section--flush wrap">
  ${grille(ctx, liste)}
</section>`;
  return { titre: `${c[lang].nom} | ${ctx.marche.nom_boutique}`, description: c[lang].intro, corps, actif: c.id };
}

function vueTous(ctx) {
  const { ui, lang, href } = ctx;
  const sections = categories
    .map(
      (c) => `<section class="section section--flush wrap">
  <div class="section__head section__head--row">
    <h2>${esc(c[lang].nom)}</h2>
    <a href="${href.categorie(c)}">${esc(ui.seeCategory)} →</a>
  </div>
  ${grille(ctx, produitsDe(c.id))}
</section>`,
    )
    .join('\n');
  const corps = `${filAriane(ctx, [[ui.home, href.accueil()], [ui.allProducts]])}
<header class="page-head wrap">
  <div>
    <h1>${esc(ui.allProducts)}</h1>
    <p class="muted">${esc(ui.count(produits.length))}</p>
  </div>
</header>
${sections}`;
  return { titre: `${ui.allProducts} | ${ctx.marche.nom_boutique}`, description: ctx.marche.hero_texte, corps, actif: 'tous' };
}

function vueProduit(ctx, p) {
  const { ui, marche, lang, href } = ctx;
  const t = p[lang];
  const cat = catById[p.categorie];
  const lienCat = href.categorie(cat);
  const voisins = produitsDe(cat.id).filter((x) => x.id !== p.id).slice(0, 4);
  const badge = p.vedette != null ? `<span class="badge">${esc(ui.favoriteBadge)}</span>` : '';

  const corps = `${filAriane(ctx, [[ui.home, href.accueil()], [cat[lang].nom, lienCat], [t.nom]])}
<article class="product wrap">
  <div class="product__media">${visuel(ctx, p, { classe: 'visual--large', etiquette: ui.photoSoon, badge })}</div>
  <div class="product__info">
    <a class="product__cat" href="${lienCat}">${esc(cat[lang].nom)}</a>
    <h1>${esc(t.nom)}</h1>
    <p class="product__price">${monnaie(marche, p.prix_vente)}</p>
    <p class="product__desc">${esc(t.description)}</p>
    <h2 class="product__subtitle">${esc(ui.highlights)}</h2>
    <ul class="checks">
      ${t.points_forts.map((x) => `<li>${icone('check', 'checks__icon')}${esc(x)}</li>`).join('\n      ')}
    </ul>
    <button class="btn btn--block" type="button" data-add-to-cart data-message="${esc(ui.cartPreview)}">${esc(ui.addToCart)}</button>
    <ul class="product__perks">
      ${marche.reassurance.map((r) => `<li>${icone('check', 'perks__icon')}${esc(r)}</li>`).join('\n      ')}
    </ul>
  </div>
</article>
${
  voisins.length
    ? `<section class="section wrap">
  <div class="section__head section__head--row">
    <h2>${esc(ui.related)}</h2>
    <a href="${lienCat}">${esc(ui.seeCategory)} →</a>
  </div>
  ${grille(ctx, voisins)}
</section>`
    : ''
}`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t.nom,
    description: t.description,
    sku: p.id.toUpperCase(),
    category: cat[lang].nom,
    brand: { '@type': 'Brand', name: marche.nom_boutique },
    offers: {
      '@type': 'Offer',
      price: p.prix_vente.toFixed(2),
      priceCurrency: marche.devise,
      availability: 'https://schema.org/InStock',
    },
  };

  return { titre: `${t.nom} | ${marche.nom_boutique}`, description: t.description, corps, jsonld, actif: cat.id };
}

function pageChoixMarche() {
  const lien = (code) => {
    const m = marches[code];
    return `<a class="universe" href="${code}/index.html"><span class="universe__body"><span class="universe__title">${esc(m.nom_boutique)}</span><span class="universe__intro">${esc(m.slogan)}</span><span class="universe__more">${esc(m.locale)} · ${esc(m.devise)} →</span></span></a>`;
  };
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aperçu boutique</title>
${POLICES}
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<main class="wrap section">
  <div class="section__head">
    <h1>Aperçu de la boutique</h1>
    <p class="muted">Deux versions sont générées à partir du même catalogue. Choisissez un marché, ou ouvrez <a href="apercu.html">apercu.html</a> : toute la boutique dans un seul fichier.</p>
  </div>
  <div class="universes universes--two">
    ${Object.keys(marches).map(lien).join('\n    ')}
  </div>
</main>
</body>
</html>
`;
}

// Toutes les pages de tous les marchés, dans l'ordre : [ctx, vue, chemin du fichier].
function* toutesLesVues(mode) {
  for (const code of Object.keys(marches)) {
    const ui = UI[marches[code].langue];
    const racine = contexte(code, mode, 0);
    const sous = contexte(code, mode, 1);
    yield [racine, vueAccueil(racine), join(code, 'index.html')];
    yield [racine, vueTous(racine), join(code, ui.allFile)];
    for (const c of categories) yield [sous, vueCategorie(sous, c), join(code, ui.categoryDir, `${c[racine.lang].slug}.html`)];
    for (const p of produits) yield [sous, vueProduit(sous, p), join(code, ui.productDir, `${p[racine.lang].slug}.html`)];
  }
}

function construireSite() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  copyFileSync(join(SRC, 'style.css'), join(DIST, 'assets', 'style.css'));
  copyFileSync(join(SRC, 'app.js'), join(DIST, 'assets', 'app.js'));
  if (existsSync(join(SRC, 'images'))) cpSync(join(SRC, 'images'), join(DIST, 'assets', 'images'), { recursive: true });

  ecrire(join(DIST, 'index.html'), pageChoixMarche());
  let nbPages = 1;
  for (const [ctx, vue, chemin] of toutesLesVues('site')) {
    ecrire(join(DIST, chemin), documentHtml(ctx, vue));
    nbPages++;
  }
  return nbPages;
}

// Toute la boutique dans un seul fichier autonome (style et script intégrés), pratique
// sur tablette ou téléphone : chaque page est un écran affiché selon le #nom de l'adresse.
function construireApercu() {
  // L'identifiant d'un écran est l'adresse qui y mène, sans le #.
  const html = [];
  for (const [ctx, vue, chemin] of toutesLesVues('apercu')) {
    const id = idEcran(ctx, chemin);
    html.push(
      `<div class="view" data-view="${id}" data-title="${esc(vue.titre)}" lang="${ctx.lang}" hidden>\n${habillage(ctx, vue)}\n</div>`,
    );
  }
  const style = readFileSync(join(SRC, 'style.css'), 'utf8');
  const script = readFileSync(join(SRC, 'app.js'), 'utf8');
  const routeur = readFileSync(join(SRC, 'apercu.js'), 'utf8');
  const premier = marches[Object.keys(marches)[0]];
  const contenu = `<!doctype html>
<html lang="${premier.langue}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(premier.nom_boutique)}</title>
${POLICES}
<style>
${style}
[hidden] { display: none !important; }
</style>
</head>
<body>
${html.join('\n')}
<div class="toast" role="status" aria-live="polite"></div>
<script>
${script}
${routeur}
</script>
</body>
</html>
`;
  ecrire(join(DIST, 'apercu.html'), contenu);
  return html.length;
}

// Identifiant d'écran déduit du chemin du fichier : fr/produit/x.html → fr-produit-x, fr/index.html → fr.
function idEcran(ctx, chemin) {
  return chemin.replace(/\.html$/, '').replace(/\/index$/, '').split(/[\\/]/).join('-');
}

// ---------------------------------------------------------------------------
// Export Shopify (format CSV d'import produits)
// ---------------------------------------------------------------------------

const csvCellule = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function exporterShopify(code) {
  const marche = marches[code];
  const lang = marche.langue;
  const ui = UI[lang];
  const colonnes = [
    'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
    'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Inventory Tracker', 'Variant Inventory Policy',
    'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping',
    'Variant Taxable', 'Image Src', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
    'Cost per item', 'Status',
  ];
  const lignes = produits.map((p) => {
    const t = p[lang];
    const cat = catById[p.categorie];
    const tags = [cat[lang].nom];
    if (p.vedette != null) tags.push(ui.favoriteBadge);
    if (p.prix_vente <= SEUIL_CADEAUX) tags.push(lang === 'fr' ? 'Idée cadeau' : 'Gift idea');
    const cout = coutMax(p, marche.devise);
    const corps = `<p>${esc(t.description)}</p><ul>${t.points_forts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    const ligne = {
      Handle: t.slug,
      Title: t.nom,
      'Body (HTML)': corps,
      Vendor: marche.nom_boutique,
      Type: cat[lang].nom,
      Tags: tags.join(', '),
      Published: 'FALSE',
      'Option1 Name': 'Title',
      'Option1 Value': 'Default Title',
      'Variant SKU': p.id.toUpperCase(),
      'Variant Inventory Tracker': '',
      'Variant Inventory Policy': 'deny',
      'Variant Fulfillment Service': 'manual',
      'Variant Price': p.prix_vente.toFixed(2),
      'Variant Compare At Price': '',
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Image Src': /^https?:/.test(p.image ?? '') ? p.image : '',
      'Image Alt Text': p.image ? t.nom : '',
      'Gift Card': 'FALSE',
      'SEO Title': `${t.nom} | ${marche.nom_boutique}`,
      'SEO Description': t.description,
      'Cost per item': cout == null ? '' : arrondi2(cout).toFixed(2),
      Status: 'draft',
    };
    return colonnes.map((c) => csvCellule(ligne[c])).join(',');
  });
  const fichier = join(EXPORTS, `shopify-${code}.csv`);
  ecrire(fichier, [colonnes.join(','), ...lignes].join('\n') + '\n');
  return fichier;
}

// ---------------------------------------------------------------------------
// Tableau interne : prix, marges, fournisseurs
// ---------------------------------------------------------------------------

const nbFr = (v, dec = 2) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
const euros = (v) => `${nbFr(v)} €`;
const dollars = (v) => `${nbFr(v)} $`;

function achatBrief(a) {
  if (!a) return '—';
  const sym = a.devise === 'USD' ? '$' : '€';
  const n = (v) => nbFr(v, Number.isInteger(v) ? 0 : 2);
  if (a.min === a.max) return `${a.approximatif ? '~' : ''}${n(a.min)} ${sym}`;
  return `${n(a.min)} à ${n(a.max)} ${sym}`;
}

function analyse(p) {
  const cout = coutMax(p, 'EUR');
  const coutUs = coutMax(p, 'USD');
  if (cout == null) return { cout: null };
  const marge = p.prix_vente - cout;
  const coef = p.prix_vente / cout;
  const coefMeilleur = p.prix_vente / (cout * (p.prix_achat.min / p.prix_achat.max));
  const margeTva = p.prix_vente / (1 + meta.tva_fr) - cout;
  const margeUs = p.prix_vente - coutUs;
  return { cout, marge, coef, coefMeilleur, margeTva, margeUs, serree: coef < meta.coef_minimum_conseille };
}

function exporterCatalogueInterne() {
  const fiabilite = (p) =>
    p.a_completer ? 'À compléter' : p.prix_achat?.fiabilite === 'verifie' ? 'Vérifié' : 'Estimation';

  const analyses = produits.map((p) => ({ p, ...analyse(p) }));
  const chiffres = analyses.filter((x) => x.cout != null);
  const coefMoyen = chiffres.reduce((s, x) => s + x.coef, 0) / chiffres.length;
  const prixMoyen = produits.reduce((s, p) => s + p.prix_vente, 0) / produits.length;
  const serres = chiffres.filter((x) => x.serree).sort((a, b) => a.coef - b.coef);
  const nb = (f) => produits.filter((p) => fiabilite(p) === f).length;

  const out = [];
  out.push('# Catalogue interne : prix, marges et fournisseurs');
  out.push('');
  out.push(`> Document généré par \`node build.mjs\` à partir de \`catalogue.json\` (mise à jour du catalogue : ${meta.mise_a_jour}). Ne pas modifier à la main : modifier le JSON puis relancer le script.`);
  out.push('');
  out.push('## Hypothèses de calcul');
  out.push('');
  out.push(`- **Coût retenu** : le haut de la fourchette du prix d'achat (scénario prudent), **hors livraison**.`);
  out.push(`- **Taux de change** : 1 $ = ${nbFr(meta.taux_usd_vers_eur)} € (à mettre à jour dans \`catalogue.json\` → \`meta.taux_usd_vers_eur\`).`);
  out.push(`- **Marge brute** : prix de vente − coût. **Coef.** : prix de vente ÷ coût, au haut puis au bas de la fourchette d'achat (« pire → meilleur »).`);
  out.push(`- **Marge après TVA** : marge si la boutique facture la TVA française (${nbFr(meta.tva_fr * 100, 0)} %), c'est-à-dire prix ÷ ${nbFr(1 + meta.tva_fr, 1)} − coût.`);
  out.push(`- **Marge US** : même prix affiché en dollars, coût converti en dollars (la sales tax US s'ajoute au prix, elle ne le réduit pas).`);
  out.push(`- ⚠ = coefficient inférieur à ${nbFr(meta.coef_minimum_conseille, 1)} : il reste peu de place pour la livraison, la publicité et les frais de paiement.`);
  out.push('');
  out.push('## Synthèse');
  out.push('');
  out.push(`| Indicateur | Valeur |`);
  out.push(`|---|---|`);
  out.push(`| Produits au catalogue | ${produits.length} |`);
  out.push(`| Prix d'achat vérifiés / estimés / à compléter | ${nb('Vérifié')} / ${nb('Estimation')} / ${nb('À compléter')} |`);
  out.push(`| Prix de vente moyen | ${euros(prixMoyen)} |`);
  out.push(`| Coefficient moyen (pire cas) | ${nbFr(coefMoyen, 1)} |`);
  out.push(`| Produits à marge serrée (⚠) | ${serres.length} |`);
  out.push('');
  if (serres.length) {
    out.push('Produits à marge serrée, du plus serré au moins serré :');
    out.push('');
    for (const x of serres) {
      out.push(`- **${x.p.fr.nom}** : coef. ${nbFr(x.coef)}${x.coefMeilleur - x.coef > 0.005 ? ` (${nbFr(x.coefMeilleur)} au prix bas)` : ''}, coût jusqu'à ${euros(x.cout)} pour ${euros(x.p.prix_vente)} (${fiabilite(x.p).toLowerCase()})`);
    }
    out.push('');
  }
  out.push('## Produits vedettes (page d’accueil)');
  out.push('');
  for (const p of vedettes()) out.push(`${p.vedette}. ${p.fr.nom} (${euros(p.prix_vente)})`);
  out.push('');

  for (const c of categories) {
    out.push(`## ${c.fr.nom}`);
    out.push('');
    out.push('| Produit | Achat (brief) | Fiabilité | Vente | Coût max | Marge brute | Coef. (pire → meilleur) | Marge après TVA | Marge US |');
    out.push('|---|---|---|---:|---:|---:|---:|---:|---:|');
    for (const x of analyses.filter((a) => a.p.categorie === c.id)) {
      const p = x.p;
      const vente = `${euros(p.prix_vente)}${p.prix_vente_a_valider ? ' (à valider)' : ''}`;
      const cells =
        x.cout == null
          ? ['—', '—', '—', '—', '—']
          : [euros(x.cout), euros(x.marge), `${nbFr(x.coef)}${x.coefMeilleur - x.coef > 0.005 ? ` → ${nbFr(x.coefMeilleur)}` : ''}${x.serree ? ' ⚠' : ''}`, euros(x.margeTva), dollars(x.margeUs)];
      out.push(`| ${p.vedette != null ? '★ ' : ''}${p.fr.nom} | ${achatBrief(p.prix_achat)} | ${fiabilite(p)} | ${vente} | ${cells.join(' | ')} |`);
    }
    out.push('');
  }

  out.push('## Fournisseurs');
  out.push('');
  out.push('« Fiche » = page d’un produit précis. « Recherche » ou « Catégorie » = page de résultats : il faut encore choisir une annonce précise (avis, délais, entrepôt US/UE) avant de mettre le produit en ligne.');
  out.push('');
  const libelleType = { fiche: 'Fiche', recherche: 'Recherche', categorie: 'Catégorie' };
  for (const p of produits) {
    out.push(`- **${p.fr.nom}**`);
    if (!p.fournisseurs?.length) out.push('  - _Aucun fournisseur renseigné_');
    for (const f of p.fournisseurs ?? []) out.push(`  - ${f.nom} (${libelleType[f.type] ?? f.type}) : ${f.url}`);
  }
  out.push('');

  out.push('## À compléter ou vérifier');
  out.push('');
  for (const p of produits) {
    const points = [];
    if (p.a_completer) points.push('fiche incomplète');
    if (p.prix_vente_a_valider) points.push('prix de vente à valider');
    if (!p.prix_achat) points.push("prix d'achat manquant");
    else if (p.prix_achat.fiabilite === 'estimation') points.push("prix d'achat estimé, à vérifier chez le fournisseur");
    if (!(p.fournisseurs ?? []).some((f) => f.type === 'fiche')) points.push('pas encore de fiche fournisseur précise');
    if (!p.image) points.push('photo manquante');
    if (points.length) out.push(`- **${p.fr.nom}** : ${points.join(' ; ')}.${p.notes ? ` _${p.notes}_` : ''}`);
  }
  out.push('');

  const fichier = join(EXPORTS, 'catalogue-interne.md');
  ecrire(fichier, out.join('\n'));
  return { fichier, serres, coefMoyen };
}

// ---------------------------------------------------------------------------

valider();
const nbPages = construireSite();
const nbEcrans = construireApercu();
const csv = Object.keys(marches).map(exporterShopify);
const interne = exporterCatalogueInterne();

const aCompleter = produits.filter((p) => p.a_completer).map((p) => p.fr.nom);
console.log(`Catalogue : ${produits.length} produits, ${categories.length} catégories, ${vedettes().length} vedettes.`);
console.log(`Site : ${nbPages} pages générées dans dist/ (ouvrir dist/index.html), et dist/apercu.html (${nbEcrans} écrans dans un seul fichier).`);
console.log(`Exports : ${[...csv, interne.fichier].map((f) => f.replace(ROOT + '/', '')).join(', ')}`);
console.log(`Coefficient moyen (pire cas) : ${nbFr(interne.coefMoyen, 1)} ; marges serrées : ${interne.serres.length}.`);
if (aCompleter.length) console.log(`À compléter : ${aCompleter.join(', ')}.`);
