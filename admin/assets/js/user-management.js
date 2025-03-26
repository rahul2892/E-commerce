class UserManager {
    constructor() {
        this.users = [];
        this.filters = {
            search: '',
            role: '',
            status: ''
        };
        this.init();
    }

    init() {
        this.loadUsers();
        this.setupRealTimeUpdates();
        this.bindEvents();
    }

    loadUsers() {
        this.users = db.getCollection('users');
        this.renderUsers();
    }

    setupRealTimeUpdates() {
        db.subscribeToChanges('users', (updatedUsers) => {
            this.users = updatedUsers;
            this.renderUsers();
        });
    }

    bindEvents() {
        const form = document.getElementById('userForm');
        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserSubmit(e);
        });

        const searchInput = document.getElementById('userSearch');
        searchInput?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.renderUsers();
        });

        const roleFilter = document.getElementById('roleFilter');
        roleFilter?.addEventListener('change', (e) => {
            this.filters.role = e.target.value;
            this.renderUsers();
        });

        const statusFilter = document.getElementById('statusFilter');
        statusFilter?.addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.renderUsers();
        });
    }

    getFilteredUsers() {
        return this.users.filter(user => {
            const matchesSearch = !this.filters.search || 
                user.fullName.toLowerCase().includes(this.filters.search) ||
                user.email.toLowerCase().includes(this.filters.search);
            
            const matchesRole = !this.filters.role || user.role === this.filters.role;
            const matchesStatus = !this.filters.status || user.status === this.filters.status;

            return matchesSearch && matchesRole && matchesStatus;
        });
    }

    renderUsers() {
        const userList = document.getElementById('userList');
        if (!userList) return;

        const filteredUsers = this.getFilteredUsers();

        userList.innerHTML = filteredUsers.map(user => `
            <div class="user-card" data-id="${user.id}">
                <div class="user-info">
                    <img src="${user.avatar || '../../assets/images/default-avatar.png'}" alt="${user.fullName}">
                    <div class="user-details">
                        <h3>${user.fullName}</h3>
                        <p>${user.email}</p>
                        <div class="user-meta">
                            <span class="user-role ${user.role || 'customer'}">${user.role || 'Customer'}</span>
                            <span class="user-status ${user.status || 'active'}">${user.status || 'Active'}</span>
                        </div>
                    </div>
                </div>
                <div class="user-actions">
                    <button onclick="userManager.editUser('${user.id}')" class="edit-btn">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="userManager.deleteUser('${user.id}')" class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    showAddModal() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('modalTitle');

        form.reset();
        form.removeAttribute('data-edit-id');
        title.textContent = 'Add User';
        modal.style.display = 'flex';

        document.getElementById('password').parentElement.style.display = 'block';
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        const title = document.getElementById('modalTitle');

        form.dataset.editId = userId;
        title.textContent = 'Edit User';

        form.fullName.value = user.fullName;
        form.email.value = user.email;
        form.role.value = user.role || 'customer';
        form.status.value = user.status || 'active';

        document.getElementById('role').parentElement.style.display = 'block';
        document.getElementById('password').parentElement.style.display = 'none';

        modal.style.display = 'flex';
    }

    async handleUserSubmit(e) {
        const form = e.target;
        
        const userData = {
            fullName: form.fullName.value,
            email: form.email.value,
            role: form.role.value,
            status: form.status.value
        };

        if (!form.dataset.editId) {
            userData.password = form.password.value;
        }

        try {
            if (form.dataset.editId) {
                await this.updateUser(form.dataset.editId, userData);
            } else {
                await this.addUser(userData);
            }
            this.closeModal();
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    async addUser(userData) {
        if (this.users.some(u => u.email === userData.email)) {
            throw new Error('Email already exists');
        }

        const newUser = {
            id: Date.now().toString(),
            ...userData,
            role: userData.role || 'customer',
            status: userData.status || 'active',
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        };

        this.users.push(newUser);
        db.saveCollection('users', this.users);
        this.showNotification('User added successfully');
    }

    async updateUser(userId, userData) {
        const index = this.users.findIndex(u => u.id === userId);
        if (index === -1) throw new Error('User not found');

        if (this.users.some(u => u.id !== userId && u.email === userData.email)) {
            throw new Error('Email already exists');
        }

        this.users[index] = {
            ...this.users[index],
            ...userData,
            updatedAt: new Date().toISOString()
        };

        db.saveCollection('users', this.users);
        this.showNotification('User updated successfully');
    }

    toggleUserStatus(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        user.status = newStatus;
        user.updatedAt = new Date().toISOString();

        db.saveCollection('users', this.users);
        this.showNotification(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const overlay = document.createElement('div');
        overlay.className = 'confirm-dialog-overlay';
        
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <h3>Delete User</h3>
            <p>Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.</p>
            <div class="confirm-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="confirm-delete-btn">Delete User</button>
            </div>
        `;

        const cancelBtn = dialog.querySelector('.cancel-btn');
        const confirmBtn = dialog.querySelector('.confirm-delete-btn');

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        });

        confirmBtn.addEventListener('click', () => {
            this.users = this.users.filter(u => u.id !== userId);
            db.saveCollection('users', this.users);
            this.showNotification('User deleted successfully', 'warning');
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        });

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
    }

    closeModal() {
        const modal = document.getElementById('userModal');
        const form = document.getElementById('userForm');
        form.reset();
        modal.style.display = 'none';
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize user manager
const userManager = new UserManager();