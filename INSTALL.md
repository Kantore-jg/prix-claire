# Guide d'installation

## Prérequis

- **Node.js** : Version 14 ou supérieure
- **MySQL** : Version 5.7 ou supérieure
- **npm** ou **yarn**

## Installation étape par étape

### 1. Installer les dépendances Node.js

```bash
npm install
```

### 2. Configurer MySQL

#### Option A : Via la ligne de commande MySQL

```bash
# Se connecter à MySQL
mysql -u root -p

# Créer la base de données et importer le schéma
source database/schema.sql

# Ou directement :
mysql -u root -p < database/schema.sql
```

#### Option B : Via phpMyAdmin ou un autre outil

1. Créer une nouvelle base de données nommée `suivi_prix_materiaux`
2. Importer le fichier `database/schema.sql`

### 3. Configurer les variables d'environnement

1. Créer un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

2. Modifier le fichier `.env` avec vos paramètres :

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe_mysql
DB_NAME=suivi_prix_materiaux
DB_PORT=3306

SESSION_SECRET=changez-ce-secret-en-production
PORT=3000
NODE_ENV=development
```

**Important** : Changez `SESSION_SECRET` par une chaîne aléatoire sécurisée en production !

### 4. Créer le dossier pour les uploads

```bash
mkdir uploads
```

### 5. Démarrer l'application

#### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

#### Mode production

```bash
npm start
```

Ouvrez votre navigateur et allez sur : **http://localhost:3000**

### 7. Accès depuis un autre appareil (Mise en réseau)

Si vous voulez accéder à l'application depuis un autre appareil (téléphone, tablette, autre PC) sur le même réseau WiFi :

1. Trouvez l'adresse IP locale de votre ordinateur (ex: `192.168.1.15`).
2. Démarrez le serveur avec l'hôte `0.0.0.0` :
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
3. Sur l'autre appareil, ouvrez le navigateur et tapez : `http://192.168.1.15:3000`

---

## Migration vers un autre appareil

Pour installer **PrixClair** sur un nouvel ordinateur :

1. **Copier le code** : Transférez tout le dossier du projet (sauf `node_modules`).
2. **Initialiser Git (Optionnel)** : Si vous voulez utiliser Git, lancez `git init` à la racine avant `git add .`.
3. **Installer les prérequis** : Installez Node.js et MySQL sur la nouvelle machine.
4. **Configuration** :
   - Lancez `npm install`.
   - Créez la base de données avec `database/schema.sql`.
   - Créez le fichier `.env` (ne pas oublier de copier vos réglages).
   - Créez le dossier `uploads`.
5. **Démarrage** : `npm run dev`.

## Vérification de l'installation

1. ✅ La page d'accueil s'affiche
2. ✅ Vous pouvez vous inscrire
3. ✅ Vous pouvez vous connecter
4. ✅ La base de données contient les 4 matériaux de base :
   - Ciment
   - Sable
   - Briques
   - Fer à Béton

## Dépannage

### Erreur de connexion à la base de données

- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base de données existe

### Erreur "Cannot find module"

```bash
npm install
```

### Port déjà utilisé

Changez le port dans `.env` :

```env
PORT=3001
```

### Erreur d'upload de fichiers

Vérifiez que le dossier `uploads` existe et a les permissions d'écriture :

```bash
mkdir uploads
chmod 755 uploads
```

## Premiers pas

1. **Créer un compte** : Cliquez sur "Inscription" et choisissez un type de compte
2. **Soumettre un prix** : Connectez-vous et allez dans "Soumettre un prix"
3. **Consulter les prix** : Allez dans "Consultation" pour voir tous les prix
4. **Voir la carte** : Cliquez sur "Carte" pour la visualisation géographique

## Comptes de test (optionnel)

Vous pouvez créer des comptes de test directement dans MySQL :

```sql
-- Mot de passe pour tous : "password123"
-- (hashé avec bcrypt)

INSERT INTO users (nom, email, password, type_compte) VALUES
('Artisan Test', 'artisan@test.com', '$2a$10$rK8Q8Q8Q8Q8Q8Q8Q8Q8QO8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'artisan'),
('Particulier Test', 'particulier@test.com', '$2a$10$rK8Q8Q8Q8Q8Q8Q8Q8QO8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'particulier'),
('Commerçant Test', 'commercant@test.com', '$2a$10$rK8Q8Q8Q8Q8Q8Q8Q8QO8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'commercant');
```

**Note** : Les mots de passe ci-dessus sont des exemples. Utilisez l'interface d'inscription pour créer de vrais comptes avec des mots de passe hashés correctement.

## Support

Si vous rencontrez des problèmes, vérifiez :
- Les logs du serveur dans la console
- Les logs MySQL
- Les permissions des fichiers et dossiers

