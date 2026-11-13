# Boutique cocooning, édition hiver / Noël

Tout part d'un seul fichier, `catalogue.json` : catégories, produits, fiche fournisseur de chaque produit, variantes (tailles, coloris…) avec leur prix d'achat et de vente, photos et textes en français et en anglais. La commande `node build.mjs` génère à partir de ce fichier :

| Sortie | Contenu |
|---|---|
| `dist/` | Le site en version **France (€, français)** et **US ($, anglais)** : accueil, guide cadeaux par budget, une page par catégorie, une fiche par produit. |
| `dist/apercu.html` | La même boutique dans un seul fichier autonome, photos comprises. C'est la version à ouvrir sur tablette ou téléphone, et celle de l'aperçu en ligne sur Claude. |
| `exports/shopify-fr.csv`, `exports/shopify-us.csv` | Fichiers d'import produits pour Shopify, une ligne par variante. Tous les produits sont importés en **brouillon**. |
| `exports/catalogue-interne.md` | Prix, marges et fournisseurs, variante par variante. |
| `exports/produits-et-liens.html`, `.json` | La liste des produits avec leur fiche fournisseur et le prix de chaque variante. C'est le contenu du Google Doc. |

## La règle de marge

Chaque variante se vend **au moins 2 fois son prix d'achat**, en France comme aux US. La règle est dans `catalogue.json` (`meta.coef_minimum`) et le script refuse de générer un catalogue qui ne la respecte pas : il indique la variante en cause et le prix de vente minimum.

- Le coût est le prix d'achat **hors frais de port**. Quand la fiche ne donne qu'une fourchette pour toutes les tailles, le coût d'une taille sans prix précis est le haut de la fourchette.
- La version US reprend le même chiffre en dollars, sauf quand la variante porte un `vente_us`.
- Un produit avec `"marches": ["fr"]` n'est vendu qu'en France (appareils 220 V, prise européenne).

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

- **Fiche fournisseur** : `fiche.url` est la page d'un article précis (le script refuse une page de recherche), avec son titre et le prix affiché.
- **Prix d'achat** : `prix_achat` (`min`, `max`, `devise` en `USD` ou `EUR`) est la fourchette de la fiche. Une variante dont on connaît le prix exact porte un `achat`.
- **Variantes et prix de vente** : `option` nomme le choix (Taille, Coloris, Pointure…) et `variantes` liste les choix, chacun avec son libellé `fr` / `en` et son prix de vente `vente` (et `vente_us` si besoin). Sur le site, le prix affiché suit la variante choisie, et les cartes affichent « dès … » quand les prix diffèrent.
- **Ajouter un produit** : copier un bloc existant dans `produits`, puis changer l'`id`, la `categorie`, la fiche, les variantes et les textes `fr` / `en`. Les `slug` deviennent les adresses des pages : lettres minuscules, chiffres et tirets uniquement.
- **Coups de cœur** : `vedette` vaut 1 à 5 pour les produits mis en avant sur l'accueil (dans l'ordre d'affichage), `null` pour les autres.
- **Nouveautés** : `"nouveau": true` affiche le badge « Nouveau » et place le produit dans la rangée « Nouveautés des fêtes ».
- **Guide cadeaux** : les produits s'y classent tout seuls selon leur prix le plus bas (jusqu'à 25, de 25 à 50, plus de 50).
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
4. Chaque variante arrive avec son prix et son « Coût par article » (prix d'achat de la variante, ou haut de la fourchette s'il n'est pas connu), converti dans la devise de la boutique.

## Ce qui reste à faire avant le lancement

Le détail par produit se trouve dans `exports/catalogue-interne.md`. Les points principaux :

- **Prix à confirmer** : les fiches CJ Dropshipping et AliExpress bloquent les robots, donc les prix ont été relevés le 13/11/2026 dans l'index de recherche. Pour les produits dont la fiche ne donne qu'une fourchette (plaid double face, parure polaire, lampe lune, tapis de bureau, chaussons chauffants), le prix exact de chaque taille s'affiche sur la fiche quand on la choisit.
- **Promotions AliExpress** : beaucoup de prix affichés sont des promotions, à vérifier le jour de la commande.
- **Frais de port** : ils ne sont pas comptés dans la marge.
- **Photos** : remplacer les photos d'ambiance par celles des fournisseurs.
- **Produits électriques** (plaid chauffant, mini chauffage, tapis de bureau, etc.) : vérifier les certifications exigées par le marché visé, **CE** en Europe, **UL/ETL/FCC** aux US.
- **Pages obligatoires** : mentions légales, CGV, politique de retour et de livraison, confidentialité. Shopify propose des modèles.
- **Taux de change** : 1 $ = 0,86 € est une hypothèse, à mettre à jour dans `meta.taux_usd_vers_eur`.

## Structure

```
boutique/
├── catalogue.json        ← les données (seul fichier à modifier au quotidien)
├── build.mjs             ← le script de génération (Node 18+, sans dépendance)
├── src/                  ← style, scripts et photos
├── dist/                 ← site généré
└── exports/              ← CSV Shopify, tableau des marges, liste des produits
```
