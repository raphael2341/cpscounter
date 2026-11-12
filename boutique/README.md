# Boutique cocooning : catalogue et aperçu du site

Tout part d'un seul fichier, `catalogue.json` : catégories, produits, prix d'achat et de vente, fournisseurs et textes en français et en anglais. La commande `node build.mjs` génère à partir de ce fichier :

| Sortie | Contenu |
|---|---|
| `dist/` | Aperçu du site en version **France (€, français)** et **US ($, anglais)** : accueil avec les 5 coups de cœur, une page par catégorie, une fiche par produit, la page « tout le catalogue ». |
| `exports/shopify-fr.csv`, `exports/shopify-us.csv` | Fichiers d'import produits pour Shopify. Tous les produits sont importés en **brouillon**. |
| `exports/catalogue-interne.md` | Tableau interne des prix, marges et fournisseurs, avec la liste de ce qui reste à compléter. |

Le marché n'est pas encore tranché ? Les deux versions sont générées à partir des mêmes données : comme demandé dans le brief, la version US reprend les mêmes chiffres en dollars.

## Voir l'aperçu

Ouvrir `dist/index.html` dans un navigateur, puis choisir France ou US. Le bouton « Ajouter au panier » n'affiche qu'un message : le paiement sera géré par la plateforme e-commerce.

Tant qu'il n'y a pas de photos, chaque produit affiche l'illustration de sa catégorie.

## Modifier le catalogue

Après chaque modification de `catalogue.json`, relancer :

```bash
node build.mjs
```

Le script vérifie le catalogue (identifiants en double, catégorie inconnue, prix manquant, etc.) et s'arrête avec un message clair en cas d'erreur.

- **Changer un prix** : `prix_vente` du produit. Le prix d'achat va dans `prix_achat` (`min`, `max`, `devise` en `USD` ou `EUR`, `fiabilite` : `verifie` ou `estimation`).
- **Ajouter un produit** : copier un bloc existant dans `produits`, puis changer l'`id`, la `categorie` et les textes `fr` / `en`. Les `slug` deviennent les adresses des pages : lettres minuscules, chiffres et tirets uniquement.
- **Choisir les coups de cœur** : `vedette` vaut 1 à 5 pour les produits mis en avant (dans l'ordre d'affichage), `null` pour les autres.
- **Ajouter une photo** : renseigner `"image"` avec une URL (`https://…`), ou déposer le fichier dans `src/images/` et écrire `"image": "images/nom-du-fichier.jpg"`. Les URL passent aussi dans l'export Shopify.
- **Nom de la boutique, slogan, textes d'accueil, garanties affichées** : bloc `marches.fr` ou `marches.us`. « Maison Cocon » (FR) et « Warm Nest » (US) sont provisoires, repris de vos idées de noms de domaine.
- **Taux de change, TVA, seuil de marge** : bloc `meta`.

## Importer dans Shopify

1. Dans l'admin Shopify : *Produits → Importer*, puis choisir `exports/shopify-fr.csv` (ou `-us`). Faire d'abord un essai sur 2 ou 3 lignes.
2. Les produits arrivent en **brouillon**, sans photo : ajouter les visuels, puis passer chaque produit en « Actif ».
3. Créer les collections en mode **automatique** :
   - une par catégorie, avec la condition « Type de produit est égal à … » (par exemple *Chauffage personnel*) ;
   - « Coups de cœur » avec la condition « Balise produit est égal à *Coup de cœur* » (*Favorite* pour la version US) ;
   - « Idées cadeaux » avec la balise *Idée cadeau* (*Gift idea*).
4. Le champ « Coût par article » reprend le **haut** de la fourchette du prix d'achat, converti dans la devise de la boutique. Shopify s'en sert pour ses rapports de marge.

## Ce qui reste à faire avant le lancement

Le détail par produit se trouve dans `exports/catalogue-interne.md`. Les points principaux :

- **Brief incomplet** : il s'arrête au milieu de la partie « Déco et ambiance ». 24 produits sur les 30 annoncés sont saisis. La **lampe chauffe-bougie** (5ᵉ coup de cœur) a une fiche provisoire : son prix de vente de 39 € est une proposition à valider, et il manque son prix d'achat et son fournisseur.
- **Marges serrées** : 12 produits ont un coefficient inférieur à 2,5 au prix d'achat le plus haut. Les solutions : négocier ou choisir l'annonce la moins chère, monter le prix, ou garder le produit pour les ventes groupées.
- **Fournisseurs** : la plupart des liens AliExpress et BigBuy sont des pages de recherche ou de catégorie. Pour chaque produit, il faut encore choisir une annonce précise (avis, délais, entrepôt US/UE).
- **Produits électriques** (plaid, surmatelas, mini chauffage, etc.) : vérifier les certifications exigées par le marché visé, **CE** en Europe, **UL/ETL/FCC** aux US. C'est aussi un point de contrôle courant chez les plateformes de paiement et de publicité.
- **Appellation « cachemire »** : les chaussons ont été renommés « effet cachemire ». À moins de 5 $, ce n'est presque sûrement pas du cachemire, et ce nom est réglementé.
- **Pages obligatoires** : mentions légales, CGV, politique de retour et de livraison, confidentialité. Shopify propose des modèles.
- **Taux de change** : 1 $ = 0,86 € est une hypothèse, à mettre à jour dans `meta.taux_usd_vers_eur`.

## Structure

```
boutique/
├── catalogue.json        ← les données (seul fichier à modifier au quotidien)
├── build.mjs             ← le script de génération (Node 18+, sans dépendance)
├── src/                  ← style, script du site et photos éventuelles
├── dist/                 ← site généré
└── exports/              ← CSV Shopify et tableau des marges
```
