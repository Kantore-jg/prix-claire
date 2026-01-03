const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { getUnreadNotifications, markAsRead, markAllAsRead } = require('../utils/notifications');

// Page des notifications
router.get('/', requireAuth, async (req, res) => {
    res.render('notifications/index', {
        title: 'Mes notifications'
    });
});

// Récupérer toutes les notifications (API)
router.get('/all', requireAuth, async (req, res) => {
    try {
        const [notifications] = await db.execute(`
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [req.session.userId]);
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false, notifications: [] });
    }
});

// Récupérer les notifications non lues (API)
router.get('/unread', requireAuth, async (req, res) => {
    try {
        const notifications = await getUnreadNotifications(req.session.userId);
        res.json({ success: true, notifications });
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false, notifications: [] });
    }
});

// Marquer une notification comme lue
router.post('/read/:id', requireAuth, async (req, res) => {
    try {
        await markAsRead(req.params.id, req.session.userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false });
    }
});

// Marquer toutes les notifications comme lues
router.post('/read-all', requireAuth, async (req, res) => {
    try {
        await markAllAsRead(req.session.userId);
        res.json({ success: true });
    } catch (error) {
        console.error('Erreur:', error);
        res.json({ success: false });
    }
});

module.exports = router;

