const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { checkAlerts, createNotification } = require('../utils/notifications');
const { body, validationResult } = require('express-validator');
const { formatDate, calculateAveragePrice } = require('../utils/helpers');

// Page de soumission de prix
router.get('/submit', requireAuth, async (req, res) => {
    try {
        const [materials] = await db.execute('SELECT * FROM materiaux ORDER BY nom');
        res.render('prices/submit', {
            title: 'Soumettre un prix',
            materials,
            errors: req.flash('error'),
            success: req.flash('success')
        });
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors du chargement de la page');
        res.redirect('/');
    }
});

// Traitement de la soumission de prix
router.post('/submit', requireAuth, upload.single('photo'), [
    body('materiau_id').isInt(),
    body('prix').isFloat({ min: 0 }),
    body('lieu').trim().notEmpty(),
    body('date_achat').isISO8601()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Veuillez vérifier vos informations');
        return res.redirect('/prices/submit');
    }

    try {
        const {
            materiau_id,
            prix,
            lieu,
            ville,
            region,
            latitude,
            longitude,
            date_achat,
            source
        } = req.body;

        const photo = req.file ? req.file.filename : null;

        await db.execute(`
            INSERT INTO soumissions_prix 
            (user_id, materiau_id, prix, lieu, ville, region, latitude, longitude, date_achat, source, photo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            req.session.userId,
            materiau_id,
            prix,
            lieu,
            ville || null,
            region || null,
            latitude || null,
            longitude || null,
            date_achat,
            source || null,
            photo
        ]);

        // Augmenter les points de contribution
        await db.execute(
            'UPDATE users SET points_contribution = points_contribution + 1 WHERE id = ?',
            [req.session.userId]
        );

        // Déclencher la vérification des alertes
        checkAlerts();

        // Notifier les utilisateurs de la même région (Transaction notification)
        if (region) {
            const [material] = await db.execute('SELECT nom FROM materiaux WHERE id = ?', [materiau_id]);
            const [usersInRegion] = await db.execute(
                'SELECT id FROM users WHERE ville = ? AND id != ?',
                [ville, req.session.userId]
            );

            for (const u of usersInRegion) {
                await createNotification(
                    u.id,
                    'transaction',
                    'Nouveau prix dans votre zone',
                    `Un nouveau prix pour ${material[0].nom} a été soumis à ${ville}.`,
                    '/prices/consult'
                );
            }
        }

        req.flash('success', 'Prix soumis avec succès');
        res.redirect('/prices/submit');
    } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        req.flash('error', 'Erreur lors de la soumission du prix');
        res.redirect('/prices/submit');
    }
});

// Consultation des prix (liste)
router.get('/consult', async (req, res) => {
    try {
        const { materiau_id, ville, region } = req.query;

        let query = `
            SELECT sp.*, m.nom as materiau_nom, m.unite, u.nom as user_nom, u.type_compte, u.badge_fiable
            FROM soumissions_prix sp
            JOIN materiaux m ON sp.materiau_id = m.id
            JOIN users u ON sp.user_id = u.id
            WHERE sp.statut != 'rejete'
        `;
        const params = [];

        if (materiau_id) {
            query += ' AND sp.materiau_id = ?';
            params.push(materiau_id);
        }
        if (ville) {
            query += ' AND sp.ville = ?';
            params.push(ville);
        }
        if (region) {
            query += ' AND sp.region = ?';
            params.push(region);
        }

        query += ' ORDER BY sp.date_achat DESC, sp.created_at DESC LIMIT 100';

        const [submissions] = await db.execute(query, params);
        const [materials] = await db.execute('SELECT * FROM materiaux ORDER BY nom');

        // Récupérer les villes et régions uniques
        const [locations] = await db.execute(`
            SELECT DISTINCT ville, region 
            FROM soumissions_prix 
            WHERE statut = 'valide' AND ville IS NOT NULL
            ORDER BY ville
        `);

        res.render('prices/consult', {
            title: 'Consultation des prix',
            submissions,
            materials,
            locations,
            selectedMaterial: materiau_id,
            selectedCity: ville,
            selectedRegion: region,
            formatDate
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.render('prices/consult', {
            title: 'Consultation des prix',
            submissions: [],
            materials: [],
            locations: [],
            formatDate
        });
    }
});

// Historique des prix par matériau
router.get('/history/:materiau_id', async (req, res) => {
    try {
        const { materiau_id } = req.params;
        const { ville, region } = req.query;

        let query = `
            SELECT sp.*, m.nom as materiau_nom, m.unite
            FROM soumissions_prix sp
            JOIN materiaux m ON sp.materiau_id = m.id
            WHERE sp.materiau_id = ? AND sp.statut != 'rejete'
        `;
        const params = [materiau_id];

        if (ville) {
            query += ' AND sp.ville = ?';
            params.push(ville);
        }
        if (region) {
            query += ' AND sp.region = ?';
            params.push(region);
        }

        query += ' ORDER BY sp.date_achat ASC';

        const [history] = await db.execute(query, params);
        const [material] = await db.execute('SELECT * FROM materiaux WHERE id = ?', [materiau_id]);

        if (material.length === 0) {
            req.flash('error', 'Matériau introuvable');
            return res.redirect('/prices/consult');
        }

        res.render('prices/history', {
            title: `Historique - ${material[0].nom}`,
            history,
            material: material[0],
            formatDate
        });
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors du chargement de l\'historique');
        res.redirect('/prices/consult');
    }
});

// Carte interactive
router.get('/map', async (req, res) => {
    try {
        const { materiau_id } = req.query;

        let query = `
            SELECT sp.*, m.nom as materiau_nom, m.unite
            FROM soumissions_prix sp
            JOIN materiaux m ON sp.materiau_id = m.id
            WHERE sp.statut != 'rejete' AND sp.latitude IS NOT NULL AND sp.longitude IS NOT NULL
        `;
        const params = [];

        if (materiau_id) {
            query += ' AND sp.materiau_id = ?';
            params.push(materiau_id);
        }

        const [submissions] = await db.execute(query, params);
        const [materials] = await db.execute('SELECT * FROM materiaux ORDER BY nom');

        res.render('prices/map', {
            title: 'Carte des prix',
            submissions,
            materials,
            selectedMaterial: materiau_id,
            formatDate
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.render('prices/map', {
            title: 'Carte des prix',
            submissions: [],
            materials: []
        });
    }
});

// Mes soumissions (Dashboard pour voir les interactions)
router.get('/my-submissions', requireAuth, async (req, res) => {
    try {
        const [submissions] = await db.execute(`
            SELECT sp.*, m.nom as materiau_nom, m.unite, u.badge_fiable,
                   (SELECT COUNT(*) FROM votes WHERE soumission_id = sp.id AND type_vote = 'positif') as positives,
                   (SELECT COUNT(*) FROM votes WHERE soumission_id = sp.id AND type_vote = 'negatif') as negatives,
                   (SELECT COUNT(*) FROM commentaires WHERE soumission_id = sp.id) as comment_count
            FROM soumissions_prix sp
            JOIN materiaux m ON sp.materiau_id = m.id
            JOIN users u ON sp.user_id = u.id
            WHERE sp.user_id = ?
            ORDER BY sp.created_at DESC
        `, [req.session.userId]);

        res.render('prices/my-submissions', {
            title: 'Mes soumissions',
            submissions,
            formatDate
        });
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors du chargement de vos soumissions');
        res.redirect('/');
    }
});

module.exports = router;

