// ===== ДОПОЛНИТЕЛЬНЫЕ ИСПРАВЛЕНИЯ ДЛЯ МОБИЛЬНЫХ УСТРОЙСТВ =====

// Исправление для стабильной работы покупки улучшений на мобильных устройствах
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчики для предотвращения двойного клика на мобильных устройствах
    let touchStartTime = 0;
    let doubleClickPrevented = false;

    // Обработчик начала касания
    document.addEventListener('touchstart', function(e) {
        touchStartTime = Date.now();
    });

    // Обработчик окончания касания
    document.addEventListener('touchend', function(e) {
        const touchDuration = Date.now() - touchStartTime;
        
        // Если касание было слишком коротким, возможно это клик
        if (touchDuration < 200) {
            // Предотвращаем случайные двойные клики
            if (!doubleClickPrevented) {
                doubleClickPrevented = true;
                setTimeout(() => {
                    doubleClickPrevented = false;
                }, 300); // 300мс задержка между кликами
            } else {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }
    }, { passive: false });

    // Исправление для обработки кликов по улучшениям на мобильных устройствах
    document.addEventListener('click', function(e) {
        // Проверяем, является ли элемент улучшением
        const upgradeNode = e.target.closest('.upgrade-node');
        if (upgradeNode) {
            // Предотвращаем двойной клик
            e.preventDefault();
            e.stopPropagation();
            
            // Получаем ID улучшения
            const upgradeId = upgradeNode.dataset.upgradeId;
            if (upgradeId && window.game) {
                // Вызываем покупку с небольшой задержкой для предотвращения двойного вызова
                setTimeout(() => {
                    window.game.buyUpgrade(upgradeId);
                }, 50);
            }
        }
    }, { passive: false });

    // Исправление для обработки событий на мобильных устройствах
    if ('ontouchstart' in window) {
        // Для мобильных устройств используем touch события
        document.addEventListener('touchend', function(e) {
            const upgradeNode = e.target.closest('.upgrade-node');
            if (upgradeNode) {
                e.preventDefault();
                e.stopPropagation();
                
                const upgradeId = upgradeNode.dataset.upgradeId;
                if (upgradeId && window.game) {
                    setTimeout(() => {
                        window.game.buyUpgrade(upgradeId);
                    }, 50);
                }
            }
        }, { passive: false });
    }
});

// Исправление функции покупки улучшений с дополнительной защитой
SpaceMinerGame.prototype.buyUpgrade = function(upgradeId) {
    // Проверяем, существует ли пользователь и состояние игры
    if (!this.currentUser) {
        console.log('[buyUpgrade] Нет пользователя');
        return;
    }
    
    if (!this.state) {
        console.error('[buyUpgrade] Нет состояния игры');
        return;
    }

    console.log('[buyUpgrade] Покупка улучшения:', upgradeId);

    // Защита от слишком частых покупок (для мобильных устройств)
    const now = Date.now();
    if (this.state.lastPurchaseTime && (now - this.state.lastPurchaseTime) < 200) { // 200мс задержка
        console.log('[buyUpgrade] Слишком частые покупки');
        return;
    }

    // Находим улучшение в соответствующем дереве
    let upgrade = this.upgradesTree.find(u => u.id === upgradeId);
    let isPrestigeUpgrade = false;
    
    if (!upgrade) {
        upgrade = this.prestigeUpgradesTree?.find(u => u.id === upgradeId) || null;
        isPrestigeUpgrade = true;
    }

    if (!upgrade) {
        console.error('[buyUpgrade] Улучшение не найдено:', upgradeId);
        return;
    }

    // Проверяем требования
    if (upgrade.requirements && upgrade.requirements.length > 0) {
        let requirementsMet = true;
        
        for (const req of upgrade.requirements) {
            let reqUpgrade = this.upgradesTree.find(u => u.id === req.id);
            if (!reqUpgrade) {
                reqUpgrade = this.prestigeUpgradesTree?.find(u => u.id === req.id) || null;
            }
            
            if (!reqUpgrade || reqUpgrade.level < req.level) {
                requirementsMet = false;
                break;
            }
        }
        
        if (!requirementsMet) {
            console.log('[buyUpgrade] Требования не выполнены для:', upgradeId);
            this.showNotification('Не выполнены требования для этого улучшения!', 'warning');
            return;
        }
    }

    // Проверяем максимальный уровень
    const currentLevel = this.state.upgrades[upgradeId]?.level || 0;
    if (currentLevel >= upgrade.maxLevel) {
        console.log('[buyUpgrade] Максимальный уровень достигнут');
        this.showNotification('Достигнут максимальный уровень улучшения!', 'warning');
        return;
    }

    // Рассчитываем цену
    let totalPrice = {};
    
    if (typeof upgrade.basePrice === 'object') {
        // Смешанная валюта
        for (const [currency, baseAmount] of Object.entries(upgrade.basePrice)) {
            const multiplier = upgrade.priceMultiplier || 1.0;
            const levelMultiplier = Math.pow(multiplier, currentLevel);
            totalPrice[currency] = Math.floor(baseAmount * levelMultiplier);
        }
    } else {
        // Одна валюта
        const multiplier = upgrade.priceMultiplier || 1.0;
        const levelMultiplier = Math.pow(multiplier, currentLevel);
        const basePrice = upgrade.basePrice;
        totalPrice[upgrade.currency] = Math.floor(basePrice * levelMultiplier);
    }

    // Проверяем наличие ресурсов
    for (const [currency, amount] of Object.entries(totalPrice)) {
        let currentAmount = 0;
        
        switch (currency) {
            case 'credits':
                currentAmount = this.state.credits;
                break;
            case 'minerals':
                currentAmount = this.state.minerals;
                break;
            default:
                currentAmount = this.state[currency] || 0;
        }

        if (currentAmount < amount) {
            console.log('[buyUpgrade] Недостаточно ресурсов:', currency);
            this.showNotification(`Недостаточно ${this.getCurrencyName(currency)}!`, 'error');
            return;
        }
    }

    // Снимаем ресурсы
    for (const [currency, amount] of Object.entries(totalPrice)) {
        switch (currency) {
            case 'credits':
                this.state.credits -= amount;
                break;
            case 'minerals':
                this.state.minerals -= amount;
                break;
            default:
                this.state[currency] = (this.state[currency] || 0) - amount;
        }
    }

    // Обновляем уровень улучшения
    if (!this.state.upgrades[upgradeId]) {
        this.state.upgrades[upgradeId] = { level: 0 };
    }
    this.state.upgrades[upgradeId].level += 1;
    
    // Применяем эффект улучшения
    this.applyUpgradeEffect(upgrade, this.state.upgrades[upgradeId].level);

    // Обновляем время последней покупки
    this.state.lastPurchaseTime = Date.now();

    // Обновляем интерфейс
    this.renderUpgrades();
    this.updateResourcesDisplay();

    console.log(`[buyUpgrade] Улучшение куплено: ${upgradeId} уровень ${currentLevel + 1}`);
    this.showNotification(`${upgrade.name} улучшен до ${currentLevel + 1} уровня!`, 'success');

    // Сохраняем игру
    this.saveGame();
};

// Исправление для предотвращения двойного клика на планете
SpaceMinerGame.prototype.handleClick = function() {
    // Защита от слишком частых кликов
    const now = Date.now();
    if (now - (this.lastClickTime || 0) < 100) { // Минимальная задержка 100мс
        return;
    }
    this.lastClickTime = now;

    if (!this.state) return;

    // Получаем базовую силу клика
    let clickPower = this.state.clickPower || 1;

    // Применяем множители
    clickPower *= this.state.tempClickMultiplier || 1;
    clickPower *= this.state.prestigeMultiplier || 1;
    
    // Проверяем на двойной клик
    const doubleClickMultiplier = this.handleDoubleClick();
    clickPower *= doubleClickMultiplier;

    // Проверяем энергию
    const energyCost = 1;
    if (this.state.energy < energyCost) {
        this.showNotification('Недостаточно энергии!', 'warning');
        return;
    }

    // Снимаем энергию
    this.state.energy -= energyCost;

    // Добавляем кредиты
    this.state.credits += clickPower;
    this.state.totalClicks = (this.state.totalClicks || 0) + 1;
    this.state.totalEarned = (this.state.totalEarned || 0) + clickPower;

    // Обновляем комбо
    this.updateCombo();

    // Проверяем шанс получения минералов
    this.checkMineralChance();

    // Обновляем интерфейс
    this.updateResourcesDisplay();
    this.updateEnergyDisplay();

    // Проверяем достижения
    this.checkAchievements();

    // Показываем визуальный эффект клика
    this.showClickEffect(clickPower, doubleClickMultiplier > 1);

    // Автосохранение
    if (this.state.totalClicks % 10 === 0) {
        this.saveGame();
    }
};

// Исправление для правильного расчета стоимости престижа
SpaceMinerGame.prototype.calculatePrestigeCost = function(prestigeCount) {
    // Базовая стоимость престижа - всегда постоянна
    const baseCost = 10000;
    // Множитель для каждого последующего престижа
    const multiplier = 1.1;
    
    // Рассчитываем стоимость с учетом уже совершенных престижей
    // ВАЖНО: используем общее количество престижей, а не текущий уровень
    return Math.floor(baseCost * Math.pow(multiplier, prestigeCount));
};