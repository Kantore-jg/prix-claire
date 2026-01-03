const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Liste des matériaux
router.get('/', async (req, res) => {
    try {
        const [materials] = await db.execute(`
            SELECT m.*, u.nom as ajoute_par_nom,
                   COUNT(DISTINCT sp.id) as nombre_soumissions
            FROM materiaux m
            LEFT JOIN users u ON m.ajoute_par = u.id
            LEFT JOIN soumissions_prix sp ON m.id = sp.materiau_id AND sp.statut = 'valide'
            GROUP BY m.id
            ORDER BY m.nom
        `);

        res.render('materials/index', {
            title: 'Matériaux',
            materials,
            user: req.session.userId ? {
                typeCompte: req.session.typeCompte
            } : null
        });
    } catch (error) {
        console.error('Erreur:', error);
        res.render('materials/index', {
            title: 'Matériaux',
            materials: []
        });
    }
});

// Ajouter un matériau (seulement pour commerçants)
router.get('/add', requireAuth, requireRole('commercant'), (req, res) => {
    res.render('materials/add', {
        title: 'Ajouter un matériau',
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// Traitement de l'ajout de matériau
router.post('/add', requireAuth, requireRole('commercant'), [
    body('nom').trim().isLength({ min: 2 }),
    body('unite').trim().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Veuillez vérifier vos informations');
        return res.redirect('/materials/add');
    }

    try {
        const { nom, unite, description } = req.body;

        // Vérifier si le matériau existe déjà
        const [existing] = await db.execute(
            'SELECT id FROM materiaux WHERE nom = ?',
            [nom]
        );

        if (existing.length > 0) {
            req.flash('error', 'Ce matériau existe déjà');
            return res.redirect('/materials/add');
        }

        await db.execute(
            'INSERT INTO materiaux (nom, unite, description, ajoute_par) VALUES (?, ?, ?, ?)',
            [nom, unite, description || null, req.session.userId]
        );

        req.flash('success', 'Matériau ajouté avec succès');
        res.redirect('/materials');
    } catch (error) {
        console.error('Erreur:', error);
        req.flash('error', 'Erreur lors de l\'ajout du matériau');
        res.redirect('/materials/add');
    }
});

module.exports = router;

