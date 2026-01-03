const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Mettre à true en production avec HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
}));

// Flash messages
app.use(flash());

// Variables globales pour les vues
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        nom: req.session.nom,
        email: req.session.email,
        typeCompte: req.session.typeCompte
    } : null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/prices', require('./routes/prices'));
app.use('/materials', require('./routes/materials'));
app.use('/moderation', require('./routes/moderation'));
app.use('/alerts', require('./routes/alerts'));
app.use('/notifications', require('./routes/notifications'));

// Route 404
app.use((req, res) => {
    res.status(404).render('errors/404', { title: 'Page non trouvée' });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(500).render('errors/500', {
        title: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Vérifier les alertes périodiquement (toutes les heures)
const { checkAlerts } = require('./utils/notifications');
setInterval(checkAlerts, 60 * 60 * 1000); // Toutes les heures

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://0.0.0.0:${PORT}`);
    console.log(`📊 Vérification des alertes activée (toutes les heures)`);
});

