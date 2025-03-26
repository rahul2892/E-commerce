class NotificationManager {
    constructor() {
        this.notifications = [];
        this.init();
    }

    init() {
        db.subscribeToChanges('notifications', (notifications) => {
            this.notifications = notifications;
            this.updateNotificationUI();
        });
    }

    addNotification(notification) {
        const notifications = db.getCollection('notifications');
        notifications.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        });
        db.saveCollection('notifications', notifications);
    }

    loadNotifications() {
        const userId = auth.currentUser?.id;
        this.notifications = db.getNotifications(userId);
        this.updateNotificationBadge();
    }

    setupRealTimeUpdates() {
        db.subscribeToChanges('notifications', (notifications) => {
            const userId = auth.currentUser?.id;
            this.notifications = notifications.filter(n => 
                !n.userId || n.userId === userId
            );
            this.updateNotificationUI();
        });
    }

    createNotificationUI() {
        // Create notification panel
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-header">
                <h3>Notifications</h3>
                <button class="clear-all">Clear All</button>
            </div>
            <div class="notification-list"></div>
        `;

        // Add to body
        document.body.appendChild(panel);

        // Add notification bell to header
        const headerActions = document.querySelector('.nav-actions');
        if (headerActions) {
            const bell = document.createElement('button');
            bell.className = 'notification-bell';
            bell.innerHTML = `
                <i class="fas fa-bell"></i>
                <span class="notification-badge">0</span>
            `;
            headerActions.insertBefore(bell, headerActions.firstChild);

            // Toggle panel on bell click
            bell.addEventListener('click', () => {
                panel.classList.toggle('show');
                if (panel.classList.contains('show')) {
                    this.markAllAsRead();
                }
            });
        }
    }

    updateNotificationUI() {
        const list = document.querySelector('.notification-list');
        const badge = document.querySelector('.notification-badge');
        
        if (list) {
            list.innerHTML = this.notifications
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(notification => this.createNotificationElement(notification))
                .join('');
        }

        if (badge) {
            const unreadCount = this.notifications.filter(n => !n.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    createNotificationElement(notification) {
        return `
            <div class="notification-item ${notification.read ? 'read' : ''}" 
                 data-id="${notification.id}">
                <div class="notification-icon ${notification.type}">
                    ${this.getIconForType(notification.type)}
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">
                        ${this.formatTime(notification.timestamp)}
                    </span>
                </div>
                <button class="delete-notification" 
                        onclick="notificationManager.deleteNotification('${notification.id}')">
                    ×
                </button>
            </div>
        `;
    }

    getIconForType(type) {
        const icons = {
            new_order: '<i class="fas fa-shopping-bag"></i>',
            low_stock: '<i class="fas fa-exclamation-triangle"></i>',
            order_update: '<i class="fas fa-truck"></i>',
            user_action: '<i class="fas fa-user"></i>'
        };
        return icons[type] || '<i class="fas fa-bell"></i>';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
        return date.toLocaleDateString();
    }

    markAllAsRead() {
        this.notifications.forEach(notification => {
            if (!notification.read) {
                db.markNotificationRead(notification.id);
            }
        });
    }

    deleteNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        db.saveCollection('notifications', this.notifications);
    }
}

// Initialize notification manager
const notificationManager = new NotificationManager(); 