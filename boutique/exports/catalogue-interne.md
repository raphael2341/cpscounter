# Catalogue interne : prix, marges et fournisseurs

> Document généré par `node build.mjs` à partir de `catalogue.json` (mise à jour du catalogue : 2026-11-12). Ne pas modifier à la main : modifier le JSON puis relancer le script.

## Hypothèses de calcul

- **Coût retenu** : le haut de la fourchette du prix d'achat (scénario prudent), **hors livraison**.
- **Taux de change** : 1 $ = 0,86 € (à mettre à jour dans `catalogue.json` → `meta.taux_usd_vers_eur`).
- **Marge brute** : prix de vente − coût. **Coef.** : prix de vente ÷ coût, au haut puis au bas de la fourchette d'achat (« pire → meilleur »).
- **Marge après TVA** : marge si la boutique facture la TVA française (20 %), c'est-à-dire prix ÷ 1,2 − coût.
- **Marge US** : même prix affiché en dollars, coût converti en dollars (la sales tax US s'ajoute au prix, elle ne le réduit pas).
- ⚠ = coefficient inférieur à 2,5 : il reste peu de place pour la livraison, la publicité et les frais de paiement.

## Synthèse

| Indicateur | Valeur |
|---|---|
| Produits au catalogue | 24 |
| Prix d'achat vérifiés / estimés / à compléter | 17 / 6 / 1 |
| Prix de vente moyen | 39,58 € |
| Coefficient moyen (pire cas) | 3,0 |
| Produits à marge serrée (⚠) | 12 |

Produits à marge serrée, du plus serré au moins serré :

- **Tapis de bureau chauffant** : coef. 1,72 (4,39 au prix bas), coût jusqu'à 19,78 € pour 34,00 € (vérifié)
- **Coussin de siège chauffant** : coef. 1,80 (3,00 au prix bas), coût jusqu'à 25,00 € pour 45,00 € (estimation)
- **Draps en flanelle** : coef. 1,96 (3,27 au prix bas), coût jusqu'à 25,00 € pour 49,00 € (estimation)
- **Chaussons chauffants rechargeables** : coef. 1,98 (4,39 au prix bas), coût jusqu'à 17,20 € pour 34,00 € (vérifié)
- **Rideaux thermiques isolants (la paire)** : coef. 2,05 (5,68 au prix bas), coût jusqu'à 21,50 € pour 44,00 € (vérifié)
- **Mini chauffage céramique** : coef. 2,06 (4,53 au prix bas), coût jusqu'à 18,92 € pour 39,00 € (vérifié)
- **Chauffe-mains rechargeables (pack de 2)** : coef. 2,09 (6,28 au prix bas), coût jusqu'à 12,90 € pour 27,00 € (vérifié)
- **Lunch box chauffante** : coef. 2,17 (3,25 au prix bas), coût jusqu'à 18,00 € pour 39,00 € (estimation)
- **Sweat-plaid oversize sherpa** : coef. 2,22 (4,07 au prix bas), coût jusqu'à 18,92 € pour 42,00 € (vérifié)
- **Chauffe-pieds sous le bureau** : coef. 2,27 (7,56 au prix bas), coût jusqu'à 17,20 € pour 39,00 € (vérifié)
- **Plaid chauffant électrique** : coef. 2,29 (4,04 au prix bas), coût jusqu'à 25,80 € pour 59,00 € (vérifié)
- **Pack plaid + housses de coussin assorties** : coef. 2,45 (4,08 au prix bas), coût jusqu'à 20,00 € pour 49,00 € (estimation)

## Produits vedettes (page d’accueil)

1. Diffuseur humidificateur effet flamme (39,00 €)
2. Sweat-plaid oversize sherpa (42,00 €)
3. Chauffe-tasse électrique (22,00 €)
4. Chaussettes chauffantes rechargeables (64,00 €)
5. Lampe chauffe-bougie (39,00 €)

## Couvertures et textiles

| Produit | Achat (brief) | Fiabilité | Vente | Coût max | Marge brute | Coef. (pire → meilleur) | Marge après TVA | Marge US |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Plaid chauffant électrique | 17 à 30 $ | Vérifié | 59,00 € | 25,80 € | 33,20 € | 2,29 → 4,04 ⚠ | 23,37 € | 29,00 $ |
| ★ Sweat-plaid oversize sherpa | 12 à 22 $ | Vérifié | 42,00 € | 18,92 € | 23,08 € | 2,22 → 4,07 ⚠ | 16,08 € | 20,00 $ |
| Pack plaid + housses de coussin assorties | 12 à 20 € | Estimation | 49,00 € | 20,00 € | 29,00 € | 2,45 → 4,08 ⚠ | 20,83 € | 25,74 $ |
| Draps en flanelle | 15 à 25 € | Estimation | 49,00 € | 25,00 € | 24,00 € | 1,96 → 3,27 ⚠ | 15,83 € | 19,93 $ |
| Surmatelas chauffant | 25 à 35 $ | Vérifié | 79,00 € | 30,10 € | 48,90 € | 2,62 → 3,67 | 35,73 € | 44,00 $ |
| Rideaux thermiques isolants (la paire) | 9 à 25 $ | Vérifié | 44,00 € | 21,50 € | 22,50 € | 2,05 → 5,68 ⚠ | 15,17 € | 19,00 $ |

## Chauffage personnel

| Produit | Achat (brief) | Fiabilité | Vente | Coût max | Marge brute | Coef. (pire → meilleur) | Marge après TVA | Marge US |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Chauffe-pieds sous le bureau | 6 à 20 $ | Vérifié | 39,00 € | 17,20 € | 21,80 € | 2,27 → 7,56 ⚠ | 15,30 € | 19,00 $ |
| Chaussons chauffants rechargeables | 9 à 20 $ | Vérifié | 34,00 € | 17,20 € | 16,80 € | 1,98 → 4,39 ⚠ | 11,13 € | 14,00 $ |
| Chaussons d'intérieur effet cachemire | ~4,80 $ | Vérifié | 22,00 € | 4,13 € | 17,87 € | 5,33 | 14,21 € | 17,20 $ |
| ★ Chaussettes chauffantes rechargeables | 15 à 20 $ | Vérifié | 64,00 € | 17,20 € | 46,80 € | 3,72 → 4,96 | 36,13 € | 44,00 $ |
| Chauffe-mains rechargeables (pack de 2) | 5 à 15 $ | Vérifié | 27,00 € | 12,90 € | 14,10 € | 2,09 → 6,28 ⚠ | 9,60 € | 12,00 $ |
| Gants chauffants USB | ~10 $ | Vérifié | 29,00 € | 8,60 € | 20,40 € | 3,37 | 15,57 € | 19,00 $ |
| Écharpe chauffante USB | ~4,50 $ | Vérifié | 24,00 € | 3,87 € | 20,13 € | 6,20 | 16,13 € | 19,50 $ |
| Coussin de siège chauffant | 15 à 25 € | Estimation | 45,00 € | 25,00 € | 20,00 € | 1,80 → 3,00 ⚠ | 12,50 € | 15,93 $ |
| Bouillotte électrique rechargeable | 3 à 8 € | Estimation | 22,00 € | 8,00 € | 14,00 € | 2,75 → 7,33 | 10,33 € | 12,70 $ |
| Ceinture chauffante avec bouillotte | 3 à 4 $ | Vérifié | 19,00 € | 3,44 € | 15,56 € | 5,52 → 7,36 | 12,39 € | 15,00 $ |
| Masque chauffant pour les yeux | 4 à 8 € | Estimation | 22,00 € | 8,00 € | 14,00 € | 2,75 → 5,50 | 10,33 € | 12,70 $ |
| Mini chauffage céramique | 10 à 22 $ | Vérifié | 39,00 € | 18,92 € | 20,08 € | 2,06 → 4,53 ⚠ | 13,58 € | 17,00 $ |

## Bureau et télétravail

| Produit | Achat (brief) | Fiabilité | Vente | Coût max | Marge brute | Coef. (pire → meilleur) | Marge après TVA | Marge US |
|---|---|---|---:|---:|---:|---:|---:|---:|
| Tapis de bureau chauffant | 9 à 23 $ | Vérifié | 34,00 € | 19,78 € | 14,22 € | 1,72 → 4,39 ⚠ | 8,55 € | 11,00 $ |
| ★ Chauffe-tasse électrique | 3 à 8 $ | Vérifié | 22,00 € | 6,88 € | 15,12 € | 3,20 → 8,53 | 11,45 € | 14,00 $ |
| Mug chauffant intelligent | ~25 $ | Vérifié | 69,00 € | 21,50 € | 47,50 € | 3,21 | 36,00 € | 44,00 $ |
| Lunch box chauffante | 12 à 18 € | Estimation | 39,00 € | 18,00 € | 21,00 € | 2,17 → 3,25 ⚠ | 14,50 € | 18,07 $ |

## Déco et ambiance

| Produit | Achat (brief) | Fiabilité | Vente | Coût max | Marge brute | Coef. (pire → meilleur) | Marge après TVA | Marge US |
|---|---|---|---:|---:|---:|---:|---:|---:|
| ★ Diffuseur humidificateur effet flamme | 6 à 10 $ | Vérifié | 39,00 € | 8,60 € | 30,40 € | 4,53 → 7,56 | 23,90 € | 29,00 $ |
| ★ Lampe chauffe-bougie | — | À compléter | 39,00 € (à valider) | — | — | — | — | — |

## Fournisseurs

« Fiche » = page d’un produit précis. « Recherche » ou « Catégorie » = page de résultats : il faut encore choisir une annonce précise (avis, délais, entrepôt US/UE) avant de mettre le produit en ligne.

- **Plaid chauffant électrique**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-throw-blanket-electric.html
  - BigBuy (Catégorie) : https://www.bigbuy.eu/fr/shop/category/maison-et-cuisine-textiles-de-maison
- **Sweat-plaid oversize sherpa**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-sherpa-blanket-hoodie.html
  - CJ Dropshipping (Fiche) : https://cjdropshipping.com/product/winter-hoodie-blanket-with-button-design-warm-home-clothes-women-men-oversized-pullover-p-1592402824729088000.html
  - BigBuy (Catégorie) : https://www.bigbuy.eu/fr/shop/category/vetements-homme_19729
- **Pack plaid + housses de coussin assorties**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-throw-blanket-pillow-cover-set.html
- **Draps en flanelle**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-flannel-bed-sheet-set.html
- **Surmatelas chauffant**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-electric-heating-mattress-pad.html
  - BigBuy (Catégorie) : https://www.bigbuy.eu/fr/shop/category/linge-de-lit-et-oreillers-couvertures-electriques-et-chauffe-matelas
- **Rideaux thermiques isolants (la paire)**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-insulated-thermal-curtains.html
- **Chauffe-pieds sous le bureau**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-office-foot-warmer.html
  - AliExpress (Fiche) : https://www.aliexpress.us/item/3256805895271748.html
  - BigBuy (Fiche) : https://www.bigbuy.eu/en/shop/product/electric-heat-pad-hemat-innovagoods_282037
- **Chaussons chauffants rechargeables**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-usb-heated-slippers.html
  - CJ Dropshipping (Fiche) : https://cjdropshipping.com/product/electric-heating-shoes-rechargeable-foot-warmer-artifact-heating-home-shoes-winter-warm-temperature-regulating-cotton-shoes-p-2411031308311601800.html
- **Chaussons d'intérieur effet cachemire**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-cashmere-slippers.html
- **Chaussettes chauffantes rechargeables**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-heated-socks-rechargeable.html
- **Chauffe-mains rechargeables (pack de 2)**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-usb-hand-warmer-rechargeable.html
  - CJ Dropshipping (Recherche) : https://cjdropshipping.com/search/bottle+warmer.html
- **Gants chauffants USB**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-usb-heated-gloves.html
- **Écharpe chauffante USB**
  - CJ Dropshipping (Fiche) : https://cjdropshipping.com/product/heating-scarf-usb-electric-heated-neck-wrap-heating-pad-pain-relief-three-gear-temperature-control-neck-warmer-for-women-men-p-2410090540211619700.html
- **Coussin de siège chauffant**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-heated-seat-cushion.html
- **Bouillotte électrique rechargeable**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-electric-hot-water-bottle.html
  - BigBuy (Fiche) : https://www.bigbuy.eu/fr/shop/product/bouillotte-d-eau-chaude-reglable-rechargeable-hutter-innovagoods-gris-400-w_144668
- **Ceinture chauffante avec bouillotte**
  - CJ Dropshipping (Recherche) : https://cjdropshipping.com/search/bottle+warmer.html
- **Masque chauffant pour les yeux**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-usb-heated-eye-mask.html
- **Mini chauffage céramique**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-desk-heater-mini.html
  - BigBuy (Fiche) : https://www.bigbuy.eu/fr/chauffage-thermo-ceramique-sur-prise-heatpod-innovagoods-400w_100837.html
- **Tapis de bureau chauffant**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-heated-mouse-pad.html
  - AliExpress (Fiche) : https://www.aliexpress.us/item/3256810199537303.html
- **Chauffe-tasse électrique**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-mug-warmer.html
  - AliExpress (Fiche) : https://www.aliexpress.us/item/3256805727494216.html
- **Mug chauffant intelligent**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-smart-heated-mug.html
- **Lunch box chauffante**
  - AliExpress (Recherche) : https://www.aliexpress.com/w/wholesale-electric-heated-lunch-box.html
- **Diffuseur humidificateur effet flamme**
  - CJ Dropshipping (Fiche) : https://cjdropshipping.com/product/newest-rgb-flame-aroma-diffuser-130ml-3d-colorful-flame-humidifier-fire-volcano-diffuser-flame-p-1578948189683077120.html
- **Lampe chauffe-bougie**
  - _Aucun fournisseur renseigné_

## À compléter ou vérifier

- **Plaid chauffant électrique** : pas encore de fiche fournisseur précise ; photo manquante.
- **Sweat-plaid oversize sherpa** : photo manquante.
- **Pack plaid + housses de coussin assorties** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo manquante.
- **Draps en flanelle** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo manquante.
- **Surmatelas chauffant** : pas encore de fiche fournisseur précise ; photo manquante.
- **Rideaux thermiques isolants (la paire)** : pas encore de fiche fournisseur précise ; photo manquante.
- **Chauffe-pieds sous le bureau** : photo manquante.
- **Chaussons chauffants rechargeables** : photo manquante.
- **Chaussons d'intérieur effet cachemire** : pas encore de fiche fournisseur précise ; photo manquante. _Nom du brief : « Chaussons en cachemire ». Renommé « effet cachemire » : à ce prix, ce n'est presque sûrement pas du vrai cachemire, et l'appellation est encadrée (étiquetage textile UE, Wool Products Labeling Act aux US)._
- **Chaussettes chauffantes rechargeables** : pas encore de fiche fournisseur précise ; photo manquante.
- **Chauffe-mains rechargeables (pack de 2)** : pas encore de fiche fournisseur précise ; photo manquante. _Le lien CJ du brief est une recherche « bottle warmer » (le même que pour la ceinture bouillotte) : sans doute une erreur de copier-coller, à remplacer._
- **Gants chauffants USB** : pas encore de fiche fournisseur précise ; photo manquante.
- **Écharpe chauffante USB** : photo manquante.
- **Coussin de siège chauffant** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo manquante.
- **Bouillotte électrique rechargeable** : prix d'achat estimé, à vérifier chez le fournisseur ; photo manquante.
- **Ceinture chauffante avec bouillotte** : pas encore de fiche fournisseur précise ; photo manquante.
- **Masque chauffant pour les yeux** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo manquante.
- **Mini chauffage céramique** : photo manquante.
- **Tapis de bureau chauffant** : photo manquante.
- **Chauffe-tasse électrique** : photo manquante.
- **Mug chauffant intelligent** : pas encore de fiche fournisseur précise ; photo manquante.
- **Lunch box chauffante** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo manquante.
- **Diffuseur humidificateur effet flamme** : photo manquante. _Lien coupé dans le brief, complété depuis CJ. Fiche CJ : modèle DQ-705, 130 ml, blanc ou noir, arrêt automatique sans eau._
- **Lampe chauffe-bougie** : fiche incomplète ; prix de vente à valider ; prix d'achat manquant ; pas encore de fiche fournisseur précise ; photo manquante. _Produit cité dans les vedettes, mais sa fiche manque dans le brief (coupé dans la partie Déco). Prix de vente de 39 € proposé, à valider. Prix d'achat et fournisseur à compléter._
