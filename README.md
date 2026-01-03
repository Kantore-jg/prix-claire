# PrixClair - Suivi des Prix

Application web collaborative pour suivre et consulter les prix des matériaux de construction au Burundi.

## Fonctionnalités

### 🔐 Authentification
- **3 types de comptes** : Artisans, Particuliers, Commerçants
- Inscription et connexion sécurisées
- Gestion de profil

### 📊 Consultation des prix
- **Carte interactive** : Visualisation géographique des prix
- **Liste détaillée** : Filtrage par matériau, ville, région
- **Historique** : Évolution des prix dans le temps avec graphiques
- **Prix moyens** : Calcul automatique par zone géographique

### ➕ Soumission de prix
- Formulaire simple et intuitif
- **Géolocalisation** : Automatique ou manuelle
- **Upload de photos** : Reçus ou produits
- Support pour tous les matériaux

### 🛠️ Fonctionnalités spéciales par type de compte

#### Commerçants
- **Ajouter de nouveaux matériaux** à la base de données
- Gérer leurs propres soumissions

#### Artisans
- **Commenter** les soumissions de prix
- **Voter** sur les changements de prix
- Accès à l'historique détaillé

#### Tous les utilisateurs
- Consulter tous les prix
- Voter sur les soumissions
- Signaler des prix suspects

### 🛡️ Modération communautaire
- Système de **votes** (positif/négatif)
- **Signalements** pour valider les prix
- **Badge "Contributeur fiable"** pour les utilisateurs réguliers (50+ points)

### 🔔 Alertes et tendances
- **Notifications** sur les hausses/baisse de prix
- **Graphiques d'évolution** des prix
- Alertes personnalisables par matériau et région

### 🌍 Multilingue
- Interface en **français** (par défaut)
- Structure prête pour l'ajout d'autres langues

## Technologies utilisées

- **Backend** : Node.js, Express.js
- **Template Engine** : EJS
- **Base de données** : MySQL (mysql2/promise)
- **Frontend** : Bootstrap 5, Chart.js, Leaflet (cartes)
- **Authentification** : Sessions Express, bcryptjs
- **Upload** : Multer

## Installation

### Prérequis
- Node.js (v14 ou supérieur)
- MySQL (v5.7 ou supérieur)
- npm ou yarn

### Étapes d'installation

1. **Cloner ou télécharger le projet**
```bash
cd "Suivi des Prix des Materiaux de construction"
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer la base de données**
   - Créer une base de données MySQL
   - Exécuter le script SQL : `database/schema.sql`
   ```bash
   mysql -u root -p < database/schema.sql
   ```

4. **Configurer les variables d'environnement**
   - Copier `.env.example` vers `.env`
   - Modifier les valeurs selon votre configuration :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=suivi_prix_materiaux
   DB_PORT=3306
   SESSION_SECRET=votre_secret_session
   PORT=3000
   ```

5. **Créer le dossier uploads**
```bash
mkdir uploads
```

6. **Démarrer le serveur**
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

7. **Accéder à l'application**
   - Ouvrir votre navigateur : `http://localhost:3000`

## Structure du projet

```
.
├── config/
│   └── database.js          # Configuration MySQL
├── database/
│   └── schema.sql           # Schéma de base de données
├── middleware/
│   ├── auth.js              # Middleware d'authentification
│   └── upload.js            # Configuration Multer
├── routes/
│   ├── auth.js              # Routes d'authentification
│   ├── index.js             # Route principale
│   ├── prices.js            # Routes des prix
│   ├── materials.js         # Routes des matériaux
│   ├── moderation.js        # Routes de modération
│   └── alerts.js            # Routes des alertes
├── views/
│   ├── partials/            # Partials EJS (header, footer)
│   ├── auth/                # Vues d'authentification
│   ├── prices/              # Vues des prix
│   ├── materials/           # Vues des matériaux
│   ├── alerts/              # Vues des alertes
│   └── errors/              # Pages d'erreur
├── public/
│   ├── css/
│   │   └── style.css        # Styles personnalisés
│   └── js/
│       └── main.js          # Scripts JavaScript
├── uploads/                 # Dossier pour les photos uploadées
├── utils/
│   └── helpers.js           # Fonctions utilitaires
├── locales/
│   └── fr.json              # Traductions françaises
├── server.js                # Point d'entrée de l'application
└── package.json             # Dépendances npm
```

## Utilisation

### Créer un compte
1. Cliquer sur "Inscription"
2. Choisir le type de compte (Artisan, Particulier, Commerçant)
3. Remplir le formulaire
4. Se connecter

### Soumettre un prix
1. Se connecter
2. Aller dans "Soumettre un prix"
3. Remplir le formulaire avec les informations du matériau
4. Optionnel : Ajouter une photo et activer la géolocalisation
5. Soumettre

### Consulter les prix
- **Liste** : `/prices/consult` - Filtrer par matériau, ville, région
- **Carte** : `/prices/map` - Visualisation géographique
- **Historique** : Cliquer sur l'icône graphique pour voir l'évolution

### Gérer les alertes
1. Aller dans "Alertes"
2. Créer une nouvelle alerte
3. Choisir le matériau, le type d'alerte (hausse/baisse/changement)
4. Optionnel : Définir un seuil et une région
5. Activer/Désactiver selon vos besoins

## Matériaux par défaut

L'application inclut 4 matériaux de base :
- **Ciment** (sac de 50kg)
- **Sable** (m³)
- **Briques** (unité)
- **Fer à Béton** (kg)

Les **commerçants** peuvent ajouter d'autres matériaux.

## Sécurité

- Mots de passe hashés avec bcrypt
- Sessions sécurisées
- Validation des entrées utilisateur
- Protection CSRF (à implémenter en production)
- Upload de fichiers sécurisé (types et taille limités)

## Contribution

Les utilisateurs gagnent des **points de contribution** en :
- Soumettant des prix
- Votant sur les soumissions
- Commentant (artisans)

Les utilisateurs avec **50+ points** obtiennent le badge "Contributeur fiable".

## Développement

### Scripts disponibles
```bash
npm start      # Démarrer en production
npm run dev    # Démarrer en développement (nodemon)
```

### Améliorations futures
- [ ] Support multilingue complet (arabe, amazigh)
- [ ] API REST
- [ ] Application mobile
- [ ] Export de données (CSV, PDF)
- [ ] Statistiques avancées
- [ ] Notifications par email
- [ ] Mode hors-ligne (PWA)

## Licence

Ce projet est sous licence ISC.

## Support

Pour toute question ou problème, veuillez créer une issue sur le dépôt du projet.

