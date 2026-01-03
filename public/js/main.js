// Scripts JavaScript personnalisés

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function () {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });

    // Charger les notifications si l'utilisateur est connecté
    loadNotifications();
    setInterval(loadNotifications, 60000); // Actualiser toutes les minutes
});

// Charger les notifications
function loadNotifications() {
    const notificationBadge = document.getElementById('notificationBadge');
    const notificationsList = document.getElementById('notificationsList');
    const notificationsLoading = document.getElementById('notificationsLoading');

    if (!notificationBadge) return; // Utilisateur non connecté

    fetch('/notifications/unread')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const notifications = data.notifications;

                // Mettre à jour le badge
                if (notifications.length > 0) {
                    notificationBadge.textContent = notifications.length;
                    notificationBadge.style.display = 'block';
                } else {
                    notificationBadge.style.display = 'none';
                }

                // Mettre à jour la liste
                if (notifications.length === 0) {
                    notificationsLoading.innerHTML = '<div class="dropdown-item text-center text-muted">Aucune notification</div>';
                } else {
                    let html = '';
                    notifications.forEach(notif => {
                        const date = new Date(notif.created_at);
                        const timeAgo = getTimeAgo(date);
                        html += `
                            <li>
                                <a class="dropdown-item notification-item border-bottom" href="${notif.lien || '#'}" data-id="${notif.id}">
                                    <div class="d-flex w-100 justify-content-between">
                                        <h6 class="mb-1" style="font-size: 0.9rem;">${notif.titre}</h6>
                                        <small class="text-muted" style="font-size: 0.75rem;">${timeAgo}</small>
                                    </div>
                                    <p class="mb-1 text-truncate" style="font-size: 0.8rem;">${notif.message}</p>
                                </a>
                            </li>
                        `;
                    });
                    notificationsLoading.innerHTML = html;
                }
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement des notifications:', error);
        });
}

// Fonction pour calculer le temps écoulé
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
}

// Marquer une notification comme lue au clic
document.addEventListener('click', function (e) {
    if (e.target.closest('.notification-item')) {
        const item = e.target.closest('.notification-item');
        const notificationId = item.dataset.id;
        fetch(`/notifications/read/${notificationId}`, { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadNotifications();
                }
            });
    }
});

// Marquer toutes les notifications comme lues
document.addEventListener('click', function (e) {
    if (e.target.id === 'markAllRead') {
        e.preventDefault();
        fetch('/notifications/read-all', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadNotifications();
                }
            });
    }
});

// Confirmation pour les actions critiques
document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = document.querySelectorAll('[data-confirm]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            if (!confirm(this.dataset.confirm)) {
                e.preventDefault();
            }
        });
    });
});

