const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Liste des alertes de l'utilisateur
router.get('/', requireAuth, async (req, res) => {
    try {
        const [alerts] = await db.execute(`
            SELECT a.*, m.nom as materiau_nom, m.unite
            FROM alertes a
            JOIN materiaux m ON a.materiau_id = m.id
            WHERE a.user_id = ?
            ORDER BY a.created_at DESC
        `, [req.session.userId]);

        const [materials] = await db.execute('SELECT * FROM materiaux ORDER BY nom');

        let marketTrends = [];
        if (req.session.typeCompte === 'commercant') {
            const [trends] = await db.execute(`
                SELECT m.nom as materiau_nom, a.region, COUNT(*) as alert_count
                FROM alertes a
                JOIN materiaux m ON a.materiau_id = m.id
                WHERE a.active = TRUE
                GROUP BY a.materiau_id, a.region
                ORDER BY alert_count DESC
                LIMIT 10
            `);
            marketTrends = trends;
        }

        res.render('alerts/index', {
            title: 'Mes alertes',
            alerts,
            materials,
            marketTrends
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.render('alerts/index', {
            title: 'Mes alertes',
            alerts: [],
            materials: []
        });
    }
});

// Créer une alerte
router.post('/create', requireAuth, [
    body('materiau_id').isInt(),
    body('type_alerte').isIn(['hausse', 'baisse', 'changement']),
    body('seuil').optional().isFloat({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Veuillez vérifier vos informations');
        return res.redirect('/alerts');
    }

    try {
        const { materiau_id, type_alerte, seuil, region } = req.body;

        await db.execute(
            'INSERT INTO alertes (user_id, materiau_id, type_alerte, seuil, region) VALUES (?, ?, ?, ?, ?)',
            [req.session.userId, materiau_id, type_alerte, seuil || null, region || null]
        );

        req.flash('success', 'Alerte créée avec succès');
        res.redirect('/alerts');
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors de la création de l\'alerte');
        res.redirect('/alerts');
    }
});

// Activer/Désactiver une alerte
router.post('/toggle/:alert_id', requireAuth, async (req, res) => {
    try {
        const { alert_id } = req.params;
        const [alert] = await db.execute(
            'SELECT * FROM alertes WHERE id = ? AND user_id = ?',
            [alert_id, req.session.userId]
        );

        if (alert.length === 0) {
            return res.json({ success: false, message: 'Alerte introuvable' });
        }

        await db.execute(
            'UPDATE alertes SET active = NOT active WHERE id = ?',
            [alert_id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false, message: 'Erreur' });
    }
});

// Supprimer une alerte
router.post('/delete/:alert_id', requireAuth, async (req, res) => {
    try {
        const { alert_id } = req.params;
        await db.execute(
            'DELETE FROM alertes WHERE id = ? AND user_id = ?',
            [alert_id, req.session.userId]
        );

        req.flash('success', 'Alerte supprimée');
        res.redirect('/alerts');
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors de la suppression');
        res.redirect('/alerts');
    }
});

module.exports = router;

