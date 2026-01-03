-- Base de données pour le suivi des prix des matériaux de construction

CREATE DATABASE IF NOT EXISTS suivi_prix_materiaux;
USE suivi_prix_materiaux;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    type_compte ENUM('artisan', 'particulier', 'commercant') NOT NULL,
    telephone VARCHAR(20),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'Maroc',
    points_contribution INT DEFAULT 0,
    badge_fiable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des matériaux
CREATE TABLE IF NOT EXISTS materiaux (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    unite VARCHAR(50) NOT NULL DEFAULT 'unité',
    description TEXT,
    ajoute_par INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ajoute_par) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_nom (nom)
);

-- Table des soumissions de prix
CREATE TABLE IF NOT EXISTS soumissions_prix (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    materiau_id INT NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    lieu VARCHAR(255) NOT NULL,
    ville VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    date_achat DATE NOT NULL,
    source VARCHAR(255),
    photo VARCHAR(255),
    statut ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
    votes_positifs INT DEFAULT 0,
    votes_negatifs INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (materiau_id) REFERENCES materiaux(id) ON DELETE CASCADE,
    INDEX idx_materiau (materiau_id),
    INDEX idx_ville (ville),
    INDEX idx_date (date_achat),
    INDEX idx_statut (statut)
);

-- Table des votes
CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    soumission_id INT NOT NULL,
    type_vote ENUM('positif', 'negatif') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (soumission_id) REFERENCES soumissions_prix(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote (user_id, soumission_id),
    INDEX idx_soumission (soumission_id)
);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS commentaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    soumission_id INT NOT NULL,
    commentaire TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (soumission_id) REFERENCES soumissions_prix(id) ON DELETE CASCADE,
    INDEX idx_soumission (soumission_id)
);

-- Table des signalements
CREATE TABLE IF NOT EXISTS signalements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    soumission_id INT NOT NULL,
    raison TEXT NOT NULL,
    statut ENUM('en_attente', 'traite', 'rejete') DEFAULT 'en_attente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (soumission_id) REFERENCES soumissions_prix(id) ON DELETE CASCADE,
    INDEX idx_soumission (soumission_id)
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alertes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    materiau_id INT NOT NULL,
    region VARCHAR(100),
    type_alerte ENUM('hausse', 'baisse', 'changement') NOT NULL,
    seuil DECIMAL(10, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (materiau_id) REFERENCES materiaux(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type_notification VARCHAR(50) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lien VARCHAR(255),
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_lu (lu)
);

-- Insertion des matériaux de base
INSERT INTO materiaux (nom, unite, description) VALUES
('Ciment', 'sac de 50kg', 'Ciment Portland'),
('Sable', 'm³', 'Sable de construction'),
('Briques', 'unité', 'Briques de construction'),
('Fer à Béton', 'kg', 'Armature en acier pour béton');

