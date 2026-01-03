const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { body, validationResult } = require('express-validator');

// Page de connexion
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('auth/login', { 
        title: 'Connexion',
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// Traitement de la connexion
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Veuillez vérifier vos informations');
        return res.redirect('/auth/login');
    }

    try {
        const { email, password } = req.body;
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            req.flash('error', 'Email ou mot de passe incorrect');
            return res.redirect('/auth/login');
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            req.flash('error', 'Email ou mot de passe incorrect');
            return res.redirect('/auth/login');
        }

        req.session.userId = user.id;
        req.session.nom = user.nom;
        req.session.typeCompte = user.type_compte;
        req.session.email = user.email;

        req.flash('success', 'Connexion réussie');
        res.redirect('/');
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/auth/login');
    }
});

// Page d'inscription
router.get('/register', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('auth/register', { 
        title: 'Inscription',
        errors: req.flash('error'),
        success: req.flash('success')
    });
});

// Traitement de l'inscription
router.post('/register', [
    body('nom').trim().isLength({ min: 2 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('type_compte').isIn(['artisan', 'particulier', 'commercant'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', 'Veuillez vérifier vos informations');
        return res.redirect('/auth/register');
    }

    try {
        const { nom, email, password, type_compte, telephone, ville } = req.body;

        // Vérifier si l'email existe déjà
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            req.flash('error', 'Cet email est déjà utilisé');
            return res.redirect('/auth/register');
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insérer l'utilisateur
        const [result] = await db.execute(
            'INSERT INTO users (nom, email, password, type_compte, telephone, ville) VALUES (?, ?, ?, ?, ?, ?)',
            [nom, email, hashedPassword, type_compte, telephone || null, ville || null]
        );

        req.flash('success', 'Inscription réussie. Vous pouvez maintenant vous connecter.');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        req.flash('error', 'Une erreur est survenue');
        res.redirect('/auth/register');
    }
});

// Déconnexion
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erreur lors de la déconnexion:', err);
        }
        res.redirect('/');
    });
});

module.exports = router;

