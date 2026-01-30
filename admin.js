// ===== АДМИН-ФУНКЦИИ ДЛЯ ГИХИДО =====

class AdminManager {
    constructor(game) {
        this.game = game;
        this.isAdmin = false;
    }
    
    checkAdmin() {
        return this.game.currentUser && 
               this.game.currentUser.toLowerCase() === 'gihido';
    }
    
    showAdminPanel() {
        if (!this.checkAdmin()) return;
        
        const adminHTML = `
            <div class="admin-modal-overlay">
                <div class="admin-modal">
                    <div class="admin-header">
                        <h3><i class="fas fa-crown"></i> Админ-панель</h3>
                        <button class="close-admin">&times;</button>
                    </div>
                    <div class="admin-content">
                        <div class="admin-section">
                            <h4><i class="fas fa-user-cog"></i> Управление аккаунтами</h4>
                            <div class="admin-control">
                                <select id="admin-user-select" class="admin-select">
                                    <option value="">Выберите пользователя</option>
                                    ${this.getAllUsers().map(user => 
                                        `<option value="${user.username}">${user.username}</option>`
                                    ).join('')}
                                </select>
                                <button class="admin-btn" onclick="window.game.adminSwitchToUser()">
                                    <i class="fas fa-sign-in-alt"></i> Переключиться
                                </button>
                            </div>
                            <button class="admin-btn admin-btn-danger" onclick="window.game.adminDeleteUser()">
                                <i class="fas fa-trash"></i> Удалить выбранного пользователя
                            </button>
                        </div>
                        
                        <div class="admin-section">
                            <h4><i class="fas fa-coins"></i> Редактирование ресурсов</h4>
                            <div class="admin-control">
                                <input type="number" id="admin-credits" class="admin-input" placeholder="Кредиты" min="0">
                                <button class="admin-btn" onclick="window.game.adminSetResource('credits')">
                                    <i class="fas fa-save"></i> Установить
                                </button>
                            </div>
                            <div class="admin-control">
                                <input type="number" id="admin-minerals" class="admin-input" placeholder="Минералы" min="0">
                                <button class="admin-btn" onclick="window.game.adminSetResource('minerals')">
                                    <i class="fas fa-save"></i> Установить
                                </button>
                            </div>
                            <div class="admin-control">
                                <input type="number" id="admin-prestige" class="admin-input" placeholder="Престиж" min="0">
                                <button class="admin-btn" onclick="window.game.adminSetResource('prestige')">
                                    <i class="fas fa-save"></i> Установить
                                </button>
                            </div>
                        </div>
                        
                        <div class="admin-section">
                            <h4><i class="fas fa-bolt"></i> Редактирование характеристик</h4>
                            <div class="admin-control">
                                <input type="number" id="admin-clickpower" class="admin-input" placeholder="Сила клика" min="1">
                                <button class="admin-btn" onclick="window.game.adminSetStat('clickPower')">
                                    <i class="fas fa-save"></i> Установить
                                </button>
                            </div>
                            <div class="admin-control">
                                <input type="number" id="admin-autoincome" class="admin-input" placeholder="Автодоход" min="0">
                                <button class="admin-btn" onclick="window.game.adminSetStat('autoIncome')">
                                    <i class="fas fa-save"></i> Установить
                                </button>
                            </div>
                            <div class="admin-control">
                                <input type="number" id="admin-energy" class="admin-input" placeholder="Энергия" min="0">
                                <button class="admin-btn" onclick="window.game.adminSetStat('energy')">
                                    <i class="fas fa-save"></i> Установить
                                </button>
                            </div>
                        </div>
                        
                        <div class="admin-section">
                            <h4><i class="fas fa-magic"></i> Быстрые действия</h4>
                            <div class="admin-quick-actions">
                                <button class="admin-btn" onclick="window.game.adminAddMillion()">
                                    +1,000,000 кредитов
                                </button>
                                <button class="admin-btn" onclick="window.game.adminMaxUpgrades()">
                                    Макс. все улучшения
                                </button>
                                <button class="admin-btn" onclick="window.game.adminUnlockAll()">
                                    Разблокировать всё
                                </button>
                                <button class="admin-btn admin-btn-danger" onclick="window.game.adminResetCurrent()">
                                    Сбросить текущего
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', adminHTML);
        
        // Обработчики событий
        document.querySelector('.close-admin').addEventListener('click', () => {
            this.closeAdminPanel();
        });
        
        document.querySelector('.admin-modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-modal-overlay')) {
                this.closeAdminPanel();
            }
        });
    }
    
    closeAdminPanel() {
        const modal = document.querySelector('.admin-modal-overlay');
        if (modal) modal.remove();
    }
    
    getAllUsers() {
        const users = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('spaceMinerUser_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    if (userData && userData.username) {
                        users.push({
                            username: userData.username,
                            credits: userData.state?.credits || 0,
                            prestige: userData.state?.prestige || 0,
                            lastPlayed: userData.state?.lastPlayed || 'Неизвестно'
                        });
                    }
                } catch (e) {
                    console.error('Ошибка загрузки пользователя:', key, e);
                }
            }
        }
        return users;
    }
}

// Экспортируем класс
if (typeof window !== 'undefined') {
    window.AdminManager = AdminManager;
}