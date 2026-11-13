# Boutique cocooning, édition hiver / Noël

Tout part d'un seul fichier, `catalogue.json` : catégories, produits, prix d'achat et de vente, fournisseurs, photos et textes en français et en anglais. La commande `node build.mjs` génère à partir de ce fichier :

| Sortie | Contenu |
|---|---|
| `dist/` | Le site en version **France (€, français)** et **US ($, anglais)** : accueil, guide cadeaux par budget, une page par catégorie, une fiche par produit. |
| `dist/apercu.html` | La même boutique dans un seul fichier autonome, photos comprises. C'est la version à ouvrir sur tablette ou téléphone, et celle de l'aperçu en ligne sur Claude. |
| `exports/shopify-fr.csv`, `exports/shopify-us.csv` | Fichiers d'import produits pour Shopify. Tous les produits sont importés en **brouillon**. |
| `exports/catalogue-interne.md` | Tableau interne des prix, marges et fournisseurs, avec ce qui reste à vérifier. |
| `exports/produits-et-liens.html` | La liste des produits avec leurs liens fournisseurs. C'est la base du Google Doc. |

## La règle de marge

Chaque produit se vend **au moins 2 fois son prix d'achat**, même au prix d'achat le plus haut relevé, en France comme aux US. La règle est dans `catalogue.json` (`meta.coef_minimum`) et le script refuse de générer un catalogue qui ne la respecte pas : il indique le produit en cause et le prix de vente minimum.

- Le coût retenu est le haut de la fourchette du prix d'achat, **hors frais de port**.
- La version US reprend le même chiffre en dollars. Quand cela ferait passer la marge sous x2, le produit porte un `prix_vente_us` (12 produits aujourd'hui).
- `exports/catalogue-interne.md` donne pour chaque produit l'**achat maximum** à ne pas dépasser chez le fournisseur.

## Voir le site

Ouvrir `dist/apercu.html` dans un navigateur. Les adresses internes prennent la forme `apercu.html#fr-produit-…`, et le lien en bas de page passe de la version France à la version US.

Le bouton « Ajouter au panier » n'affiche qu'un message : le paiement sera géré par la plateforme e-commerce.

## Les photos

Les photos de `src/images/` sont des **photos d'ambiance libres de droits** (licence Unsplash), choisies pour évoquer chaque produit. Elles ne montrent pas l'article réellement vendu : il faut les remplacer par les photos des fournisseurs avant l'ouverture. Leur origine est notée dans `src/images/sources.json`.

Pour remplacer une photo : déposer le fichier dans `src/images/`, mettre son chemin dans le champ `"image"` du produit et retirer `"image_ambiance": true`. Une URL (`https://…`) fonctionne aussi pour le site en plusieurs pages et pour l'export Shopify, mais pas dans `apercu.html`, qui n'embarque que les fichiers locaux.

## Modifier le catalogue

Après chaque modification de `catalogue.json`, relancer :

```bash
node build.mjs
```

Le script vérifie le catalogue (identifiants en double, catégorie inconnue, image introuvable, marge sous x2, etc.) et s'arrête avec un message clair en cas d'erreur.

- **Changer un prix** : `prix_vente` du produit, et `prix_vente_us` s'il en a un. Le prix d'achat va dans `prix_achat` (`min`, `max`, `devise` en `USD` ou `EUR`, `fiabilite` : `verifie` ou `estimation`).
- **Ajouter un produit** : copier un bloc existant dans `produits`, puis changer l'`id`, la `categorie` et les textes `fr` / `en`. Les `slug` deviennent les adresses des pages : lettres minuscules, chiffres et tirets uniquement.
- **Coups de cœur** : `vedette` vaut 1 à 5 pour les produits mis en avant sur l'accueil (dans l'ordre d'affichage), `null` pour les autres.
- **Nouveautés** : `"nouveau": true` affiche le badge « Nouveau » et place le produit dans la rangée « Nouveautés des fêtes ».
- **Guide cadeaux** : les produits s'y classent tout seuls selon leur prix (jusqu'à 25, de 25 à 50, plus de 50).
- **Nom de la boutique, slogan, textes d'accueil, bandeau, garanties affichées** : bloc `marches.fr` ou `marches.us`. « Maison Cocon » (FR) et « Warm Nest » (US) sont provisoires.
- **Taux de change, TVA, seuils de marge** : bloc `meta`.

Après Noël, les textes de saison se changent dans `marches` (slogan, titre, bandeau) et dans le bloc `UI` en haut de `build.mjs`. La guirlande et la neige se retirent dans `src/style.css` (`.garland`) et `src/app.js` (neige).

## Importer dans Shopify

1. Dans l'admin Shopify : *Produits → Importer*, puis choisir `exports/shopify-fr.csv` (ou `-us`). Faire d'abord un essai sur 2 ou 3 lignes.
2. Les produits arrivent en **brouillon**, sans photo : les photos d'ambiance ne sont pas exportées. Ajouter les photos des fournisseurs, puis passer chaque produit en « Actif ».
3. Créer les collections en mode **automatique** :
   - une par catégorie, avec la condition « Type de produit est égal à … » (par exemple *Sélection de Noël*) ;
   - « Coups de cœur » et « Nouveautés » avec les balises *Coup de cœur* et *Nouveau* (*Favorite* et *New* pour la version US) ;
   - une par budget, avec les balises *Idées cadeaux : jusqu'à 25 €*, etc.
4. Le champ « Coût par article » reprend le **haut** de la fourchette du prix d'achat, converti dans la devise de la boutique.

## Ce qui reste à faire avant le lancement

Le détail par produit se trouve dans `exports/catalogue-interne.md`. Les points principaux :

- **Prix à confirmer** : 21 prix d'achat sont relevés chez un fournisseur, 10 sont des estimations. Les fiches CJ Dropshipping sont protégées par une vérification anti-robot : leurs prix ont été relevés par la recherche web le 13/11/2026 et sont à reconfirmer sur la fiche.
- **Fournisseurs** : beaucoup de liens AliExpress, BigBuy et CJ sont des pages de recherche. Pour chaque produit, il reste à choisir une annonce précise dont le prix reste sous l'achat maximum.
- **Frais de port** : ils ne sont pas comptés dans la marge.
- **Photos** : remplacer les photos d'ambiance par celles des fournisseurs.
- **Produits électriques** (plaid, surmatelas, mini chauffage, etc.) : vérifier les certifications exigées par le marché visé, **CE** en Europe, **UL/ETL/FCC** aux US.
- **Appellation « cachemire »** : les chaussons ont été renommés « effet cachemire ». À moins de 5 $, ce n'est presque sûrement pas du cachemire, et ce nom est réglementé.
- **Pages obligatoires** : mentions légales, CGV, politique de retour et de livraison, confidentialité. Shopify propose des modèles.
- **Taux de change** : 1 $ = 0,86 € est une hypothèse, à mettre à jour dans `meta.taux_usd_vers_eur`.

## Structure

```
boutique/
├── catalogue.json        ← les données (seul fichier à modifier au quotidien)
├── build.mjs             ← le script de génération (Node 18+, sans dépendance)
├── src/                  ← style, scripts et photos
├── dist/                 ← site généré
└── exports/              ← CSV Shopify, tableau des marges, liste des liens
```
