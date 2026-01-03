const db = require('../config/database');

// Créer une notification
const createNotification = async (userId, type, titre, message, lien = null) => {
    try {
        await db.execute(
            'INSERT INTO notifications (user_id, type_notification, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
            [userId, type, titre, message, lien]
        );
    } catch (error) {
        console.error('Erreur lors de la création de la notification:', error);
    }
};

// Vérifier les alertes et créer des notifications
const checkAlerts = async () => {
    try {
        // Récupérer toutes les alertes actives
        const [alerts] = await db.execute(`
            SELECT a.*, m.nom as materiau_nom
            FROM alertes a
            JOIN materiaux m ON a.materiau_id = m.id
            WHERE a.active = TRUE
        `);

        for (const alert of alerts) {
            // Récupérer les dernières soumissions pour ce matériau
            let query = `
                SELECT prix, date_achat, lieu
                FROM soumissions_prix
                WHERE materiau_id = ? AND statut = 'valide'
            `;
            const params = [alert.materiau_id];

            if (alert.region) {
                query += ' AND region = ?';
                params.push(alert.region);
            }

            query += ' ORDER BY date_achat DESC LIMIT 2';
            const [recentPrices] = await db.execute(query, params);

            if (recentPrices.length >= 2) {
                const currentPrice = parseFloat(recentPrices[0].prix);
                const previousPrice = parseFloat(recentPrices[1].prix);
                const change = ((currentPrice - previousPrice) / previousPrice) * 100;

                let shouldNotify = false;
                let notificationMessage = '';

                if (alert.type_alerte === 'hausse' && change > 0) {
                    shouldNotify = true;
                    notificationMessage = `Hausse de prix détectée pour ${alert.materiau_nom}: ${change.toFixed(2)}%`;
                } else if (alert.type_alerte === 'baisse' && change < 0) {
                    shouldNotify = true;
                    notificationMessage = `Baisse de prix détectée pour ${alert.materiau_nom}: ${Math.abs(change).toFixed(2)}%`;
                } else if (alert.type_alerte === 'changement' && Math.abs(change) > 5) {
                    shouldNotify = true;
                    notificationMessage = `Changement significatif de prix pour ${alert.materiau_nom}: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`;
                }

                // Vérifier le seuil si défini
                if (shouldNotify && alert.seuil) {
                    if (alert.type_alerte === 'hausse' && currentPrice < alert.seuil) {
                        shouldNotify = false;
                    } else if (alert.type_alerte === 'baisse' && currentPrice > alert.seuil) {
                        shouldNotify = false;
                    }
                }

                if (shouldNotify) {
                    await createNotification(
                        alert.user_id,
                        alert.type_alerte,
                        `Alerte prix - ${alert.materiau_nom}`,
                        notificationMessage,
                        `/prices/history/${alert.materiau_id}`
                    );
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors de la vérification des alertes:', error);
    }
};

// Récupérer les notifications non lues d'un utilisateur
const getUnreadNotifications = async (userId) => {
    try {
        const [notifications] = await db.execute(`
            SELECT * FROM notifications
            WHERE user_id = ? AND lu = FALSE
            ORDER BY created_at DESC
            LIMIT 20
        `, [userId]);
        return notifications;
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        return [];
    }
};

// Marquer une notification comme lue
const markAsRead = async (notificationId, userId) => {
    try {
        await db.execute(
            'UPDATE notifications SET lu = TRUE WHERE id = ? AND user_id = ?',
            [notificationId, userId]
        );
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
    }
};

// Marquer toutes les notifications comme lues
const markAllAsRead = async (userId) => {
    try {
        await db.execute(
            'UPDATE notifications SET lu = TRUE WHERE user_id = ? AND lu = FALSE',
            [userId]
        );
    } catch (error) {
        console.error('Erreur lors du marquage des notifications:', error);
    }
};

module.exports = {
    createNotification,
    checkAlerts,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead
};

