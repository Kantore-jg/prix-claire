const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { createNotification } = require('../utils/notifications');

// Voter sur une soumission
router.post('/vote/:soumission_id', requireAuth, [
    body('type_vote').isIn(['positif', 'negatif'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ success: false, message: 'Vote invalide' });
    }

    // Seuls les artisans peuvent voter/commenter d'après les permissions
    if (req.session.typeCompte !== 'artisan') {
        return res.json({ success: false, message: 'Seuls les artisans peuvent voter' });
    }

    try {
        const { soumission_id } = req.params;
        const { type_vote } = req.body;
        const user_id = req.session.userId;

        // Vérifier si l'utilisateur a déjà voté
        const [existingVote] = await db.execute(
            'SELECT * FROM votes WHERE user_id = ? AND soumission_id = ?',
            [user_id, soumission_id]
        );

        if (existingVote.length > 0) {
            // Mettre à jour le vote existant
            if (existingVote[0].type_vote !== type_vote) {
                await db.execute(
                    'UPDATE votes SET type_vote = ? WHERE id = ?',
                    [type_vote, existingVote[0].id]
                );

                // Mettre à jour les compteurs
                if (type_vote === 'positif') {
                    await db.execute(
                        'UPDATE soumissions_prix SET votes_positifs = votes_positifs + 1, votes_negatifs = votes_negatifs - 1 WHERE id = ?',
                        [soumission_id]
                    );
                } else {
                    await db.execute(
                        'UPDATE soumissions_prix SET votes_positifs = votes_positifs - 1, votes_negatifs = votes_negatifs + 1 WHERE id = ?',
                        [soumission_id]
                    );
                }
            }
        } else {
            // Créer un nouveau vote
            await db.execute(
                'INSERT INTO votes (user_id, soumission_id, type_vote) VALUES (?, ?, ?)',
                [user_id, soumission_id, type_vote]
            );

            // Mettre à jour les compteurs
            if (type_vote === 'positif') {
                await db.execute(
                    'UPDATE soumissions_prix SET votes_positifs = votes_positifs + 1 WHERE id = ?',
                    [soumission_id]
                );
            } else {
                await db.execute(
                    'UPDATE soumissions_prix SET votes_negatifs = votes_negatifs + 1 WHERE id = ?',
                    [soumission_id]
                );
            }
        }

        // Mettre à jour les points de contribution
        await db.execute(
            'UPDATE users SET points_contribution = points_contribution + 1 WHERE id = ?',
            [user_id]
        );

        // Vérifier si l'utilisateur mérite le badge "fiable"
        // Applicable aux artisans et commerçants uniquement
        if (['artisan', 'commercant'].includes(req.session.typeCompte)) {
            const [user] = await db.execute(
                'SELECT points_contribution, badge_fiable FROM users WHERE id = ?',
                [user_id]
            );

            if (user[0].points_contribution >= 50 && !user[0].badge_fiable) {
                await db.execute(
                    'UPDATE users SET badge_fiable = TRUE WHERE id = ?',
                    [user_id]
                );
            }
        }

        res.json({ success: true, message: 'Vote enregistré' });

        // Notifier l'auteur de la soumission
        const [submission] = await db.execute('SELECT user_id, materiau_id FROM soumissions_prix WHERE id = ?', [soumission_id]);
        if (submission.length > 0 && submission[0].user_id !== user_id) {
            const [material] = await db.execute('SELECT nom FROM materiaux WHERE id = ?', [submission[0].materiau_id]);
            await createNotification(
                submission[0].user_id,
                'vote',
                'Nouveau vote',
                `${req.session.nom} a voté ${type_vote} sur votre prix de ${material[0].nom}`,
                `/prices/my-submissions`
            );
        }
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false, message: 'Erreur lors du vote' });
    }
});

// Ajouter un commentaire (artisans uniquement)
router.post('/comment/:soumission_id', requireAuth, [
    body('commentaire').trim().isLength({ min: 5 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Le commentaire doit contenir au moins 5 caractères');
        return res.redirect('back');
    }

    try {
        const { soumission_id } = req.params;
        const { commentaire } = req.body;
        const user_id = req.session.userId;

        await db.execute(
            'INSERT INTO commentaires (user_id, soumission_id, commentaire) VALUES (?, ?, ?)',
            [user_id, soumission_id, commentaire]
        );

        // Notifier l'auteur de la soumission
        const [submission] = await db.execute('SELECT user_id, materiau_id FROM soumissions_prix WHERE id = ?', [soumission_id]);
        if (submission.length > 0 && submission[0].user_id !== user_id) {
            const [material] = await db.execute('SELECT nom FROM materiaux WHERE id = ?', [submission[0].materiau_id]);
            await createNotification(
                submission[0].user_id,
                'commentaire',
                'Nouveau commentaire',
                `${req.session.nom} a commenté votre prix de ${material[0].nom}`,
                `/prices/my-submissions`
            );
        }

        req.flash('success', 'Commentaire ajouté');
        res.redirect('back');
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors de l\'ajout du commentaire');
        res.redirect('back');
    }
});

// Signaler une soumission
router.post('/report/:soumission_id', requireAuth, [
    body('raison').trim().isLength({ min: 3 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Veuillez fournir une raison valide');
        return res.redirect('back');
    }

    try {
        const { soumission_id } = req.params;
        const { raison } = req.body;
        const user_id = req.session.userId;

        await db.execute(
            'INSERT INTO signalements (user_id, soumission_id, raison) VALUES (?, ?, ?)',
            [user_id, soumission_id, raison]
        );

        req.flash('success', 'Signalement enregistré');
        res.redirect('back');
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors du signalement');
        res.redirect('back');
    }
});

// Voir les commentaires d'une soumission
router.get('/comments/:soumission_id', async (req, res) => {
    try {
        const { soumission_id } = req.params;
        const [comments] = await db.execute(`
            SELECT c.*, u.nom as user_nom, u.type_compte
            FROM commentaires c
            JOIN users u ON c.user_id = u.id
            WHERE c.soumission_id = ?
            ORDER BY c.created_at DESC
        `, [soumission_id]);

        res.json({ success: true, comments });
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false, comments: [] });
    }
});

module.exports = router;

