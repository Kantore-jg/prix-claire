const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { calculateAveragePrice, formatDate } = require('../utils/helpers');

// Page d'accueil
router.get('/', async (req, res) => {
    try {
        // Récupérer les dernières soumissions
        const [recentSubmissions] = await db.execute(`
            SELECT sp.*, m.nom as materiau_nom, m.unite, u.nom as user_nom, u.type_compte
            FROM soumissions_prix sp
            JOIN materiaux m ON sp.materiau_id = m.id
            JOIN users u ON sp.user_id = u.id
            WHERE sp.statut != 'rejete'
            ORDER BY sp.created_at DESC
            LIMIT 10
        `);

        // Récupérer les prix moyens par matériau
        const [materials] = await db.execute('SELECT * FROM materiaux ORDER BY nom');

        const averagePrices = [];
        for (const material of materials) {
            const [prices] = await db.execute(`
                SELECT prix FROM soumissions_prix 
                WHERE materiau_id = ? AND statut != 'rejete'
                ORDER BY date_achat DESC
                LIMIT 30
            `, [material.id]);

            if (prices.length > 0) {
                averagePrices.push({
                    materiau: material.nom,
                    unite: material.unite,
                    prix_moyen: calculateAveragePrice(prices),
                    nombre_soumissions: prices.length
                });
            }
        }

        res.render('index', {
            title: 'Accueil',
            user: req.session.userId ? {
                id: req.session.userId,
                nom: req.session.nom,
                typeCompte: req.session.typeCompte
            } : null,
            recentSubmissions,
            averagePrices,
            formatDate
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.render('index', {
            title: 'Accueil',
            user: null,
            recentSubmissions: [],
            averagePrices: [],
            formatDate
        });
    }
});

module.exports = router;

