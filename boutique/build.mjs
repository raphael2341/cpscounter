#!/usr/bin/env node
// Génère, à partir de catalogue.json :
//   dist/fr/…, dist/us/…            site vitrine statique (accueil, guide cadeaux, catégories, fiches produits)
//   dist/apercu.html                la même boutique dans un seul fichier autonome (tablette, téléphone)
//   exports/shopify-fr.csv, -us     fichiers d'import produits Shopify (brouillons)
//   exports/catalogue-interne.md    tableau des prix, marges et fournisseurs (usage interne)
//   exports/produits-et-liens.html  liste des produits avec leurs liens (base du Google Doc)
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

// Prix de vente d'un produit sur un marché : même chiffre partout, sauf si le produit porte un prix_vente_<marché>.
const prixVente = (p, code) => p[`prix_vente_${code}`] ?? p.prix_vente;

// Tranches de prix du guide cadeaux : jusqu'à 25, de 25 à 50, plus de 50 (dans la devise du marché).
const BUDGETS = [
  { n: 1, min: 0, max: 25 },
  { n: 2, min: 25, max: 50 },
  { n: 3, min: 50, max: Infinity },
];
const budgetDe = (prix) => BUDGETS.find((b) => prix > b.min && prix <= b.max);

// ---------------------------------------------------------------------------
// Textes d'interface par langue
// ---------------------------------------------------------------------------

const UI = {
  fr: {
    home: 'Accueil',
    allProducts: 'Tout le catalogue',
    allFile: 'tous-les-produits.html',
    giftsFile: 'idees-cadeaux.html',
    categoryDir: 'categorie',
    productDir: 'produit',
    favoritesId: 'coups-de-coeur',
    script: 'Joyeux Noël',
    favorites: 'Nos coups de cœur de Noël',
    favoritesIntro: 'Les cinq cadeaux qui font le plus plaisir cet hiver.',
    favoriteBadge: 'Coup de cœur',
    newBadge: 'Nouveau',
    newTitle: 'Nouveautés des fêtes',
    newIntro: 'Lumières, sapin de table et petites attentions, tout juste arrivés.',
    universes: 'Nos univers',
    giftsNav: 'Idées cadeaux',
    giftsScript: 'Le guide cadeaux',
    giftsTitle: 'Un cadeau pour chaque budget',
    giftsIntro: 'Des petites attentions aux grands cadeaux, classés par prix.',
    giftsPageTitle: 'Idées cadeaux de Noël',
    budget: (b, m) =>
      b.n === 1 ? `Jusqu'à ${m(b.max)}` : b.n === 2 ? `De ${m(b.min)} à ${m(b.max)}` : `Plus de ${m(b.min)}`,
    budgetCount: (n) => `${n} idée${n > 1 ? 's' : ''}`,
    moodTitle: 'Une maison qui sent bon Noël',
    moodText: 'Lumières douces, textiles moelleux et petites attentions : composez votre cocon pour les fêtes.',
    from: (prix) => `dès ${prix}`,
    seeGifts: 'Voir les idées cadeaux',
    seeFavorites: 'Nos coups de cœur',
    seeAll: 'Voir tout le catalogue',
    seeCategory: 'Voir la sélection',
    count: (n) => `${n} produit${n > 1 ? 's' : ''}`,
    addToCart: 'Ajouter au panier',
    cartPreview: "Aperçu : le paiement sera activé à l'ouverture de la boutique.",
    highlights: 'Points forts',
    related: 'Dans la même catégorie',
    photoSoon: 'Photo à venir',
    moodPhoto: "Photo d'ambiance",
    breadcrumb: "Fil d'Ariane",
    nav: 'Catégories',
    countdown: 'Noël dans {n} jours',
    countdownOne: "Noël, c'est demain",
    otherMarket: 'Version US ($)',
    footerNote: 'Boutique en préparation : contenus, photos et prix susceptibles d’évoluer.',
  },
  en: {
    home: 'Home',
    allProducts: 'Shop all',
    allFile: 'all-products.html',
    giftsFile: 'gift-guide.html',
    categoryDir: 'collections',
    productDir: 'products',
    favoritesId: 'favorites',
    script: 'Merry Christmas',
    favorites: 'Our Christmas favorites',
    favoritesIntro: 'The five gifts people love most this winter.',
    favoriteBadge: 'Favorite',
    newBadge: 'New',
    newTitle: 'New for the holidays',
    newIntro: 'Lights, a tabletop tree and little treats, just in.',
    universes: 'Shop by category',
    giftsNav: 'Gift ideas',
    giftsScript: 'The gift guide',
    giftsTitle: 'A gift for every budget',
    giftsIntro: 'From stocking stuffers to big presents, sorted by price.',
    giftsPageTitle: 'Christmas gift ideas',
    budget: (b, m) =>
      b.n === 1 ? `Up to ${m(b.max)}` : b.n === 2 ? `${m(b.min)} to ${m(b.max)}` : `Over ${m(b.min)}`,
    budgetCount: (n) => `${n} idea${n > 1 ? 's' : ''}`,
    moodTitle: 'A home that feels like Christmas',
    moodText: 'Soft lights, plush textiles and thoughtful little things: build your cozy nest for the holidays.',
    from: (prix) => `from ${prix}`,
    seeGifts: 'See gift ideas',
    seeFavorites: 'Our favorites',
    seeAll: 'Shop all products',
    seeCategory: 'Shop now',
    count: (n) => `${n} product${n > 1 ? 's' : ''}`,
    addToCart: 'Add to cart',
    cartPreview: 'Preview only: checkout will be enabled when the store opens.',
    highlights: 'Highlights',
    related: 'More from this category',
    photoSoon: 'Photo coming soon',
    moodPhoto: 'Mood photo',
    breadcrumb: 'Breadcrumb',
    nav: 'Categories',
    countdown: '{n} days until Christmas',
    countdownOne: 'Christmas is tomorrow',
    otherMarket: 'Version française (€)',
    footerNote: 'Store in preparation: content, photos and prices may change.',
  },
};

// Icônes au trait (24×24). Celles de catégorie servent de visuel quand un produit n'a pas de photo.
const ICONES = {
  plaid:
    '<path d="M4 6.5h13a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H4z"/><path d="M4 12.5h14a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 18 17.5H4z"/><path d="M8 6.5v11M12 6.5v11"/>',
  chaleur:
    '<path d="M8 4.5c-1.6 2 1.6 3.5 0 5.5s1.6 3.5 0 5.5"/><path d="M12 4.5c-1.6 2 1.6 3.5 0 5.5s1.6 3.5 0 5.5"/><path d="M16 4.5c-1.6 2 1.6 3.5 0 5.5s1.6 3.5 0 5.5"/><path d="M5 19.5h14"/>',
  tasse:
    '<path d="M5 10h11v4.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8.5 3.5c-.9 1.1.9 2.1 0 3.2M12.5 3.5c-.9 1.1.9 2.1 0 3.2"/>',
  flamme:
    '<path d="M12 3c1.6 2.6 5 4.8 5 9a5 5 0 0 1-10 0c0-2.3 1.2-3.9 2.6-5.1.1 1.6.9 2.7 2.1 3.1C11.2 7.6 11 5.3 12 3z"/><path d="M7.5 21h9"/>',
  sapin: '<path d="M12 3l4 5h-2.2l3.7 4.6h-2.3L19 17H5l3.8-4.4H6.5L10.2 8H8z"/><path d="M12 17v4"/>',
  etoile: '<path d="M12 2.5l1.9 6.1 6.1 1.9-6.1 1.9L12 18.5l-1.9-6.1L4 10.5l6.1-1.9z"/><path d="M19 17.5v3M17.5 19h3"/>',
  cadeau:
    '<path d="M4 11h16v9H4z"/><path d="M3 7.5h18V11H3z"/><path d="M12 7.5V20"/><path d="M12 7.5c-1-2.2-2.6-3.5-4-3.2-1.5.4-1.5 2.4.2 3.2"/><path d="M12 7.5c1-2.2 2.6-3.5 4-3.2 1.5.4 1.5 2.4-.2 3.2"/>',
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
};

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
const nouveautes = () => produits.filter((p) => p.nouveau);
const produitsDe = (catId) => produits.filter((p) => p.categorie === catId);

function ecrire(chemin, contenu) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, contenu);
}

// Photos locales (dossier src/) : clé → chemin. La clé donne la classe CSS « ph-<clé> ».
const PHOTOS = {};
function declarerPhoto(cle, chemin) {
  if (chemin && !/^https?:/.test(chemin) && existsSync(join(SRC, chemin))) PHOTOS[cle] = chemin;
}
for (const p of produits) declarerPhoto(p.id, p.image);
for (const c of categories) declarerPhoto(`cat-${c.id}`, c.image);
for (const cle of ['hero', 'cadeaux', 'ambiance']) declarerPhoto(cle, `images/${cle}.webp`);

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
  const rangs = new Set();
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
      if (rangs.has(p.vedette)) erreurs.push(`${ref} : rang de vedette ${p.vedette} déjà utilisé`);
      rangs.add(p.vedette);
    }
    if (p.image && !/^https?:/.test(p.image) && !existsSync(join(SRC, p.image))) erreurs.push(`${ref} : image introuvable src/${p.image}`);
    const a = p.prix_achat;
    if (a != null) {
      if (!['USD', 'EUR'].includes(a.devise)) erreurs.push(`${ref} : devise d'achat inconnue « ${a.devise} »`);
      if (!['verifie', 'estimation'].includes(a.fiabilite)) erreurs.push(`${ref} : fiabilité inconnue « ${a.fiabilite} »`);
      if (!(a.min > 0 && a.max >= a.min)) erreurs.push(`${ref} : fourchette de prix d'achat invalide`);
      // Règle de marge : même au prix d'achat le plus haut, le prix de vente fait au moins « coef_minimum » fois le coût.
      for (const [code, m] of Object.entries(marches)) {
        const cout = coutMax(p, m.devise);
        const coef = prixVente(p, code) / cout;
        if (coef < meta.coef_minimum) {
          const champ = p[`prix_vente_${code}`] != null || code !== Object.keys(marches)[0] ? `prix_vente_${code}` : 'prix_vente';
          erreurs.push(`${ref} : coefficient ${coef.toFixed(2)} sur le marché « ${code} », sous le minimum de ${meta.coef_minimum}. Porter ${champ} à ${Math.ceil(cout * meta.coef_minimum)} au moins.`);
        }
      }
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
// Site vitrine : briques communes
// ---------------------------------------------------------------------------

function icone(nom, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nom]}</svg>`;
}

// Une photo est un bloc dont l'image vient de la classe « ph-<clé> » (voir cssPhotos).
function photo(cle, alt = '', cls = '') {
  const a11y = alt ? `role="img" aria-label="${esc(alt)}"` : 'aria-hidden="true"';
  return `<span class="photo ph-${cle} ${cls}" ${a11y}></span>`;
}

// Adresses des pages. Mode « site » : fichiers HTML séparés. Mode « apercu » : un seul
// fichier où chaque page est un écran, désigné par un #nom (fr-produit-…, us-products-…).
function liens(code, mode, base = '') {
  const lang = marches[code].langue;
  const ui = UI[lang];
  const autre = Object.keys(marches).find((k) => k !== code) ?? code;
  const nom = (fichier) => fichier.replace(/\.html$/, '');
  if (mode === 'apercu') {
    return {
      accueil: () => `#${code}`,
      tous: () => `#${code}-${nom(ui.allFile)}`,
      cadeaux: (n) => `#${code}-${nom(ui.giftsFile)}${n ? `--budget-${n}` : ''}`,
      categorie: (c) => `#${code}-${ui.categoryDir}-${c[lang].slug}`,
      produit: (p) => `#${code}-${ui.productDir}-${p[lang].slug}`,
      autreMarche: () => `#${autre}`,
    };
  }
  return {
    accueil: () => `${base}index.html`,
    tous: () => `${base}${ui.allFile}`,
    cadeaux: (n) => `${base}${ui.giftsFile}${n ? `#budget-${n}` : ''}`,
    categorie: (c) => `${base}${ui.categoryDir}/${c[lang].slug}.html`,
    produit: (p) => `${base}${ui.productDir}/${p[lang].slug}.html`,
    autreMarche: () => `${base}../${autre}/index.html`,
  };
}

function contexte(code, mode, profondeur = 0) {
  const marche = marches[code];
  const lang = marche.langue;
  const base = '../'.repeat(profondeur);
  const pv = (p) => prixVente(p, code);
  return {
    code,
    marche,
    lang,
    ui: UI[lang],
    pv, // prix de vente d'un produit sur ce marché
    prix: (v) => monnaie(marche, v), // mise en forme d'un montant
    prixMini: Math.min(...produits.map(pv)),
    budget: (p) => budgetDe(pv(p)),
    href: liens(code, mode, base),
    assets: mode === 'apercu' ? 'assets/' : `${base}../assets/`,
  };
}

function badges(ctx, p) {
  const liste = [];
  if (p.vedette != null) liste.push(`<span class="badge badge--fav">${esc(ctx.ui.favoriteBadge)}</span>`);
  if (p.nouveau) liste.push(`<span class="badge badge--new">${esc(ctx.ui.newBadge)}</span>`);
  return liste.length ? `<span class="badges">${liste.join('')}</span>` : '';
}

function visuel(ctx, p, { classe = '', legende = false } = {}) {
  const cat = catById[p.categorie];
  const t = p[ctx.lang];
  let media;
  let etiquette = '';
  if (PHOTOS[p.id]) {
    media = photo(p.id, t.nom);
    if (legende && p.image_ambiance) etiquette = ctx.ui.moodPhoto;
  } else if (/^https?:/.test(p.image ?? '')) {
    media = `<img src="${esc(p.image)}" alt="${esc(t.nom)}" loading="lazy">`;
  } else {
    media = icone(cat.icone, 'visual__icon');
    if (legende) etiquette = ctx.ui.photoSoon;
  }
  return `<span class="visual visual--${cat.id} ${classe}">${media}${badges(ctx, p)}${
    etiquette ? `<span class="visual__label">${esc(etiquette)}</span>` : ''
  }</span>`;
}

function carte(ctx, p) {
  const t = p[ctx.lang];
  const cat = catById[p.categorie];
  return `<a class="card" href="${ctx.href.produit(p)}">
  ${visuel(ctx, p)}
  <span class="card__body">
    <span class="card__cat">${esc(cat[ctx.lang].nom)}</span>
    <span class="card__title">${esc(t.nom)}</span>
    <span class="card__price">${ctx.prix(ctx.pv(p))}</span>
  </span>
</a>`;
}

const grille = (ctx, liste, cls = '') => `<div class="grid ${cls}">${liste.map((p) => carte(ctx, p)).join('\n')}</div>`;

// Bandeau d'annonce, en-tête, contenu et pied de page d'une page (sans la balise <html>).
function habillage(ctx, { corps, actif }) {
  const { ui, marche, lang, href } = ctx;
  const lienCat = (c, court = false) =>
    `<a href="${href.categorie(c)}"${actif === c.id ? ' aria-current="page"' : ''}>${esc((court && c[lang].nom_court) || c[lang].nom)}</a>`;
  const annonce = marche.bandeau.replace('{prix}', ctx.prix(ctx.prixMini));
  return `<p class="promo"><span class="wrap promo__inner">${icone('etoile', 'promo__icon')}<span>${esc(annonce)}</span><span class="promo__count" data-noel="${esc(ui.countdown)}" data-noel-1="${esc(ui.countdownOne)}"></span></span></p>
<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="brand" href="${href.accueil()}">${icone('etoile', 'brand__mark')}<span>${esc(marche.nom_boutique)}</span></a>
    <nav class="site-nav" aria-label="${esc(ui.nav)}">
      <a class="site-nav__gift" href="${href.cadeaux()}"${actif === 'cadeaux' ? ' aria-current="page"' : ''}>${icone('cadeau', 'site-nav__icon')}${esc(ui.giftsNav)}</a>
      ${categories.map((c) => lienCat(c, true)).join('\n      ')}
      <a href="${href.tous()}"${actif === 'tous' ? ' aria-current="page"' : ''}>${esc(ui.allProducts)}</a>
    </nav>
  </div>
</header>
<div class="garland" aria-hidden="true"><span></span><span></span></div>
<main>
${corps}
</main>
<footer class="site-footer">
  <div class="wrap site-footer__inner">
    <div>
      <p class="brand brand--footer">${icone('etoile', 'brand__mark')}<span>${esc(marche.nom_boutique)}</span></p>
      <p class="site-footer__slogan">${esc(marche.slogan)}</p>
    </div>
    <ul class="footer-links">
      <li><a href="${href.cadeaux()}">${esc(ui.giftsNav)}</a></li>
      ${categories.map((c) => `<li>${lienCat(c)}</li>`).join('\n      ')}
    </ul>
    <div class="footer-meta">
      <p>${esc(ui.footerNote)}</p>
      <p><a href="${href.autreMarche()}">${esc(ui.otherMarket)}</a></p>
    </div>
  </div>
</footer>`;
}

const POLICES =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Gloock&family=Sacramento&display=swap">';

function documentHtml(ctx, vue) {
  const { titre, description, jsonld } = vue;
  return `<!doctype html>
<html lang="${ctx.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titre)}</title>
<meta name="description" content="${esc(description)}">
${POLICES}
<link rel="stylesheet" href="${ctx.assets}style.css">
<link rel="stylesheet" href="${ctx.assets}photos.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>\n` : ''}</head>
<body>
${habillage(ctx, vue)}
<div class="toast" role="status" aria-live="polite"></div>
<script src="${ctx.assets}app.js" defer></script>
</body>
</html>
`;
}

function filAriane(ctx, elements, cls = '') {
  const items = elements
    .map(([libelle, href]) => (href ? `<li><a href="${href}">${esc(libelle)}</a></li>` : `<li aria-current="page">${esc(libelle)}</li>`))
    .join('');
  return `<nav class="crumbs ${cls}" aria-label="${esc(ctx.ui.breadcrumb)}"><ol>${items}</ol></nav>`;
}

// En-tête de page sur fond de photo (catégories, guide cadeaux).
function banniere(ctx, { cle, fil, titre, intro, note, script }) {
  return `<header class="banner">
  ${PHOTOS[cle] ? photo(cle, '', 'banner__photo') : ''}
  <div class="wrap banner__inner">
    ${filAriane(ctx, fil, 'crumbs--light')}
    ${script ? `<p class="script">${esc(script)}</p>` : ''}
    <h1>${esc(titre)}</h1>
    ${intro ? `<p class="banner__intro">${esc(intro)}</p>` : ''}
    ${note ? `<p class="banner__note">${esc(note)}</p>` : ''}
  </div>
</header>`;
}

// ---------------------------------------------------------------------------
// Site vitrine : pages. Chaque fonction « vue… » renvoie { titre, description, corps, jsonld?, actif? }.
// ---------------------------------------------------------------------------

function vueAccueil(ctx) {
  const { ui, marche, lang, href } = ctx;

  const budgets = BUDGETS.map((b) => {
    const n = produits.filter((p) => ctx.budget(p) === b).length;
    return `<a class="budget" href="${href.cadeaux(b.n)}">
        <span class="budget__label">${esc(ui.budget(b, ctx.prix))}</span>
        <span class="budget__count">${esc(ui.budgetCount(n))} →</span>
      </a>`;
  }).join('\n      ');

  const univers = categories
    .map((c) => {
      const n = produitsDe(c.id).length;
      return `<a class="tile" href="${href.categorie(c)}">
      ${PHOTOS[`cat-${c.id}`] ? photo(`cat-${c.id}`) : `<span class="visual visual--${c.id}">${icone(c.icone, 'visual__icon')}</span>`}
      <span class="tile__body">
        <span class="tile__title">${esc(c[lang].nom)}</span>
        <span class="tile__meta">${esc(ui.count(n))}</span>
      </span>
    </a>`;
    })
    .join('\n    ');

  const corps = `<section class="hero">
  <canvas class="snow" aria-hidden="true"></canvas>
  <div class="wrap hero__inner">
    <div class="hero__text">
      <p class="script">${esc(ui.script)}</p>
      <h1>${esc(marche.hero_titre)}</h1>
      <p class="hero__lede">${esc(marche.hero_texte)}</p>
      <div class="actions">
        <a class="btn" href="${href.cadeaux()}">${icone('cadeau', 'btn__icon')}${esc(ui.seeGifts)}</a>
        <a class="btn btn--ghost-light" href="#${ui.favoritesId}">${esc(ui.seeFavorites)}</a>
      </div>
    </div>
    <div class="hero__art">
      <div class="arch">${PHOTOS.hero ? photo('hero', '', 'arch__photo') : ''}</div>
      <p class="sticker"><span>${esc(ui.from(ctx.prix(ctx.prixMini)))}</span></p>
    </div>
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
  ${grille(ctx, vedettes(), 'grid--feature')}
</section>

<section class="giftband">
  ${PHOTOS.cadeaux ? photo('cadeaux', '', 'giftband__photo') : ''}
  <div class="wrap giftband__inner">
    <p class="script">${esc(ui.giftsScript)}</p>
    <h2>${esc(ui.giftsTitle)}</h2>
    <p class="giftband__intro">${esc(ui.giftsIntro)}</p>
    <div class="budgets">
      ${budgets}
    </div>
  </div>
</section>

<section class="section wrap">
  <div class="section__head"><h2>${esc(ui.universes)}</h2></div>
  <div class="tiles">
    ${univers}
  </div>
</section>

<section class="section section--tinted">
  <div class="wrap">
    <div class="section__head section__head--row">
      <div>
        <h2>${esc(ui.newTitle)}</h2>
        <p class="muted">${esc(ui.newIntro)}</p>
      </div>
      <a href="${href.tous()}">${esc(ui.seeAll)} →</a>
    </div>
    ${grille(ctx, nouveautes())}
  </div>
</section>

<section class="mood">
  ${PHOTOS.ambiance ? photo('ambiance', '', 'mood__photo') : ''}
  <div class="wrap mood__inner">
    <h2>${esc(ui.moodTitle)}</h2>
    <p>${esc(ui.moodText)}</p>
    <a class="btn btn--snow" href="${href.tous()}">${esc(ui.seeAll)}</a>
  </div>
</section>`;

  return { titre: `${marche.nom_boutique} | ${marche.slogan}`, description: marche.hero_texte, corps };
}

function vueCadeaux(ctx) {
  const { ui, href } = ctx;
  const sections = BUDGETS.map((b) => {
    const liste = produits.filter((p) => ctx.budget(p) === b).sort((a, z) => ctx.pv(a) - ctx.pv(z));
    return `<section class="section section--flush wrap" id="budget-${b.n}">
  <div class="section__head section__head--row">
    <h2>${esc(ui.budget(b, ctx.prix))}</h2>
    <span class="muted">${esc(ui.budgetCount(liste.length))}</span>
  </div>
  ${grille(ctx, liste)}
</section>`;
  }).join('\n');
  const corps = `${banniere(ctx, {
    cle: 'cadeaux',
    fil: [[ui.home, href.accueil()], [ui.giftsNav]],
    script: ui.giftsScript,
    titre: ui.giftsPageTitle,
    intro: ui.giftsIntro,
  })}
<nav class="chips wrap" aria-label="${esc(ui.giftsTitle)}">
  ${BUDGETS.map((b) => `<a class="chip" href="${href.cadeaux(b.n)}">${esc(ui.budget(b, ctx.prix))}</a>`).join('\n  ')}
</nav>
${sections}`;
  return { titre: `${ui.giftsPageTitle} | ${ctx.marche.nom_boutique}`, description: ui.giftsIntro, corps, actif: 'cadeaux' };
}

function vueCategorie(ctx, c) {
  const { ui, lang, href } = ctx;
  const liste = produitsDe(c.id);
  const corps = `${banniere(ctx, {
    cle: `cat-${c.id}`,
    fil: [[ui.home, href.accueil()], [c[lang].nom]],
    titre: c[lang].nom,
    intro: c[lang].intro,
    note: ui.count(liste.length),
  })}
<section class="section section--after-banner wrap">
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
  const corps = `<div class="wrap">${filAriane(ctx, [[ui.home, href.accueil()], [ui.allProducts]])}</div>
<header class="page-head wrap">
  <h1>${esc(ui.allProducts)}</h1>
  <p class="muted">${esc(ui.count(produits.length))}</p>
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
  const budget = ctx.budget(p);

  const corps = `<div class="wrap">${filAriane(ctx, [[ui.home, href.accueil()], [cat[lang].nom, lienCat], [t.nom]])}</div>
<article class="product wrap">
  <div class="product__media">${visuel(ctx, p, { classe: 'visual--large', legende: true })}</div>
  <div class="product__info">
    <a class="product__cat" href="${lienCat}">${esc(cat[lang].nom)}</a>
    <h1>${esc(t.nom)}</h1>
    <p class="product__price">${ctx.prix(ctx.pv(p))}</p>
    <p class="product__desc">${esc(t.description)}</p>
    <h2 class="product__subtitle">${esc(ui.highlights)}</h2>
    <ul class="checks">
      ${t.points_forts.map((x) => `<li>${icone('check', 'checks__icon')}${esc(x)}</li>`).join('\n      ')}
    </ul>
    <button class="btn btn--block" type="button" data-add-to-cart data-message="${esc(ui.cartPreview)}">${esc(ui.addToCart)}</button>
    <a class="giftline" href="${href.cadeaux(budget.n)}">${icone('cadeau', 'giftline__icon')}<span>${esc(ui.giftsNav)} · ${esc(ui.budget(budget, ctx.prix))}</span><span aria-hidden="true">→</span></a>
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
      price: ctx.pv(p).toFixed(2),
      priceCurrency: marche.devise,
      availability: 'https://schema.org/InStock',
    },
  };

  return { titre: `${t.nom} | ${marche.nom_boutique}`, description: t.description, corps, jsonld, actif: cat.id };
}

function pageChoixMarche() {
  const lien = (code) => {
    const m = marches[code];
    return `<a class="budget budget--plain" href="${code}/index.html"><span class="budget__label">${esc(m.nom_boutique)}</span><span class="budget__count">${esc(m.slogan)} · ${esc(m.devise)} →</span></a>`;
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
  <div class="budgets">
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
    yield [racine, vueCadeaux(racine), join(code, ui.giftsFile)];
    yield [racine, vueTous(racine), join(code, ui.allFile)];
    for (const c of categories) yield [sous, vueCategorie(sous, c), join(code, ui.categoryDir, `${c[racine.lang].slug}.html`)];
    for (const p of produits) yield [sous, vueProduit(sous, p), join(code, ui.productDir, `${p[racine.lang].slug}.html`)];
  }
}

// Feuille de style des photos. « integre » : images incluses dans le fichier (aperçu autonome).
function cssPhotos(integre) {
  return Object.entries(PHOTOS)
    .map(([cle, chemin]) => {
      const type = chemin.split('.').pop().replace('jpg', 'jpeg');
      const url = integre ? `data:image/${type};base64,${readFileSync(join(SRC, chemin)).toString('base64')}` : chemin;
      return `.ph-${cle}{background-image:url("${url}")}`;
    })
    .join('\n');
}

function construireSite() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  copyFileSync(join(SRC, 'style.css'), join(DIST, 'assets', 'style.css'));
  copyFileSync(join(SRC, 'app.js'), join(DIST, 'assets', 'app.js'));
  writeFileSync(join(DIST, 'assets', 'photos.css'), cssPhotos(false) + '\n');
  if (existsSync(join(SRC, 'images'))) {
    cpSync(join(SRC, 'images'), join(DIST, 'assets', 'images'), { recursive: true, filter: (f) => !f.endsWith('.json') });
  }

  ecrire(join(DIST, 'index.html'), pageChoixMarche());
  let nbPages = 1;
  for (const [ctx, vue, chemin] of toutesLesVues('site')) {
    ecrire(join(DIST, chemin), documentHtml(ctx, vue));
    nbPages++;
  }
  return nbPages;
}

// Identifiant d'écran déduit du chemin du fichier : fr/produit/x.html → fr-produit-x, fr/index.html → fr.
const idEcran = (chemin) => chemin.replace(/\.html$/, '').replace(/[\\/]index$/, '').split(/[\\/]/).join('-');

// Toute la boutique dans un seul fichier autonome (style, script et photos intégrés), pratique
// sur tablette ou téléphone : chaque page est un écran affiché selon le #nom de l'adresse.
function construireApercu() {
  const ecrans = [];
  for (const [ctx, vue, chemin] of toutesLesVues('apercu')) {
    ecrans.push(
      `<div class="view" data-view="${idEcran(chemin)}" data-title="${esc(vue.titre)}" lang="${ctx.lang}" hidden>\n${habillage(ctx, vue)}\n</div>`,
    );
  }
  const lire = (f) => readFileSync(join(SRC, f), 'utf8');
  const premier = marches[Object.keys(marches)[0]];
  const contenu = `<!doctype html>
<html lang="${premier.langue}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(premier.nom_boutique)}</title>
${POLICES}
<style>
${lire('style.css')}
[hidden] { display: none !important; }
</style>
<style>
${cssPhotos(true)}
</style>
</head>
<body>
${ecrans.join('\n')}
<div class="toast" role="status" aria-live="polite"></div>
<script>
${lire('app.js')}
${lire('apercu.js')}
</script>
</body>
</html>
`;
  ecrire(join(DIST, 'apercu.html'), contenu);
  return ecrans.length;
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
  const prix = (v) => monnaie(marche, v).replace(/[\u00a0\u202f]/g, ' ');
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
    const vente = prixVente(p, code);
    const tags = [cat[lang].nom, `${ui.giftsNav} : ${ui.budget(budgetDe(vente), prix).toLowerCase()}`];
    if (p.vedette != null) tags.push(ui.favoriteBadge);
    if (p.nouveau) tags.push(ui.newBadge);
    const cout = coutMax(p, marche.devise);
    const corps = `<p>${esc(t.description)}</p><ul>${t.points_forts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    // Les photos d'ambiance ne partent pas dans Shopify : seules les vraies photos produit (URL) sont exportées.
    const distante = /^https?:/.test(p.image ?? '') && !p.image_ambiance;
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
      'Variant Price': vente.toFixed(2),
      'Variant Compare At Price': '',
      'Variant Requires Shipping': 'TRUE',
      'Variant Taxable': 'TRUE',
      'Image Src': distante ? p.image : '',
      'Image Alt Text': distante ? t.nom : '',
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
// Chiffres internes : prix, marges, fournisseurs
// ---------------------------------------------------------------------------

const nbFr = (v, dec = 2) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
const euros = (v, dec = 2) => `${nbFr(v, dec)} €`;
const dollars = (v, dec = 2) => `${nbFr(v, dec)} $`;
const entier = (v) => nbFr(v, Number.isInteger(v) ? 0 : 2);
const X = `x${nbFr(meta.coef_minimum, 0)}`;

function achatBrief(a) {
  if (!a) return '—';
  const sym = a.devise === 'USD' ? '$' : '€';
  if (a.min === a.max) return `${a.approximatif ? '~' : ''}${entier(a.min)} ${sym}`;
  return `${entier(a.min)} à ${entier(a.max)} ${sym}`;
}

const fiabilite = (p) => (!p.prix_achat ? 'À compléter' : p.prix_achat.fiabilite === 'verifie' ? 'Vérifié' : 'Estimation');
const LIBELLE_TYPE = { fiche: 'fiche produit', recherche: 'recherche', categorie: 'catégorie' };

// Chiffres d'un produit pour le marché français (euros), plus le prix et le coefficient US.
function analyse(p) {
  const cout = coutMax(p, 'EUR');
  if (cout == null) return { cout: null };
  const a = p.prix_achat;
  const vente = prixVente(p, 'fr');
  const coef = vente / cout;
  // Prix d'achat à ne pas dépasser pour garder le coefficient minimum, dans la devise du fournisseur.
  const plafondEur = vente / meta.coef_minimum;
  const plafond = a.devise === 'EUR' ? euros(plafondEur) : dollars(plafondEur / meta.taux_usd_vers_eur);
  const venteUs = prixVente(p, 'us');
  return {
    cout,
    vente,
    coef,
    coefMeilleur: vente / (cout * (a.min / a.max)),
    marge: vente - cout,
    margeTva: vente / (1 + meta.tva_fr) - cout,
    plafond,
    venteUs,
    coefUs: venteUs / coutMax(p, 'USD'),
    juste: coef < meta.coef_confort,
  };
}

const coefTexte = (x) => `${nbFr(x.coef)}${x.coefMeilleur - x.coef > 0.005 ? ` → ${nbFr(x.coefMeilleur)}` : ''}`;

function exporterCatalogueInterne() {
  const analyses = produits.map((p) => ({ p, ...analyse(p) }));
  const chiffres = analyses.filter((x) => x.cout != null);
  const coefMoyen = chiffres.reduce((s, x) => s + x.coef, 0) / chiffres.length;
  const coefMini = Math.min(...chiffres.flatMap((x) => [x.coef, x.coefUs]));
  const prixMoyen = produits.reduce((s, p) => s + p.prix_vente, 0) / produits.length;
  const justes = chiffres.filter((x) => x.juste).sort((a, b) => a.coef - b.coef);
  const nb = (f) => produits.filter((p) => fiabilite(p) === f).length;

  const out = [];
  out.push('# Catalogue interne : prix, marges et fournisseurs');
  out.push('');
  out.push(`> Document généré par \`node build.mjs\` à partir de \`catalogue.json\` (mise à jour du catalogue : ${meta.mise_a_jour}). Ne pas modifier à la main : modifier le JSON puis relancer le script.`);
  out.push('');
  out.push('## Règle de marge');
  out.push('');
  out.push(`Chaque produit se vend au moins **${nbFr(meta.coef_minimum, 0)} fois** son prix d'achat, même au prix d'achat le plus haut relevé, en France comme aux US. Le script refuse un catalogue qui ne respecte pas cette règle.`);
  out.push('');
  out.push(`- **Coût retenu** : le haut de la fourchette du prix d'achat, **hors frais de port**.`);
  out.push(`- **Taux de change** : 1 $ = ${nbFr(meta.taux_usd_vers_eur)} € (à mettre à jour dans \`catalogue.json\` → \`meta.taux_usd_vers_eur\`).`);
  out.push(`- **Coef.** : prix de vente ÷ coût, au prix d'achat le plus haut puis le plus bas (« pire → meilleur »).`);
  out.push(`- **Achat max pour ${X}** : le prix d'achat à ne pas dépasser chez le fournisseur.`);
  out.push(`- **Marge après TVA** : marge si la boutique facture la TVA française (${nbFr(meta.tva_fr * 100, 0)} %), c'est-à-dire prix ÷ ${nbFr(1 + meta.tva_fr, 1)} − coût.`);
  out.push(`- **Vente US** : par défaut le même chiffre en dollars. Quand cela ferait passer sous ${X}, le produit a un prix US propre (\`prix_vente_us\`).`);
  out.push(`- ⚠ = coefficient inférieur à ${nbFr(meta.coef_confort, 1)} : la règle est respectée, mais il reste peu de place pour le port, la publicité et les frais de paiement.`);
  out.push('');
  out.push('## Synthèse');
  out.push('');
  out.push('| Indicateur | Valeur |');
  out.push('|---|---|');
  out.push(`| Produits au catalogue | ${produits.length} (dont ${nouveautes().length} nouveautés) |`);
  out.push(`| Prix d'achat vérifiés / estimés | ${nb('Vérifié')} / ${nb('Estimation')} |`);
  out.push(`| Prix de vente moyen | ${euros(prixMoyen)} |`);
  out.push(`| Coefficient le plus bas (pire cas, France et US) | ${nbFr(coefMini)} |`);
  out.push(`| Coefficient moyen (pire cas, France) | ${nbFr(coefMoyen)} |`);
  out.push(`| Produits sous ${nbFr(meta.coef_confort, 1)} en France (⚠) | ${justes.length} |`);
  out.push('');
  out.push('## Produits vedettes (page d’accueil)');
  out.push('');
  for (const p of vedettes()) out.push(`${p.vedette}. ${p.fr.nom} (${euros(p.prix_vente, 0)})`);
  out.push('');

  for (const c of categories) {
    out.push(`## ${c.fr.nom}`);
    out.push('');
    out.push(`| Produit | Achat relevé | Fiabilité | Vente | Coût max | Coef. (pire → meilleur) | Achat max pour ${X} | Marge brute | Marge après TVA | Vente US (coef.) |`);
    out.push('|---|---|---|---:|---:|---:|---:|---:|---:|---:|');
    for (const x of analyses.filter((a) => a.p.categorie === c.id)) {
      const p = x.p;
      const cells =
        x.cout == null
          ? ['—', '—', '—', '—', '—', '—']
          : [euros(x.cout), `${coefTexte(x)}${x.juste ? ' ⚠' : ''}`, x.plafond, euros(x.marge), euros(x.margeTva), `${dollars(x.venteUs, 0)} (${nbFr(x.coefUs)})`];
      const marques = `${p.vedette != null ? '★ ' : ''}${p.nouveau ? '(nouveau) ' : ''}`;
      out.push(`| ${marques}${p.fr.nom} | ${achatBrief(p.prix_achat)} | ${fiabilite(p)} | ${euros(p.prix_vente, 0)} | ${cells.join(' | ')} |`);
    }
    out.push('');
  }
  out.push('★ = coup de cœur de la page d’accueil.');
  out.push('');

  out.push('## Fournisseurs');
  out.push('');
  out.push('« Fiche produit » = page d’un article précis. « Recherche » ou « catégorie » = page de résultats : il faut encore choisir une annonce précise (avis, délais, entrepôt US/UE) dont le prix reste sous l’achat maximum.');
  out.push('');
  for (const p of produits) {
    out.push(`- **${p.fr.nom}**`);
    if (!p.fournisseurs?.length) out.push('  - _Aucun fournisseur renseigné_');
    for (const f of p.fournisseurs ?? []) out.push(`  - ${f.nom} (${LIBELLE_TYPE[f.type] ?? f.type}${f.note ? `, ${f.note}` : ''}) : ${f.url}`);
  }
  out.push('');

  out.push('## À compléter ou vérifier');
  out.push('');
  for (const p of produits) {
    const points = [];
    if (!p.prix_achat) points.push("prix d'achat manquant");
    else if (p.prix_achat.fiabilite === 'estimation') points.push("prix d'achat estimé, à vérifier chez le fournisseur");
    if (!(p.fournisseurs ?? []).some((f) => f.type === 'fiche')) points.push('pas encore de fiche fournisseur précise');
    if (!p.image) points.push('photo manquante');
    else if (p.image_ambiance) points.push("photo d'ambiance à remplacer par la photo du fournisseur");
    if (points.length) out.push(`- **${p.fr.nom}** : ${points.join(' ; ')}.${p.notes ? ` _${p.notes}_` : ''}`);
  }
  out.push('');

  const fichier = join(EXPORTS, 'catalogue-interne.md');
  ecrire(fichier, out.join('\n'));
  return { fichier, justes, coefMoyen, coefMini };
}

// Liste des produits avec leurs liens, en HTML simple : sert de base au Google Doc.
function exporterListeLiens() {
  const bord = 'border:1px solid #9fb3a8';
  const th = (t) => `<th style="background-color:#12332b;color:#ffffff;text-align:left;padding:6px 8px;${bord}">${t}</th>`;
  const td = (t, droite = false) => `<td style="padding:6px 8px;${bord};vertical-align:top${droite ? ';text-align:right' : ''}">${t}</td>`;
  const petit = (t) => `<span style="color:#5b6a64;font-size:9pt">${t}</span>`;
  const out = [];
  out.push('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Boutique cocooning : produits et liens fournisseurs</title></head><body style="font-family:Arial,sans-serif;font-size:10.5pt">');
  out.push('<h1>Boutique cocooning : produits et liens fournisseurs</h1>');
  out.push(`<p>Catalogue du ${meta.mise_a_jour.split('-').reverse().join('/')} : ${produits.length} produits, dont ${nouveautes().length} nouveautés pour Noël.</p>`);
  out.push('<h2>Comment lire ce document</h2>');
  out.push('<ul>');
  out.push(`<li><b>Règle de marge</b> : chaque produit se vend au moins ${nbFr(meta.coef_minimum, 0)} fois son prix d'achat, même au prix d'achat le plus haut relevé.</li>`);
  out.push(`<li><b>Achat max pour ${X}</b> : le prix à ne pas dépasser chez le fournisseur, frais de port non compris. Au-dessus, la marge passe sous ${X}.</li>`);
  out.push("<li><b>Coef.</b> : prix de vente ÷ prix d'achat, du prix d'achat le plus haut au plus bas.</li>");
  out.push('<li><b>Fiabilité</b> : « Vérifié » = prix relevé sur un site fournisseur en novembre 2026. « Estimation » = prix à confirmer.</li>');
  out.push("<li><b>Liens</b> : « fiche produit » mène à un article précis. « recherche » et « catégorie » mènent à une liste où il reste à choisir l'annonce.</li>");
  out.push(`<li><b>Prix US</b> : indiqué seulement quand il diffère du prix en euros. Taux retenu : 1 $ = ${nbFr(meta.taux_usd_vers_eur)} €.</li>`);
  out.push('</ul>');

  for (const c of categories) {
    out.push(`<h2>${esc(c.fr.nom)}</h2>`);
    out.push('<table style="border-collapse:collapse;width:100%">');
    out.push(`<tr>${['Produit', 'Prix de vente', "Prix d'achat", `Achat max pour ${X}`, 'Coef.', 'Liens fournisseurs'].map(th).join('')}</tr>`);
    for (const p of produitsDe(c.id)) {
      const x = analyse(p);
      const marques = [p.vedette != null ? 'Coup de cœur' : '', p.nouveau ? 'Nouveau' : ''].filter(Boolean).join(', ');
      const liensHtml = (p.fournisseurs ?? [])
        .map((f) => `<a href="${esc(f.url)}">${esc(f.nom)} (${LIBELLE_TYPE[f.type] ?? f.type})</a>${f.note ? ` : ${esc(f.note)}` : ''}`)
        .join('<br>');
      const vente = `${euros(p.prix_vente, 0)}${x.venteUs !== p.prix_vente ? `<br>${petit(`US : ${dollars(x.venteUs, 0)}`)}` : ''}`;
      out.push(
        `<tr>${td(`<b>${esc(p.fr.nom)}</b>${marques ? `<br><i>${marques}</i>` : ''}${p.notes ? `<br>${petit(esc(p.notes))}` : ''}`)}${td(vente, true)}${td(`${achatBrief(p.prix_achat)}<br>${petit(fiabilite(p))}`)}${td(x.plafond ?? '—', true)}${td(x.cout == null ? '—' : coefTexte(x), true)}${td(liensHtml || '—')}</tr>`,
      );
    }
    out.push('</table>');
  }
  out.push("<h2>À faire avant l'ouverture</h2>");
  out.push('<ul>');
  out.push("<li>Ouvrir chaque lien, choisir une annonce précise et vérifier que son prix reste sous l'achat maximum.</li>");
  out.push('<li>Ajouter les frais de port du fournisseur au calcul : ils ne sont pas comptés ici.</li>');
  out.push("<li>Remplacer les photos d'ambiance du site par les photos des fournisseurs.</li>");
  out.push('<li>Produits électriques : vérifier le marquage CE (Europe) ou UL/ETL (États-Unis) auprès du fournisseur.</li>');
  out.push('</ul>');
  out.push('</body></html>');
  const fichier = join(EXPORTS, 'produits-et-liens.html');
  ecrire(fichier, out.join('\n') + '\n');
  return fichier;
}

// ---------------------------------------------------------------------------

valider();
const nbPages = construireSite();
const nbEcrans = construireApercu();
const csv = Object.keys(marches).map(exporterShopify);
const interne = exporterCatalogueInterne();
const listeLiens = exporterListeLiens();

console.log(`Catalogue : ${produits.length} produits, ${categories.length} catégories, ${vedettes().length} vedettes, ${nouveautes().length} nouveautés.`);
console.log(`Site : ${nbPages} pages dans dist/ (ouvrir dist/index.html), et dist/apercu.html (${nbEcrans} écrans dans un seul fichier).`);
console.log(`Exports : ${[...csv, interne.fichier, listeLiens].map((f) => f.replace(ROOT + '/', '')).join(', ')}`);
console.log(`Marge : coefficient le plus bas ${nbFr(interne.coefMini)}, moyen ${nbFr(interne.coefMoyen)} ; ${interne.justes.length} produits sous ${nbFr(meta.coef_confort, 1)}.`);
