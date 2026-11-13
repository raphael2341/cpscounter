#!/usr/bin/env node
// Génère, à partir de catalogue.json :
//   dist/fr/…, dist/us/…            site vitrine statique (accueil, guide cadeaux, catégories, fiches produits)
//   dist/apercu.html                la même boutique dans un seul fichier autonome (tablette, téléphone)
//   exports/shopify-fr.csv, -us     fichiers d'import produits Shopify (brouillons, une ligne par variante)
//   exports/catalogue-interne.md    prix, marges et fournisseurs, variante par variante (usage interne)
//   exports/produits-et-liens.html  la liste des produits avec leur fiche fournisseur et le prix de chaque variante
//   exports/produits-et-liens.json  le même contenu en blocs (titres, paragraphes, tableaux), pour le Google Doc
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
const CODES = Object.keys(marches);

// ---------------------------------------------------------------------------
// Prix : chaque produit a des variantes (taille, coloris…), chacune avec son prix de vente.
// ---------------------------------------------------------------------------

// Prix de vente d'une variante sur un marché : même chiffre partout, sauf si la variante porte un vente_<marché>.
const venteVar = (v, code) => v[`vente_${code}`] ?? v.vente;
// Prix d'achat d'une variante, dans la devise du fournisseur. Sans prix précis, on compte le haut de la fourchette.
const achatVar = (p, v) => v.achat ?? p.prix_achat.max;
const achatPrecis = (v) => v.achat != null;
function convertir(montant, de, vers) {
  if (de === vers) return montant;
  return vers === 'EUR' ? montant * meta.taux_usd_vers_eur : montant / meta.taux_usd_vers_eur;
}
const coutVar = (p, v, devise) => convertir(achatVar(p, v), p.prix_achat.devise, devise);
const disponible = (p, code) => !p.marches || p.marches.includes(code);
const prixMin = (p, code) => Math.min(...p.variantes.map((v) => venteVar(v, code)));
const prixVarie = (p, code) => new Set(p.variantes.map((v) => venteVar(v, code))).size > 1;

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
    newIntro: 'Lumières, sapin de table, plaids et petites attentions, tout juste arrivés.',
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
    choices: (n, option) => `${n} ${option.toLowerCase()}s au choix`,
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
    newIntro: 'Lights, a tabletop tree, throws and little treats, just in.',
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
    choices: (n, option) => `${n} ${option.toLowerCase()}s available`,
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

const arrondi2 = (v) => Math.round(v * 100) / 100;

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
    if (p.vedette != null) {
      if (rangs.has(p.vedette)) erreurs.push(`${ref} : rang de vedette ${p.vedette} déjà utilisé`);
      rangs.add(p.vedette);
    }
    if (p.image && !/^https?:/.test(p.image) && !existsSync(join(SRC, p.image))) erreurs.push(`${ref} : image introuvable src/${p.image}`);
    for (const m of p.marches ?? []) if (!marches[m]) erreurs.push(`${ref} : marché inconnu « ${m} »`);

    // Fiche fournisseur : un vrai produit, pas une page de recherche.
    if (!p.fiche?.url || !/^https:\/\//.test(p.fiche.url)) erreurs.push(`${ref} : fiche fournisseur manquante`);
    else if (/\/(search|w|list|wholesale)\b|[?&](search|SearchText)=/.test(p.fiche.url)) erreurs.push(`${ref} : la fiche est une page de recherche, pas un produit`);

    const a = p.prix_achat;
    if (!a || !['USD', 'EUR'].includes(a.devise) || !(a.min > 0 && a.max >= a.min)) {
      erreurs.push(`${ref} : prix d'achat (min, max, devise) invalide`);
      continue;
    }
    if (!Array.isArray(p.variantes) || p.variantes.length === 0) {
      erreurs.push(`${ref} : aucune variante`);
      continue;
    }
    if (p.variantes.length > 1 && !p.option) erreurs.push(`${ref} : plusieurs variantes mais pas de nom d'option (taille, coloris…)`);
    const idsVar = new Set();
    for (const v of p.variantes) {
      const rv = `${ref}, variante « ${v.id} »`;
      if (idsVar.has(v.id)) erreurs.push(`${rv} : identifiant en double`);
      idsVar.add(v.id);
      if (!v.fr || !v.en) erreurs.push(`${rv} : libellé manquant`);
      if (!(v.vente > 0)) erreurs.push(`${rv} : prix de vente invalide`);
      if (v.achat != null && (v.achat < a.min - 1e-9 || v.achat > a.max + 1e-9)) erreurs.push(`${rv} : prix d'achat hors de la fourchette de la fiche`);
      // Règle de marge : le prix de vente fait au moins « coef_minimum » fois le coût, sur chaque marché où le produit est vendu.
      for (const code of CODES.filter((k) => disponible(p, k))) {
        const cout = coutVar(p, v, marches[code].devise);
        const coef = venteVar(v, code) / cout;
        if (coef < meta.coef_minimum) {
          erreurs.push(`${rv} : coefficient ${coef.toFixed(2)} sur le marché « ${code} », sous le minimum de ${meta.coef_minimum}. Prix à porter à ${Math.ceil(cout * meta.coef_minimum)} au moins.`);
        }
      }
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
  const autre = CODES.find((k) => k !== code) ?? code;
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
  const liste = produits.filter((p) => disponible(p, code));
  const pv = (p) => prixMin(p, code);
  const prix = (v) => monnaie(marche, v);
  return {
    code,
    marche,
    lang,
    ui: UI[lang],
    produits: liste, // produits vendus sur ce marché
    vedettes: liste.filter((p) => p.vedette != null).sort((a, b) => a.vedette - b.vedette),
    nouveautes: liste.filter((p) => p.nouveau),
    produitsDe: (catId) => liste.filter((p) => p.categorie === catId),
    pv, // prix de vente le plus bas d'un produit sur ce marché
    prix, // mise en forme d'un montant
    // Prix affiché sur une carte : « dès 25 € » quand les variantes n'ont pas toutes le même prix.
    prixCarte: (p) => (prixVarie(p, code) ? UI[lang].from(prix(pv(p))) : prix(pv(p))),
    prixMini: Math.min(...liste.map(pv)),
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
  const choix = p.variantes.length > 1 ? `<span class="card__choices">${esc(ctx.ui.choices(p.variantes.length, p.option[ctx.lang]))}</span>` : '';
  return `<a class="card" href="${ctx.href.produit(p)}">
  ${visuel(ctx, p)}
  <span class="card__body">
    <span class="card__cat">${esc(cat[ctx.lang].nom)}</span>
    <span class="card__title">${esc(t.nom)}</span>
    ${choix}
    <span class="card__price">${ctx.prixCarte(p)}</span>
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
    const n = ctx.produits.filter((p) => ctx.budget(p) === b).length;
    return `<a class="budget" href="${href.cadeaux(b.n)}">
        <span class="budget__label">${esc(ui.budget(b, ctx.prix))}</span>
        <span class="budget__count">${esc(ui.budgetCount(n))} →</span>
      </a>`;
  }).join('\n      ');

  const univers = categories
    .map((c) => {
      const n = ctx.produitsDe(c.id).length;
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
  ${grille(ctx, ctx.vedettes, 'grid--feature')}
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
    ${grille(ctx, ctx.nouveautes)}
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
    const liste = ctx.produits.filter((p) => ctx.budget(p) === b).sort((a, z) => ctx.pv(a) - ctx.pv(z));
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
  const liste = ctx.produitsDe(c.id);
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
  ${grille(ctx, ctx.produitsDe(c.id))}
</section>`,
    )
    .join('\n');
  const corps = `<div class="wrap">${filAriane(ctx, [[ui.home, href.accueil()], [ui.allProducts]])}</div>
<header class="page-head wrap">
  <h1>${esc(ui.allProducts)}</h1>
  <p class="muted">${esc(ui.count(ctx.produits.length))}</p>
</header>
${sections}`;
  return { titre: `${ui.allProducts} | ${ctx.marche.nom_boutique}`, description: ctx.marche.hero_texte, corps, actif: 'tous' };
}

// Choix de la variante (taille, coloris…) : des boutons radio ; le prix affiché suit le choix (voir app.js).
function selecteurVariantes(ctx, p) {
  if (p.variantes.length < 2) return '';
  const nom = `v-${ctx.code}-${p.id}`;
  const options = p.variantes
    .map(
      (v, i) => `<label class="variant">
        <input type="radio" name="${nom}" value="${esc(v.id)}" data-prix="${esc(ctx.prix(venteVar(v, ctx.code)))}"${i === 0 ? ' checked' : ''}>
        <span>${esc(v[ctx.lang])}</span>
      </label>`,
    )
    .join('\n      ');
  return `<fieldset class="variants">
      <legend class="product__subtitle">${esc(p.option[ctx.lang])}</legend>
      <div class="variants__list">
      ${options}
      </div>
    </fieldset>`;
}

function vueProduit(ctx, p) {
  const { ui, marche, lang, href } = ctx;
  const t = p[lang];
  const cat = catById[p.categorie];
  const lienCat = href.categorie(cat);
  const voisins = ctx.produitsDe(cat.id).filter((x) => x.id !== p.id).slice(0, 4);
  const budget = ctx.budget(p);
  const premier = venteVar(p.variantes[0], ctx.code);

  const corps = `<div class="wrap">${filAriane(ctx, [[ui.home, href.accueil()], [cat[lang].nom, lienCat], [t.nom]])}</div>
<article class="product wrap">
  <div class="product__media">${visuel(ctx, p, { classe: 'visual--large', legende: true })}</div>
  <div class="product__info">
    <a class="product__cat" href="${lienCat}">${esc(cat[lang].nom)}</a>
    <h1>${esc(t.nom)}</h1>
    <p class="product__price" data-prix-affiche>${ctx.prix(premier)}</p>
    <p class="product__desc">${esc(t.description)}</p>
    ${selecteurVariantes(ctx, p)}
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

  const prixListe = p.variantes.map((v) => venteVar(v, ctx.code));
  const offre =
    p.variantes.length > 1
      ? { '@type': 'AggregateOffer', lowPrice: Math.min(...prixListe).toFixed(2), highPrice: Math.max(...prixListe).toFixed(2), offerCount: p.variantes.length }
      : { '@type': 'Offer', price: premier.toFixed(2) };
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: t.nom,
    description: t.description,
    sku: p.id.toUpperCase(),
    category: cat[lang].nom,
    brand: { '@type': 'Brand', name: marche.nom_boutique },
    offers: { ...offre, priceCurrency: marche.devise, availability: 'https://schema.org/InStock' },
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
    ${CODES.map(lien).join('\n    ')}
  </div>
</main>
</body>
</html>
`;
}

// Toutes les pages de tous les marchés, dans l'ordre : [ctx, vue, chemin du fichier].
function* toutesLesVues(mode) {
  for (const code of CODES) {
    const ui = UI[marches[code].langue];
    const racine = contexte(code, mode, 0);
    const sous = contexte(code, mode, 1);
    yield [racine, vueAccueil(racine), join(code, 'index.html')];
    yield [racine, vueCadeaux(racine), join(code, ui.giftsFile)];
    yield [racine, vueTous(racine), join(code, ui.allFile)];
    for (const c of categories) yield [sous, vueCategorie(sous, c), join(code, ui.categoryDir, `${c[racine.lang].slug}.html`)];
    for (const p of sous.produits) yield [sous, vueProduit(sous, p), join(code, ui.productDir, `${p[racine.lang].slug}.html`)];
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
  const premier = marches[CODES[0]];
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
// Export Shopify (format CSV d'import produits) : une ligne par variante.
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
  const lignes = [];
  for (const p of produits.filter((x) => disponible(x, code))) {
    const t = p[lang];
    const cat = catById[p.categorie];
    const tags = [cat[lang].nom, `${ui.giftsNav} : ${ui.budget(budgetDe(prixMin(p, code)), prix).toLowerCase()}`];
    if (p.vedette != null) tags.push(ui.favoriteBadge);
    if (p.nouveau) tags.push(ui.newBadge);
    const corps = `<p>${esc(t.description)}</p><ul>${t.points_forts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    // Les photos d'ambiance ne partent pas dans Shopify : seules les vraies photos produit (URL) sont exportées.
    const distante = /^https?:/.test(p.image ?? '') && !p.image_ambiance;
    p.variantes.forEach((v, i) => {
      const variante = {
        Handle: t.slug,
        'Option1 Value': p.option ? v[lang] : 'Default Title',
        'Variant SKU': `${p.id}-${v.id}`.toUpperCase(),
        'Variant Inventory Tracker': '',
        'Variant Inventory Policy': 'deny',
        'Variant Fulfillment Service': 'manual',
        'Variant Price': venteVar(v, code).toFixed(2),
        'Variant Requires Shipping': 'TRUE',
        'Variant Taxable': 'TRUE',
        'Cost per item': arrondi2(coutVar(p, v, marche.devise)).toFixed(2),
      };
      const produit =
        i === 0
          ? {
              Title: t.nom,
              'Body (HTML)': corps,
              Vendor: marche.nom_boutique,
              Type: cat[lang].nom,
              Tags: tags.join(', '),
              Published: 'FALSE',
              'Option1 Name': p.option ? p.option[lang] : 'Title',
              'Image Src': distante ? p.image : '',
              'Image Alt Text': distante ? t.nom : '',
              'Gift Card': 'FALSE',
              'SEO Title': `${t.nom} | ${marche.nom_boutique}`,
              'SEO Description': t.description,
              Status: 'draft',
            }
          : {};
      const ligne = { ...variante, ...produit };
      lignes.push(colonnes.map((c) => csvCellule(ligne[c])).join(','));
    });
  }
  const fichier = join(EXPORTS, `shopify-${code}.csv`);
  ecrire(fichier, [colonnes.join(','), ...lignes].join('\n') + '\n');
  return fichier;
}

// ---------------------------------------------------------------------------
// Chiffres internes : prix, marges, fournisseurs, variante par variante
// ---------------------------------------------------------------------------

const nbFr = (v, dec = 2) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v);
const euros = (v, dec = 2) => `${nbFr(v, dec)} €`;
const dollars = (v, dec = 2) => `${nbFr(v, dec)} $`;
const enDevise = (v, devise, dec = 2) => (devise === 'EUR' ? euros(v, dec) : dollars(v, dec));
const X = `x${nbFr(meta.coef_minimum, 0)}`;

// Une ligne de chiffres par variante : achat, coût en euros, ventes et coefficients sur chaque marché.
function lignesVariantes(p) {
  return p.variantes.map((v) => {
    const a = p.prix_achat;
    const achat = achatPrecis(v) ? enDevise(v.achat, a.devise) : a.min === a.max ? enDevise(a.max, a.devise) : `${enDevise(a.min, a.devise)} à ${enDevise(a.max, a.devise)}`;
    const cout = coutVar(p, v, 'EUR');
    const lignes = { v, achat, precis: achatPrecis(v) || a.min === a.max, cout };
    for (const code of CODES) {
      if (!disponible(p, code)) continue;
      const vente = venteVar(v, code);
      lignes[code] = { vente, coef: vente / coutVar(p, v, marches[code].devise) };
    }
    return lignes;
  });
}

const tousLesCoefs = () => produits.flatMap((p) => lignesVariantes(p).flatMap((l) => CODES.filter((c) => l[c]).map((c) => l[c].coef)));

function exporterCatalogueInterne() {
  const coefs = tousLesCoefs();
  const coefMini = Math.min(...coefs);
  const coefMoyen = coefs.reduce((s, c) => s + c, 0) / coefs.length;
  const nbVariantes = produits.reduce((s, p) => s + p.variantes.length, 0);
  const parFournisseur = produits.reduce((acc, p) => ({ ...acc, [p.fiche.fournisseur]: (acc[p.fiche.fournisseur] ?? 0) + 1 }), {});

  const out = [];
  out.push('# Catalogue interne : prix, marges et fournisseurs');
  out.push('');
  out.push(`> Document généré par \`node build.mjs\` à partir de \`catalogue.json\` (mise à jour : ${meta.mise_a_jour}). Ne pas modifier à la main : modifier le JSON puis relancer le script.`);
  out.push('');
  out.push('## Méthode');
  out.push('');
  out.push(`- **Une fiche par produit** : chaque produit renvoie à la page d'un article précis chez le fournisseur, jamais à une page de recherche.`);
  out.push(`- **Prix relevés** : ${meta.releve}`);
  out.push(`- **Règle de marge** : chaque variante se vend au moins **${nbFr(meta.coef_minimum, 0)} fois** son coût d'achat, sur chaque marché où elle est vendue. Le script refuse un catalogue qui ne la respecte pas.`);
  out.push(`- **Coût** : prix d'achat **hors frais de port**, converti en euros à 1 $ = ${nbFr(meta.taux_usd_vers_eur)} €.`);
  out.push(`- ⚠ = coefficient inférieur à ${nbFr(meta.coef_confort, 1)} : peu de place pour le port, la publicité et les frais de paiement.`);
  out.push('');
  out.push('## Synthèse');
  out.push('');
  out.push('| Indicateur | Valeur |');
  out.push('|---|---|');
  out.push(`| Produits | ${produits.length} (${Object.entries(parFournisseur).map(([f, n]) => `${n} ${f}`).join(', ')}) |`);
  out.push(`| Variantes | ${nbVariantes} |`);
  out.push(`| Coefficient le plus bas (France et US) | ${nbFr(coefMini)} |`);
  out.push(`| Coefficient moyen | ${nbFr(coefMoyen)} |`);
  out.push(`| Produits vendus en France seulement | ${produits.filter((p) => p.marches && !p.marches.includes('us')).map((p) => p.fr.nom).join(', ') || 'aucun'} |`);
  out.push('');

  for (const c of categories) {
    out.push(`## ${c.fr.nom}`);
    out.push('');
    for (const p of produits.filter((x) => x.categorie === c.id)) {
      const marques = [p.vedette != null ? '★ coup de cœur' : '', p.nouveau ? 'nouveau' : '', p.marches ? `vendu en ${p.marches.join(', ').toUpperCase()} seulement` : ''].filter(Boolean);
      out.push(`### ${p.fr.nom}${marques.length ? ` (${marques.join(', ')})` : ''}`);
      out.push('');
      out.push(`- Fiche ${p.fiche.fournisseur} : [${p.fiche.titre}](${p.fiche.url})${p.fiche.ref ? `, réf. ${p.fiche.ref}` : ''}`);
      out.push(`- Prix affiché : ${p.fiche.prix_affiche}`);
      if (p.notes) out.push(`- ${p.notes}`);
      out.push('');
      out.push(`| ${p.option ? p.option.fr : 'Variante'} | Achat | Coût max (€) | Vente France | Coef. | Vente US | Coef. US |`);
      out.push('|---|---|---:|---:|---:|---:|---:|');
      for (const l of lignesVariantes(p)) {
        const fr = l.fr ? [euros(l.fr.vente, 0), `${nbFr(l.fr.coef)}${l.fr.coef < meta.coef_confort ? ' ⚠' : ''}`] : ['—', '—'];
        const us = l.us ? [dollars(l.us.vente, 0), `${nbFr(l.us.coef)}${l.us.coef < meta.coef_confort ? ' ⚠' : ''}`] : ['non vendu', '—'];
        out.push(`| ${l.v.fr} | ${l.achat} | ${euros(l.cout)} | ${fr.join(' | ')} | ${us.join(' | ')} |`);
      }
      out.push('');
    }
  }

  out.push('## À vérifier avant la mise en vente');
  out.push('');
  out.push('- Ouvrir chaque fiche, choisir la variante et vérifier son prix : quand la fiche ne donne qu’une fourchette, le prix exact d’une taille n’apparaît qu’une fois la taille choisie.');
  out.push('- Ajouter les frais de port du fournisseur : ils ne sont pas comptés.');
  out.push('- Sur AliExpress, beaucoup de prix affichés sont des promotions : vérifier le prix le jour de la commande.');
  out.push('- Remplacer les photos d’ambiance par celles du fournisseur.');
  out.push('- Produits électriques : vérifier le marquage CE (Europe) ou UL/ETL (US).');
  out.push('');

  const fichier = join(EXPORTS, 'catalogue-interne.md');
  ecrire(fichier, out.join('\n'));
  return { fichier, coefMini, coefMoyen, nbVariantes };
}

// Liste des produits pour le Google Doc : des blocs (titres, paragraphes, listes, tableaux) écrits en
// JSON pour la mise à jour du Doc, et rendus en HTML pour la lecture.
function blocsListeProduits() {
  const B = [];
  const nbVariantes = produits.reduce((s, p) => s + p.variantes.length, 0);
  const date = meta.mise_a_jour.split('-').reverse().join('/');
  B.push({ type: 'h1', runs: [{ text: 'Boutique cocooning : produits, tailles et prix' }] });
  B.push({ type: 'p', runs: [{ text: `Catalogue du ${date} : ${produits.length} produits et ${nbVariantes} variantes. Chaque produit renvoie à la fiche d'un article précis chez CJ Dropshipping ou AliExpress, avec le prix de chaque taille ou coloris.` }] });
  B.push({ type: 'h2', runs: [{ text: 'Comment lire ce document' }] });
  B.push({
    type: 'ul',
    items: [
      [{ text: 'Fiche fournisseur', bold: true }, { text: " : le lien ouvre la page de l'article chez le fournisseur." }],
      [{ text: "Prix d'achat", bold: true }, { text: ` : prix affiché sur la fiche le ${date}, frais de port non compris. Quand la fiche ne donne qu'une fourchette pour toutes les tailles, le tableau indique la fourchette : le prix exact d'une taille s'affiche sur la fiche quand on la choisit.` }],
      [{ text: 'Prix de vente', bold: true }, { text: ` : chaque variante se vend au moins ${nbFr(meta.coef_minimum, 0)} fois son prix d'achat, même au haut de la fourchette.` }],
      [{ text: 'Coef.', bold: true }, { text: ` : prix de vente France ÷ prix d'achat converti en euros (1 $ = ${nbFr(meta.taux_usd_vers_eur)} €).` }],
      [{ text: 'Prix US', bold: true }, { text: ' : même chiffre en dollars, sauf mention contraire.' }],
    ],
  });
  for (const c of categories) {
    B.push({ type: 'h2', runs: [{ text: c.fr.nom }] });
    for (const p of produits.filter((x) => x.categorie === c.id)) {
      const marques = [p.vedette != null ? 'coup de cœur' : '', p.nouveau ? 'nouveau' : '', p.marches ? 'France seulement' : ''].filter(Boolean);
      B.push({ type: 'h3', runs: [{ text: p.fr.nom }, ...(marques.length ? [{ text: ` (${marques.join(', ')})` }] : [])] });
      B.push({
        type: 'p',
        runs: [
          { text: `Fiche ${p.fiche.fournisseur} : `, bold: true },
          { text: p.fiche.titre, link: p.fiche.url },
          ...(p.fiche.ref ? [{ text: ` (réf. ${p.fiche.ref})` }] : []),
          { text: `. Prix affiché : ${p.fiche.prix_affiche}.` },
        ],
      });
      if (p.notes) B.push({ type: 'p', runs: [{ text: p.notes, italic: true }] });
      const avecUs = p.variantes.some((v) => v.vente_us != null) || (p.prix_achat.devise === 'EUR' && disponible(p, 'us'));
      const entete = [p.option ? p.option.fr : 'Variante', "Prix d'achat", 'Prix de vente', 'Coef.'];
      if (avecUs) entete.push('Prix US');
      const lignes = lignesVariantes(p).map((l) => {
        const ligne = [l.v.fr, l.achat, euros(l.fr.vente, 0), nbFr(l.fr.coef)];
        if (avecUs) ligne.push(l.us ? dollars(l.us.vente, 0) : '—');
        return ligne;
      });
      B.push({ type: 'table', rows: [entete, ...lignes] });
    }
  }
  B.push({ type: 'h2', runs: [{ text: "À faire avant l'ouverture" }] });
  B.push({
    type: 'ul',
    items: [
      [{ text: 'Ouvrir chaque fiche, choisir la taille ou le coloris et vérifier que le prix reste sous le prix de vente divisé par 2.' }],
      [{ text: 'Ajouter les frais de port du fournisseur : ils ne sont pas comptés ici.' }],
      [{ text: 'Sur AliExpress, beaucoup de prix affichés sont des promotions : vérifier le prix le jour de la commande.' }],
      [{ text: "Remplacer les photos d'ambiance du site par les photos des fournisseurs." }],
      [{ text: 'Produits électriques : vérifier le marquage CE (Europe) ou UL/ETL (États-Unis) auprès du fournisseur.' }],
    ],
  });
  return B;
}

function blocsEnHtml(blocs) {
  const runs = (rs) =>
    rs
      .map((r) => {
        let s = esc(r.text);
        if (r.bold) s = `<b>${s}</b>`;
        if (r.italic) s = `<i>${s}</i>`;
        if (r.link) s = `<a href="${esc(r.link)}">${s}</a>`;
        return s;
      })
      .join('');
  const bord = 'border:1px solid #9fb3a8;padding:5px 8px;vertical-align:top';
  return blocs
    .map((b) => {
      if (b.type === 'ul') return `<ul>${b.items.map((it) => `<li>${runs(it)}</li>`).join('')}</ul>`;
      if (b.type === 'table') {
        const [entete, ...rows] = b.rows;
        return `<table style="border-collapse:collapse">\n<tr>${entete.map((x) => `<th style="${bord};background-color:#e7eee8;text-align:left">${esc(x)}</th>`).join('')}</tr>\n${rows
          .map((r) => `<tr>${r.map((x, i) => `<td style="${bord}${i > 0 ? ';text-align:right' : ''}">${esc(x)}</td>`).join('')}</tr>`)
          .join('\n')}\n</table>`;
      }
      return `<${b.type}>${runs(b.runs)}</${b.type}>`;
    })
    .join('\n');
}

function exporterListeProduits() {
  const blocs = blocsListeProduits();
  ecrire(join(EXPORTS, 'produits-et-liens.json'), JSON.stringify(blocs, null, 1) + '\n');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Boutique cocooning : produits, tailles et prix</title></head><body style="font-family:Arial,sans-serif;font-size:10.5pt">\n${blocsEnHtml(blocs)}\n</body></html>\n`;
  const fichier = join(EXPORTS, 'produits-et-liens.html');
  ecrire(fichier, html);
  return fichier;
}

// ---------------------------------------------------------------------------

valider();
const nbPages = construireSite();
const nbEcrans = construireApercu();
const csv = CODES.map(exporterShopify);
const interne = exporterCatalogueInterne();
const liste = exporterListeProduits();

console.log(`Catalogue : ${produits.length} produits (${interne.nbVariantes} variantes), ${categories.length} catégories.`);
console.log(`Site : ${nbPages} pages dans dist/ (ouvrir dist/index.html), et dist/apercu.html (${nbEcrans} écrans dans un seul fichier).`);
console.log(`Exports : ${[...csv, interne.fichier, liste].map((f) => f.replace(ROOT + '/', '')).join(', ')}`);
console.log(`Marge : coefficient le plus bas ${nbFr(interne.coefMini)}, moyen ${nbFr(interne.coefMoyen)}.`);
