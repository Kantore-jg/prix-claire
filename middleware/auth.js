// Middleware d'authentification

const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    req.flash('error', 'Vous devez être connecté pour accéder à cette page');
    res.redirect('/auth/login');
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (req.session && req.session.userId && req.session.typeCompte) {
            if (roles.includes(req.session.typeCompte)) {
                return next();
            }
        }
        req.flash('error', 'Vous n\'avez pas les permissions nécessaires');
        res.redirect('/');
    };
};

module.exports = {
    requireAuth,
    requireRole
};

