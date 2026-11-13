# Catalogue interne : prix, marges et fournisseurs

> Document généré par `node build.mjs` à partir de `catalogue.json` (mise à jour du catalogue : 2026-11-13). Ne pas modifier à la main : modifier le JSON puis relancer le script.

## Règle de marge

Chaque produit se vend au moins **2 fois** son prix d'achat, même au prix d'achat le plus haut relevé, en France comme aux US. Le script refuse un catalogue qui ne respecte pas cette règle.

- **Coût retenu** : le haut de la fourchette du prix d'achat, **hors frais de port**.
- **Taux de change** : 1 $ = 0,86 € (à mettre à jour dans `catalogue.json` → `meta.taux_usd_vers_eur`).
- **Coef.** : prix de vente ÷ coût, au prix d'achat le plus haut puis le plus bas (« pire → meilleur »).
- **Achat max pour x2** : le prix d'achat à ne pas dépasser chez le fournisseur.
- **Marge après TVA** : marge si la boutique facture la TVA française (20 %), c'est-à-dire prix ÷ 1,2 − coût.
- **Vente US** : par défaut le même chiffre en dollars. Quand cela ferait passer sous x2, le produit a un prix US propre (`prix_vente_us`).
- ⚠ = coefficient inférieur à 2,5 : la règle est respectée, mais il reste peu de place pour le port, la publicité et les frais de paiement.

## Synthèse

| Indicateur | Valeur |
|---|---|
| Produits au catalogue | 31 (dont 7 nouveautés) |
| Prix d'achat vérifiés / estimés | 21 / 10 |
| Prix de vente moyen | 37,90 € |
| Coefficient le plus bas (pire cas, France et US) | 2,01 |
| Coefficient moyen (pire cas, France) | 3,04 |
| Produits sous 2,5 en France (⚠) | 15 |

## Produits vedettes (page d’accueil)

1. Diffuseur humidificateur effet flamme (39 €)
2. Sweat-plaid oversize sherpa (42 €)
3. Chauffe-tasse électrique (22 €)
4. Chaussettes chauffantes rechargeables (64 €)
5. Lampe chauffe-bougie (49 €)

## Sélection de Noël

| Produit | Achat relevé | Fiabilité | Vente | Coût max | Coef. (pire → meilleur) | Achat max pour x2 | Marge brute | Marge après TVA | Vente US (coef.) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| (nouveau) Guirlande rideau lumineuse LED | 6 à 10 $ | Estimation | 24 € | 8,60 € | 2,79 → 4,65 | 13,95 $ | 15,40 € | 11,40 € | 24 $ (2,40) |
| (nouveau) Sapin lumineux de table | 4,70 $ | Vérifié | 19 € | 4,04 € | 4,70 | 11,05 $ | 14,96 € | 11,79 € | 19 $ (4,04) |
| (nouveau) Housses de coussin de Noël (lot de 4) | 3,36 à 11,80 $ | Estimation | 24 € | 10,15 € | 2,36 → 8,31 ⚠ | 13,95 $ | 13,85 € | 9,85 € | 24 $ (2,03) |
| (nouveau) Chaussettes de Noël toutes douces (3 paires) | 3 à 6 $ | Estimation | 16 € | 5,16 € | 3,10 → 6,20 | 9,30 $ | 10,84 € | 8,17 € | 16 $ (2,67) |

## Couvertures et textiles

| Produit | Achat relevé | Fiabilité | Vente | Coût max | Coef. (pire → meilleur) | Achat max pour x2 | Marge brute | Marge après TVA | Vente US (coef.) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Plaid chauffant électrique | 17 à 30 $ | Vérifié | 59 € | 25,80 € | 2,29 → 4,04 ⚠ | 34,30 $ | 33,20 € | 23,37 € | 62 $ (2,07) |
| ★ Sweat-plaid oversize sherpa | 12 à 22 $ | Vérifié | 42 € | 18,92 € | 2,22 → 4,07 ⚠ | 24,42 $ | 23,08 € | 16,08 € | 45 $ (2,05) |
| Pack plaid + housses de coussin assorties | 12 à 20 € | Estimation | 49 € | 20,00 € | 2,45 → 4,08 ⚠ | 24,50 € | 29,00 € | 20,83 € | 49 $ (2,11) |
| Draps en flanelle | 15 à 25 € | Estimation | 54 € | 25,00 € | 2,16 → 3,60 ⚠ | 27,00 € | 29,00 € | 20,00 € | 59 $ (2,03) |
| Surmatelas chauffant | 25 à 35 $ | Vérifié | 79 € | 30,10 € | 2,62 → 3,67 | 45,93 $ | 48,90 € | 35,73 € | 79 $ (2,26) |
| Rideaux thermiques isolants (la paire) | 9 à 25 $ | Vérifié | 44 € | 21,50 € | 2,05 → 5,68 ⚠ | 25,58 $ | 22,50 € | 15,17 € | 52 $ (2,08) |

## Chauffage personnel

| Produit | Achat relevé | Fiabilité | Vente | Coût max | Coef. (pire → meilleur) | Achat max pour x2 | Marge brute | Marge après TVA | Vente US (coef.) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Chauffe-pieds sous le bureau | 6 à 20 $ | Vérifié | 39 € | 17,20 € | 2,27 → 7,56 ⚠ | 22,67 $ | 21,80 € | 15,30 € | 42 $ (2,10) |
| Chaussons chauffants rechargeables | 19,73 à 20,77 $ | Vérifié | 39 € | 17,86 € | 2,18 → 2,30 ⚠ | 22,67 $ | 21,14 € | 14,64 € | 42 $ (2,02) |
| Chaussons d'intérieur effet cachemire | ~4,80 $ | Vérifié | 22 € | 4,13 € | 5,33 | 12,79 $ | 17,87 € | 14,21 € | 22 $ (4,58) |
| ★ Chaussettes chauffantes rechargeables | 15 à 20 $ | Vérifié | 64 € | 17,20 € | 3,72 → 4,96 | 37,21 $ | 46,80 € | 36,13 € | 64 $ (3,20) |
| Chauffe-mains rechargeables (pack de 2) | 5 à 15 $ | Vérifié | 27 € | 12,90 € | 2,09 → 6,28 ⚠ | 15,70 $ | 14,10 € | 9,60 € | 32 $ (2,13) |
| Gants chauffants USB | ~10 $ | Vérifié | 29 € | 8,60 € | 3,37 | 16,86 $ | 20,40 € | 15,57 € | 29 $ (2,90) |
| Écharpe chauffante USB | ~4,50 $ | Vérifié | 24 € | 3,87 € | 6,20 | 13,95 $ | 20,13 € | 16,13 € | 24 $ (5,33) |
| Coussin de siège chauffant | 15 à 25 € | Estimation | 52 € | 25,00 € | 2,08 → 3,47 ⚠ | 26,00 € | 27,00 € | 18,33 € | 59 $ (2,03) |
| Bouillotte électrique rechargeable | 3 à 8 € | Estimation | 22 € | 8,00 € | 2,75 → 7,33 | 11,00 € | 14,00 € | 10,33 € | 22 $ (2,36) |
| Ceinture chauffante avec bouillotte | 3 à 4 $ | Vérifié | 19 € | 3,44 € | 5,52 → 7,36 | 11,05 $ | 15,56 € | 12,39 € | 19 $ (4,75) |
| Masque chauffant pour les yeux | 4 à 8 € | Estimation | 22 € | 8,00 € | 2,75 → 5,50 | 11,00 € | 14,00 € | 10,33 € | 22 $ (2,36) |
| Mini chauffage céramique | 10 à 22 $ | Vérifié | 39 € | 18,92 € | 2,06 → 4,53 ⚠ | 22,67 $ | 20,08 € | 13,58 € | 45 $ (2,05) |

## Bureau et télétravail

| Produit | Achat relevé | Fiabilité | Vente | Coût max | Coef. (pire → meilleur) | Achat max pour x2 | Marge brute | Marge après TVA | Vente US (coef.) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| Tapis de bureau chauffant | 9 à 23 $ | Vérifié | 42 € | 19,78 € | 2,12 → 5,43 ⚠ | 24,42 $ | 22,22 € | 15,22 € | 47 $ (2,04) |
| ★ Chauffe-tasse électrique | 3 à 8 $ | Vérifié | 22 € | 6,88 € | 3,20 → 8,53 | 12,79 $ | 15,12 € | 11,45 € | 22 $ (2,75) |
| Mug chauffant intelligent | ~25 $ | Vérifié | 69 € | 21,50 € | 3,21 | 40,12 $ | 47,50 € | 36,00 € | 69 $ (2,76) |
| Lunch box chauffante | 12 à 18 € | Estimation | 39 € | 18,00 € | 2,17 → 3,25 ⚠ | 19,50 € | 21,00 € | 14,50 € | 42 $ (2,01) |

## Déco et ambiance

| Produit | Achat relevé | Fiabilité | Vente | Coût max | Coef. (pire → meilleur) | Achat max pour x2 | Marge brute | Marge après TVA | Vente US (coef.) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| ★ Diffuseur humidificateur effet flamme | 6 à 10 $ | Vérifié | 39 € | 8,60 € | 4,53 → 7,56 | 22,67 $ | 30,40 € | 23,90 € | 39 $ (3,90) |
| ★ Lampe chauffe-bougie | 23,91 $ | Vérifié | 49 € | 20,56 € | 2,38 ⚠ | 28,49 $ | 28,44 € | 20,27 € | 49 $ (2,05) |
| (nouveau) Bougies LED sans flamme (lot de 3) | 8 à 12 $ | Estimation | 29 € | 10,32 € | 2,81 → 4,22 | 16,86 $ | 18,68 € | 13,85 € | 29 $ (2,42) |
| (nouveau) Lampe lune 3D | 10,61 à 19,68 $ | Vérifié | 39 € | 16,92 € | 2,30 → 4,27 ⚠ | 22,67 $ | 22,08 € | 15,58 € | 42 $ (2,13) |
| (nouveau) Projecteur galaxie astronaute | ~10,33 $ | Vérifié | 39 € | 8,88 € | 4,39 | 22,67 $ | 30,12 € | 23,62 € | 39 $ (3,78) |

★ = coup de cœur de la page d’accueil.

## Fournisseurs

« Fiche produit » = page d’un article précis. « Recherche » ou « catégorie » = page de résultats : il faut encore choisir une annonce précise (avis, délais, entrepôt US/UE) dont le prix reste sous l’achat maximum.

- **Plaid chauffant électrique**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-throw-blanket-electric.html
  - BigBuy (catégorie) : https://www.bigbuy.eu/fr/shop/category/maison-et-cuisine-textiles-de-maison
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/heated+blanket.html
- **Sweat-plaid oversize sherpa**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-sherpa-blanket-hoodie.html
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/winter-hoodie-blanket-with-button-design-warm-home-clothes-women-men-oversized-pullover-p-1592402824729088000.html
  - BigBuy (catégorie) : https://www.bigbuy.eu/fr/shop/category/vetements-homme_19729
- **Pack plaid + housses de coussin assorties**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-throw-blanket-pillow-cover-set.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/throw+blanket.html
- **Draps en flanelle**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-flannel-bed-sheet-set.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/flannel+bedding+set.html
- **Surmatelas chauffant**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-electric-heating-mattress-pad.html
  - BigBuy (catégorie) : https://www.bigbuy.eu/fr/shop/category/linge-de-lit-et-oreillers-couvertures-electriques-et-chauffe-matelas
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/electric+blanket.html
- **Rideaux thermiques isolants (la paire)**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-insulated-thermal-curtains.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/blackout+curtain.html
- **Chauffe-pieds sous le bureau**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-office-foot-warmer.html
  - AliExpress (fiche produit) : https://www.aliexpress.us/item/3256805895271748.html
  - BigBuy (fiche produit) : https://www.bigbuy.eu/en/shop/product/electric-heat-pad-hemat-innovagoods_282037
  - CJ Dropshipping (fiche produit, prix à relever) : https://cjdropshipping.com/product/gaobang-foot-warmer-charging-usb-unplugged-foot-warmer-artifact-p-1491610010227183616.html
- **Chaussons chauffants rechargeables**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-usb-heated-slippers.html
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/electric-heating-shoes-rechargeable-foot-warmer-artifact-heating-home-shoes-winter-warm-temperature-regulating-cotton-shoes-p-2411031308311601800.html
- **Chaussons d'intérieur effet cachemire**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-cashmere-slippers.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/plush+slippers.html
- **Chaussettes chauffantes rechargeables**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-heated-socks-rechargeable.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/heated+socks.html
- **Chauffe-mains rechargeables (pack de 2)**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-usb-hand-warmer-rechargeable.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/hand+warmer.html
- **Gants chauffants USB**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-usb-heated-gloves.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/usb+heated+gloves.html
- **Écharpe chauffante USB**
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/heating-scarf-usb-electric-heated-neck-wrap-heating-pad-pain-relief-three-gear-temperature-control-neck-warmer-for-women-men-p-2410090540211619700.html
- **Coussin de siège chauffant**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-heated-seat-cushion.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/heated+seat+cushion.html
- **Bouillotte électrique rechargeable**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-electric-hot-water-bottle.html
  - BigBuy (fiche produit) : https://www.bigbuy.eu/fr/shop/product/bouillotte-d-eau-chaude-reglable-rechargeable-hutter-innovagoods-gris-400-w_144668
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/electric+hot+water+bottle.html
- **Ceinture chauffante avec bouillotte**
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/bottle+warmer.html
- **Masque chauffant pour les yeux**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-usb-heated-eye-mask.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/heated+eye+mask.html
- **Mini chauffage céramique**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-desk-heater-mini.html
  - BigBuy (fiche produit) : https://www.bigbuy.eu/fr/chauffage-thermo-ceramique-sur-prise-heatpod-innovagoods-400w_100837.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/mini+heater.html
- **Tapis de bureau chauffant**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-heated-mouse-pad.html
  - AliExpress (fiche produit) : https://www.aliexpress.us/item/3256810199537303.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/heated+mouse+pad.html
- **Chauffe-tasse électrique**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-mug-warmer.html
  - AliExpress (fiche produit) : https://www.aliexpress.us/item/3256805727494216.html
  - CJ Dropshipping (fiche produit, 6,65 à 13,62 $ selon la variante) : https://cjdropshipping.com/product/usb-cup-heater-smart-thermostatic-heating-plate-3-temperature-adjustment-heating-coaster-heater-pad-for-tea-coffee-milk-gift-set-p-1479292500630966272.html
- **Mug chauffant intelligent**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-smart-heated-mug.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/smart+mug.html
- **Lunch box chauffante**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-electric-heated-lunch-box.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/electric+lunch+box.html
- **Diffuseur humidificateur effet flamme**
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/newest-rgb-flame-aroma-diffuser-130ml-3d-colorful-flame-humidifier-fire-volcano-diffuser-flame-p-1578948189683077120.html
- **Lampe chauffe-bougie**
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/candle-warmer-candle-warmer-lamp-with-timer-dimmable-and-adjustable-height-candle-lamp-warmer-compatible-with-jar-candles-for-home-decor-electric-wax-melter-warmer-wooden-base-black-p-1687009800938737664.html
- **Bougies LED sans flamme (lot de 3)**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-flameless-led-candles-remote.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/led+flameless+candles.html
- **Lampe lune 3D**
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/rambery-moon-lamp-3d-print-night-light-rechargeable-3-color-tap-control-lamp-lights-p-1DC11DAB-FAC4-492D-B532-4A69EC8C512D.html
- **Projecteur galaxie astronaute**
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/creative-astronaut-galaxy-starry-sky-projector-nightlight-usb-atmospher-bedroom-table-lamp-p-1427515807545561088.html
- **Guirlande rideau lumineuse LED**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-led-curtain-string-lights.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/curtain+string+lights.html
- **Sapin lumineux de table**
  - CJ Dropshipping (fiche produit) : https://cjdropshipping.com/product/led-christmas-tree-spiral-light-table-ornament-wrought-iron-xmas-tree-bedroom-desk-lamp-christmas-atmosphere-night-light-decor-p-2409270619361600100.html
- **Housses de coussin de Noël (lot de 4)**
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/christmas+cushion+cover.html
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-christmas-pillow-covers.html
- **Chaussettes de Noël toutes douces (3 paires)**
  - AliExpress (recherche) : https://www.aliexpress.com/w/wholesale-christmas-fuzzy-socks.html
  - CJ Dropshipping (recherche) : https://cjdropshipping.com/search/christmas+socks.html

## À compléter ou vérifier

- **Plaid chauffant électrique** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Sweat-plaid oversize sherpa** : photo d'ambiance à remplacer par la photo du fournisseur.
- **Pack plaid + housses de coussin assorties** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Draps en flanelle** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur. _Prix de vente passé de 49 à 54 € pour garder le x2 si l'achat est au plus haut (25 €)._
- **Surmatelas chauffant** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Rideaux thermiques isolants (la paire)** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Chauffe-pieds sous le bureau** : photo d'ambiance à remplacer par la photo du fournisseur.
- **Chaussons chauffants rechargeables** : photo d'ambiance à remplacer par la photo du fournisseur. _Prix CJ : 19,73 à 20,77 $ selon la couleur et la pointure, batterie externe et câble USB inclus. Prix de vente passé de 34 à 39 € pour garder le x2._
- **Chaussons d'intérieur effet cachemire** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur. _Nom du brief : « Chaussons en cachemire ». Renommé « effet cachemire » : à ce prix, ce n'est presque sûrement pas du vrai cachemire, et l'appellation est encadrée (étiquetage textile UE, Wool Products Labeling Act aux US)._
- **Chaussettes chauffantes rechargeables** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Chauffe-mains rechargeables (pack de 2)** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur. _Le lien CJ du brief pointait vers une recherche « bottle warmer » (erreur de copier-coller) : remplacé par une recherche « hand warmer »._
- **Gants chauffants USB** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Écharpe chauffante USB** : photo d'ambiance à remplacer par la photo du fournisseur.
- **Coussin de siège chauffant** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur. _Prix de vente passé de 45 à 52 € pour garder le x2 si l'achat est au plus haut (25 €)._
- **Bouillotte électrique rechargeable** : prix d'achat estimé, à vérifier chez le fournisseur ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Ceinture chauffante avec bouillotte** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Masque chauffant pour les yeux** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Mini chauffage céramique** : photo d'ambiance à remplacer par la photo du fournisseur.
- **Tapis de bureau chauffant** : photo d'ambiance à remplacer par la photo du fournisseur. _Prix de vente passé de 34 à 42 € pour garder le x2 si l'achat est au plus haut (23 $)._
- **Chauffe-tasse électrique** : photo d'ambiance à remplacer par la photo du fournisseur. _Sur la fiche CJ, la variante coffret monte à 13,62 $ : rester sous le prix d'achat maximum pour garder le x2._
- **Mug chauffant intelligent** : pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Lunch box chauffante** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Diffuseur humidificateur effet flamme** : photo d'ambiance à remplacer par la photo du fournisseur. _Lien coupé dans le brief, complété depuis CJ. Fiche CJ : 6,99 $ relevé le 13/11/2026, modèle DQ-705, 130 ml, blanc ou noir, arrêt automatique sans eau._
- **Lampe chauffe-bougie** : photo d'ambiance à remplacer par la photo du fournisseur. _Fiche CJ : base en bois, 4 niveaux d'intensité, minuterie 2/4/8 h, hauteur réglable, bougie non fournie._
- **Bougies LED sans flamme (lot de 3)** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
- **Lampe lune 3D** : photo d'ambiance à remplacer par la photo du fournisseur. _Fiche CJ : tailles de 10 à 20 cm, de 10,61 à 19,68 $. La télécommande n'est fournie qu'avec la version 16 couleurs._
- **Projecteur galaxie astronaute** : photo d'ambiance à remplacer par la photo du fournisseur. _Fiche CJ : à partir de 10,33 $ l'unité. Les prix plus élevés de la fiche (jusqu'à 59,76 $) correspondent à des lots de plusieurs pièces._
- **Guirlande rideau lumineuse LED** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur. _Les deux fiches CJ trouvées (19,87 $ et 26,88 $) sont trop chères pour ce prix de vente : viser une guirlande USB à 10 $ ou moins._
- **Sapin lumineux de table** : photo d'ambiance à remplacer par la photo du fournisseur. _Fiche CJ : sapin spirale en fer forgé, environ 12 × 12 × 33 cm, à piles, usage intérieur._
- **Housses de coussin de Noël (lot de 4)** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur. _Prix calculé pour 4 housses à partir d'une annonce CJ « Christmas Cushion Cover Pillowcase » vue à 0,84–2,95 $ pièce sur une page de liste. Fiche précise à retrouver, taille à vérifier (45 × 45 cm conseillé)._
- **Chaussettes de Noël toutes douces (3 paires)** : prix d'achat estimé, à vérifier chez le fournisseur ; pas encore de fiche fournisseur précise ; photo d'ambiance à remplacer par la photo du fournisseur.
