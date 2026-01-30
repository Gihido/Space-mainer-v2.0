// ===== ИСПРАВЛЕНИЯ ДЛЯ ВСЕХ ПРОБЛЕМ ИГРЫ =====

// Расширяем прототип игры для исправления основных проблем

// Исправление 1: Правильная система престижа (запоминает количество престижей)
SpaceMinerGame.prototype.calculatePrestigeCost = function(prestigeCount) {
    // Базовая стоимость престижа
    const baseCost = 10000;
    // Множитель для каждого последующего престижа
    const multiplier = 1.1;
    
    // Рассчитываем стоимость с учетом уже совершенных престижей
    return Math.floor(baseCost * Math.pow(multiplier, prestigeCount));
};

// Исправление 2: Функция выполнения престижа с правильным подсчетом
SpaceMinerGame.prototype.executePrestige = function(totalPrestigeGains, oldTheme) {
    console.log('[executePrestige] Выполнение престижа, всего очков:', totalPrestigeGains);

    if (!this.currentUser || !this.state) {
        console.error('[executePrestige] Нет пользователя или состояния');
        return;
    }

    // Закрываем модальное окно
    this.closePrestigeModal();

    // Сохраняем данные которые НЕ сбрасываем
    const oldPrestige = this.state.prestige || 0;
    const oldPlayTime = this.state.playTime || 0;
    const oldTotalClicks = this.state.totalClicks || 0;
    const oldTotalEarned = this.state.totalEarned || 0;
    const oldMaxCombo = this.state.maxCombo || 1;
    const oldPrestigeUpgrades = this.state.prestigeUpgrades ? {...this.state.prestigeUpgrades} : {};
    const oldDoubleClickChance = this.state.doubleClickChance || 0;
    const oldEnergySavePercent = this.state.energySavePercent || 0;
    const oldAchievementsCollected = this.state.achievementsCollected ? {...this.state.achievementsCollected} : {};

    // ✅ ИСПРАВЛЕНИЕ: Сохраняем ВСЕ данные достижений
    const oldAchievementsData = this.achievements ? [...this.achievements] : [];

    // Сохраняем дерево престижных улучшений
    const oldPrestigeTree = this.prestigeUpgradesTree ? [...this.prestigeUpgradesTree] : [];

    // Рассчитываем итоговый уровень престижа (теперь правильно!)
    const newPrestige = oldPrestige + totalPrestigeGains;

    // Создаем новое состояние игры
    const newState = this.getInitialState();

    // Восстанавливаем сохраненные данные
    newState.prestige = newPrestige;
    newState.prestigeMultiplier = 1 + (newPrestige * 0.1);
    newState.playTime = oldPlayTime;
    newState.totalClicks = oldTotalClicks;
    newState.totalEarned = oldTotalEarned;
    newState.maxCombo = oldMaxCombo;

    // Ограничиваем шанс двойного клика 2.5%
    // +0.1% за каждый престиж, но не более 2.5%
    const maxDoubleClickChance = 0.025; // 2.5%
    const doubleClickFromPrestige = Math.min(newPrestige * 0.001, maxDoubleClickChance);
    newState.doubleClickChance = Math.min(oldDoubleClickChance + doubleClickFromPrestige, maxDoubleClickChance);

    // Восстанавливаем престижные апгрейды
    if (oldPrestigeUpgrades && Object.keys(oldPrestigeUpgrades).length > 0) {
        newState.prestigeUpgrades = oldPrestigeUpgrades;
    }

    // Сохраняем сохраненные шансы и проценты
    newState.energySavePercent = oldEnergySavePercent;

    // Сохраняем собранные награды достижений
    newState.achievementsCollected = oldAchievementsCollected;

    // Сохраняем часть энергии в зависимости от сохранения энергии
    const energyToKeep = Math.floor(this.state.energy * oldEnergySavePercent);
    newState.energy = Math.min(newState.maxEnergy, energyToKeep);

    // Даем стартовый бонус в зависимости от уровня престижа
    const startBonus = 1000 * (1 + newPrestige * 0.5);
    newState.credits = Math.floor(startBonus);

    // Устанавливаем новое состояние
    this.state = newState;

    // Восстанавливаем ВСЕ достижения полностью
    if (oldAchievementsData.length > 0) {
        this.achievements = oldAchievementsData;
    }

    // Восстанавливаем престижные улучшения
    if (oldPrestigeTree.length > 0) {
        this.prestigeUpgradesTree = oldPrestigeTree;
    }

    // Инициализируем данные заново
    this.initGameData();

    // Определяем новую тему планеты
    const newTheme = this.determinePlanetTheme(newPrestige);

    // Проигрываем анимацию смены планеты
    this.playPrestigePlanetChangeAnimation(oldTheme, newTheme);

    // Обновляем тему планеты
    this.currentPlanetTheme = Object.keys(this.planetThemes).find(key =>
        this.planetThemes[key].name === newTheme.name
    ) || 'default';

    // Обновляем внешний вид планеты
    this.updatePlanetAppearance();

    // Показываем уведомление
    this.showNotification(
        `Престиж выполнен! Получено ${totalPrestigeGains} очков престижа! ` +
        `Множитель: x${this.state.prestigeMultiplier.toFixed(2)}. ` +
        `Стартовый бонус: ${this.formatNumber(startBonus)} кредитов. ` +
        `Шанс крита: ${(newState.doubleClickChance * 100).toFixed(1)}%`,
        'success'
    );

    // Обновляем интерфейс
    this.renderAll();
    this.updatePrestigeButton();

    // Сохраняем игру
    this.saveGame();

    console.log('[executePrestige] Престиж выполнен, новые очки:', newPrestige,
               'множитель:', this.state.prestigeMultiplier.toFixed(2),
               'шанс крита:', (newState.doubleClickChance * 100).toFixed(1) + '%');
};

// Исправление 3: Правильное обновление стоимости престижа
SpaceMinerGame.prototype.updatePrestigeButton = function() {
    if (!this.state) return;
    
    const button = document.getElementById('prestige-button');
    const requirementElement = document.getElementById('prestige-requirement');
    const gainElement = document.getElementById('prestige-gain');
    
    if (!button || !requirementElement || !gainElement) return;

    // Используем общее количество престижей для расчета
    const totalPrestige = this.state.prestige || 0;
    const nextPrestigeCost = this.calculatePrestigeCost(totalPrestige);
    const nextPrestigeGain = this.calculatePrestigeGain();

    requirementElement.textContent = this.formatNumber(nextPrestigeCost);
    gainElement.textContent = nextPrestigeGain;

    const canAfford = this.state.credits >= nextPrestigeCost;
    button.disabled = !canAfford;

    if (button.disabled) {
        button.innerHTML = `
            <i class="fas fa-rocket"></i>
            <span>ПРЕСТИЖ</span>
            <small>Требуется больше кредитов</small>
        `;
    } else {
        button.innerHTML = `
            <i class="fas fa-rocket"></i>
            <span>ПРЕСТИЖ</span>
            <small>${this.formatNumber(nextPrestigeCost)} → ${nextPrestigeGain} очков</small>
        `;
    }
};

// Исправление 4: Правильная функция расчета престижных очков
SpaceMinerGame.prototype.calculatePrestigeGain = function() {
    if (!this.state) return 0;
    
    const currentCredits = this.state.credits || 0;
    const currentPrestige = this.state.prestige || 0;
    const requiredCredits = this.calculatePrestigeCost(currentPrestige);
    
    // Если хватает средств, то получаем 1 престиж
    if (currentCredits >= requiredCredits) {
        return 1;
    }
    
    return 0;
};

// Исправление 5: Улучшенная функция покупки улучшений с защитой от двойного клика
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

    // Защита от слишком частых покупок
    const now = Date.now();
    if (now - this.state.lastPurchaseTime < this.state.purchaseCooldown) {
        console.log('[buyUpgrade] Кулдаун активен');
        this.showPurchaseTimer();
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

// Исправление 6: Улучшенная функция рендеринга дерева улучшений
SpaceMinerGame.prototype.renderUpgrades = function() {
    console.log('[renderUpgrades] Рендеринг дерева улучшений...');
    
    const container = document.getElementById('tree-container');
    if (!container) {
        console.error('[renderUpgrades] Контейнер дерева не найден');
        return;
    }

    // Проверяем существование деревьев улучшений
    if (!Array.isArray(this.upgradesTree)) {
        console.error('[renderUpgrades] upgradesTree не является массивом! Переинициализация...');
        this.upgradesTree = [];
    }

    // Создаем основной контейнер для дерева
    container.innerHTML = `
        <div class="upgrade-tree" style="transform: translate(${this.state.treeOffsetX || 0}px, ${this.state.treeOffsetY || 0}px) scale(${this.state.treeZoom || 1})">
            <svg class="upgrade-connections" width="2000" height="2000"></svg>
            <div class="upgrade-nodes-container"></div>
        </div>
    `;

    const nodesContainer = container.querySelector('.upgrade-nodes-container');
    const svg = container.querySelector('.upgrade-connections');
    svg.innerHTML = ''; // Очищаем старые связи

    // Объединяем обычные и престижные улучшения
    const allUpgrades = [...this.upgradesTree];
    if (Array.isArray(this.prestigeUpgradesTree)) {
        allUpgrades.push(...this.prestigeUpgradesTree);
    }

    console.log('[renderUpgrades] Всего улучшений для отображения:', allUpgrades.length);

    // Рендерим связи между улучшениями
    allUpgrades.forEach(upgrade => {
        if (upgrade.connections && upgrade.connections.length > 0) {
            const fromNode = allUpgrades.find(u => u.id === upgrade.id);
            if (!fromNode) return;

            upgrade.connections.forEach(toId => {
                const toNode = allUpgrades.find(u => u.id === toId);
                if (toNode) {
                    this.drawConnection(svg, fromNode, toNode);
                }
            });
        }
    });

    // Рендерим узлы улучшений
    allUpgrades.forEach(upgrade => {
        const level = this.state.upgrades[upgrade.id]?.level || 0;
        const isMaxed = level >= upgrade.maxLevel;
        const isUnlocked = this.isUpgradeUnlocked(upgrade);
        const canAfford = this.canAffordUpgrade(upgrade);
        
        const nodeClass = [
            'upgrade-node',
            `upgrade-${upgrade.branch || 'default'}-branch`,
            level > 0 ? 'purchased' : '',
            isMaxed ? 'maxed' : '',
            isUnlocked ? 'unlocked' : 'locked',
            !isUnlocked || isMaxed ? '' : canAfford ? 'available' : 'unavailable'
        ].filter(c => c).join(' ');

        const currencyType = typeof upgrade.basePrice === 'object' ? 'mixed' : upgrade.currency;
        const isMixedCurrency = currencyType === 'mixed';
        const isPrestigeUpgrade = upgrade.branch === 'prestige' || upgrade.isPrestigeUpgrade;

        const nodeHTML = `
            <div class="${nodeClass}" 
                 style="left: ${upgrade.position.x || 0}px; top: ${upgrade.position.y || 0}px;"
                 onclick="window.game.buyUpgrade('${upgrade.id}')"
                 data-upgrade-id="${upgrade.id}"
                 data-level="${level}">
                <div class="upgrade-icon-wrapper">
                    <i class="upgrade-icon ${upgrade.icon}"></i>
                    ${level > 0 ? `<div class="upgrade-level-badge">${level}/${upgrade.maxLevel}</div>` : ''}
                </div>
                <div class="upgrade-tooltip">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                    ${level < upgrade.maxLevel ? `
                    <div class="upgrade-price">
                        ${this.formatUpgradePrice(upgrade)}
                    </div>
                    ` : '<div class="upgrade-status maxed">МАКС</div>'}
                    <div class="upgrade-status ${isUnlocked ? (isMaxed ? 'maxed' : (canAfford ? 'available' : 'unavailable')) : 'locked'}">
                        ${isUnlocked ? (isMaxed ? 'МАКС' : (canAfford ? 'ДОСТУПНО' : 'НЕ ХВАТАЕТ РЕСУРСОВ')) : 'ЗАБЛОКИРОВАНО'}
                    </div>
                    ${upgrade.requirements && upgrade.requirements.length > 0 ? `
                    <div class="upgrade-requirements">
                        Требования: ${upgrade.requirements.map(req => {
                            const reqUpgrade = allUpgrades.find(u => u.id === req.id);
                            return reqUpgrade ? `${reqUpgrade.name} ${req.level} ур.` : `Неизвестно ${req.level} ур.`;
                        }).join(', ')}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        nodesContainer.insertAdjacentHTML('beforeend', nodeHTML);
    });

    console.log('[renderUpgrades] Дерево отрисовано');
};

// Исправление 7: Функция для отображения престижных функций
SpaceMinerGame.prototype.showPrestigeFunctions = function() {
    console.log('[showPrestigeFunctions] Открытие престижных функций');
    
    // Сначала закрываем все открытые секции
    this.closeAllSections();
    
    // Открываем секцию престижных функций
    this.switchSection('prestige-functions');
    
    // Рендерим содержимое
    this.renderPrestigeFunctions();
};

// Исправление 8: Рендер престижных функций
SpaceMinerGame.prototype.renderPrestigeFunctions = function() {
    const container = document.getElementById('prestige-functions-grid');
    if (!container) return;

    // Инициализируем престижные функции если нужно
    if (!this.prestigeFunctions) {
        this.initPrestigeFunctions();
    }

    container.innerHTML = '';

    this.prestigeFunctions.forEach(func => {
        const owned = this.state.purchasedPrestigeFunctions?.[func.id] || false;
        const canBuy = !owned && this.state.prestige >= func.price;
        
        const functionHTML = `
            <div class="prestige-function ${owned ? 'owned' : (canBuy ? '' : 'locked')}" data-function-id="${func.id}">
                <div class="prestige-function-icon">
                    <i class="${func.icon}"></i>
                </div>
                <div class="prestige-function-name">${func.name}</div>
                <div class="prestige-function-description">${func.description}</div>
                <div class="prestige-function-cost">
                    ${owned ? 'Куплено' : `${func.price} престижных монет`}
                </div>
                <button class="prestige-function-buy-btn" 
                        onclick="window.game.buyPrestigeFunction('${func.id}')" 
                        ${owned || !canBuy ? 'disabled' : ''}>
                    ${owned ? 'Куплено' : 'Купить'}
                </button>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', functionHTML);
    });
};

// Исправление 9: Покупка престижной функции
SpaceMinerGame.prototype.buyPrestigeFunction = function(functionId) {
    console.log('[buyPrestigeFunction] Покупка престижной функции:', functionId);
    
    const func = this.prestigeFunctions.find(f => f.id === functionId);
    if (!func) {
        console.error('[buyPrestigeFunction] Функция не найдена:', functionId);
        return;
    }

    if (this.state.purchasedPrestigeFunctions[functionId]) {
        console.error('[buyPrestigeFunction] Функция уже куплена:', functionId);
        return;
    }

    if (this.state.prestige < func.price) {
        console.error('[buyPrestigeFunction] Недостаточно престижных очков');
        this.showNotification('Недостаточно престижных очков!', 'error');
        return;
    }

    // Снимаем престижные очки
    this.state.prestige -= func.price;
    
    // Отмечаем как купленную
    if (!this.state.purchasedPrestigeFunctions) {
        this.state.purchasedPrestigeFunctions = {};
    }
    this.state.purchasedPrestigeFunctions[functionId] = true;

    // Применяем эффект функции
    if (functionId === 'golden_click_upgrade') {
        // Добавляем золотое улучшение в дерево улучшений
        const goldenUpgrade = {
            id: 'gold_basic_1',
            name: 'Золотой усиленный перфоратор',
            description: 'Увеличивает мощность клика в 2 раза (бонус к клику)',
            icon: 'fas fa-gem',
            basePrice: { credits: 100000, minerals: 50000 },
            priceMultiplier: 1.0,
            effect: { clickPowerMultiplier: 2 },
            maxLevel: 1,
            requirements: [{ id: 'basic_4', level: 3 }],
            unlocked: true,
            purchased: false,
            position: { x: -600, y: -450 },
            level: 0,
            connections: [],
            currency: 'mixed',
            branch: 'gold_basic',
            isGoldUpgrade: true
        };
        
        // Добавляем в дерево улучшений если его там нет
        const existingUpgrade = this.upgradesTree.find(u => u.id === goldenUpgrade.id);
        if (!existingUpgrade) {
            this.upgradesTree.push(goldenUpgrade);
        }
    }

    // Обновляем интерфейс
    this.renderPrestigeFunctions();
    this.renderUpgrades();
    this.updateResourcesDisplay();
    
    // Показываем уведомление
    this.showNotification(`Куплено: ${func.name}!`, 'success');

    // Сохраняем игру
    this.saveGame();

    console.log(`[buyPrestigeFunction] Функция куплена: ${functionId} за ${func.price} престижных монет`);
};

// Исправление 10: Инициализация престижных функций
SpaceMinerGame.prototype.initPrestigeFunctions = function() {
    this.prestigeFunctions = [
        {
            id: 'golden_click_upgrade',
            name: 'Золотая ветвь улучшения клика',
            description: 'Открывает специальное золотое улучшение, которое даёт x2 к силе клика. Улучшение стоит 50,000 кредитов и 25,000 минералов. Может быть куплено только 1 раз и не сбрасывается при престиже.',
            icon: 'fas fa-gem',
            price: 5,
            oneTime: true
        }
    ];
};

// Исправление 11: Улучшенная функция обработки двойного клика
SpaceMinerGame.prototype.handleDoubleClick = function() {
    // Проверяем шанс двойного клика
    const doubleClickChance = this.state.doubleClickChance || 0;
    const isDoubleClick = Math.random() < doubleClickChance;
    
    if (isDoubleClick) {
        // Удваиваем силу клика для этого клика
        return 2;
    }
    
    return 1;
};

// Исправление 12: Защита от двойного клика после 5-го престижа
SpaceMinerGame.prototype.handleClick = function() {
    // Защита от слишком частых кликов
    const now = Date.now();
    if (now - this.lastClickTime < 100) { // Минимальная задержка 100мс
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

// Исправление 13: Улучшенная функция проверки ресурсов для улучшения
SpaceMinerGame.prototype.canAffordUpgrade = function(upgrade) {
    if (!this.state || !upgrade) return false;

    const currentLevel = this.state.upgrades[upgrade.id]?.level || 0;
    if (currentLevel >= upgrade.maxLevel) return false;

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
            return false;
        }
    }

    return true;
};