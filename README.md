# MemeForge — Générateur de mèmes

Application web Angular qui permet de créer rapidement des mèmes : upload d'image, ajout de texte personnalisé, aperçu en temps réel, téléchargement PNG et partage sur les réseaux sociaux. Une galerie locale (localStorage) garde l'historique des mèmes créés.

Projet réalisé dans le cadre de l'accès SUP INFO.

## Fonctionnalités

- **Téléchargement d'images** depuis l'ordinateur (JPG, PNG, GIF, WEBP).
- **Ajout de texte personnalisé** : plusieurs couches de texte (haut, milieu, bas), avec choix de la police, taille, couleur, contour, gras, italique, MAJUSCULES.
- **Aperçu en temps réel** : le rendu canvas est mis à jour à chaque modification.
- **Téléchargement PNG** du mème final.
- **Partage** sur X (Twitter), Facebook, WhatsApp, Telegram, Reddit, plus partage natif (Web Share API) sur mobile.
- **Galerie** des mèmes précédemment créés, persistée dans le `localStorage` du navigateur, avec aperçu en grand, re-téléchargement, partage et suppression.

## Stack technique

- **Framework** : Angular 15 (modules, routing, SCSS)
- **Langage** : TypeScript
- **Rendu** : HTML Canvas API
- **Persistance** : `localStorage` (aucun backend requis)
- 
## Prérequis

- Node.js >= 16
- npm >= 8

## Installation

```bash
git clone <url-du-repo>
cd meme-generator-angular
npm install
```

## Lancement en développement

```bash
npm start
```

Ouvre [http://localhost:4200](http://localhost:4200). L'app se recharge automatiquement à chaque modification.

## Structure du projet

```
src/
├── app/
│   ├── models/
│   │   └── meme.model.ts            # Interfaces TypeScript (Meme, MemeText)
│   ├── services/
│   │   ├── meme-storage.service.ts  # Persistance localStorage + observable
│   │   └── share.service.ts         # URLs de partage + Web Share API
│   ├── pages/
│   │   ├── editor/                  # Éditeur (upload, texte, canvas, actions)
│   │   └── gallery/                 # Galerie des mèmes sauvegardés
│   ├── shared/
│   │   └── header/                  # Barre de navigation
│   ├── app-routing.module.ts        # Routes (/editor, /gallery)
│   ├── app.component.*              # Layout principal
│   └── app.module.ts                # Module racine
├── styles.scss                      # Variables de thème (dark/light auto) + reset
└── index.html
```

## Routes

| URL         | Page    |
|-------------|---------|
| `/`         | Redirige vers `/editor` |
| `/editor`   | Éditeur de mèmes |
| `/gallery`  | Galerie des mèmes sauvegardés |

## Utilisation

1. Aller sur **Éditeur**.
2. Cliquer sur la zone *« Choisir une image »* pour charger une image depuis votre ordinateur.
3. Deux couches de texte sont ajoutées par défaut (haut / bas). Modifier le contenu, la position, la police, la taille, la couleur, le contour, le style.
4. Cliquer **+ haut / + milieu / + bas** pour ajouter d'autres textes.
5. **Télécharger PNG** pour sauvegarder le mème en local.
6. **Enregistrer dans la galerie** pour le retrouver dans la page Galerie.
7. Utiliser les boutons réseaux sociaux pour partager.

## Stockage local

Les mèmes sauvegardés sont sérialisés en JSON dans la clé `memeforge.gallery.v1` du `localStorage`. Pour tout effacer : bouton *« Tout supprimer »* dans la galerie, ou vider le stockage du navigateur.
