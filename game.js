// ===== ОСНОВНОЙ ФАЙЛ ИГРЫ =====

class SpaceMinerGame {
    constructor() {
        console.log('[CONSTRUCTOR] Инициализация игры...');
        
        // Текущий пользователь
        this.currentUser = null;
        
        // Инициализация состояния игры
        this.state = null;
        
        // Инициализация данных игры
        this.upgradesTree = [];
        this.prestigeUpgradesTree = [];
        this.shopItems = [];
        this.achievements = [];
        this.prestigeFunctions = [];
        this.inventory = [];
        
        // Переменные для управления
        this.autoSaveInterval = null;
        this.lastShopRender = 0;
        this.lastTimeUpdate = Date.now();
        this.escapeHandler = null;
        this.profileEscapeHandler = null;
        this.deleteEscapeHandler = null;
        
        // Для разных планет
        this.planetThemes = {
            default: {
                name: 'Базовая планета',
                color1: '#ff9500',
                color2: '#ff3e00',
                color3: '#9d4edd',
                boostText: 'Без бонусов',
                minPrestige: 0
            },
            prestige1: {
                name: 'Планета новичка',
                color1: '#00d4ff',
                color2: '#9d4edd',
                color3: '#ff00ff',
                boostText: 'Бонус: +10% к доходу',
                minPrestige: 1,
                incomeBonus: 0.1
            },
            prestige5: {
                name: 'Опытная планета',
                color1: '#00ff9d',
                color2: '#00d4ff',
                color3: '#9d4edd',
                boostText: 'Бонус: +25% к доходу, +5% к шансу минералов',
                minPrestige: 5,
                incomeBonus: 0.25,
                mineralBonus: 0.05
            },
            prestige10: {
                name: 'Элитная планета',
                color1: '#ffd700',
                color2: '#ff9500',
                color3: '#ff3e00',
                boostText: 'Бонус: +50% к доходу, +10% к шансу минералов, +5% к шансу двойного клика',
                minPrestige: 10,
                incomeBonus: 0.5,
                mineralBonus: 0.1,
                doubleClickBonus: 0.05
            }
        };
        
        // Текущая тема планеты
        this.currentPlanetTheme = 'default';
        
        // Для анимаций
        this.loginAnimationShown = false;
        this.prestigeAnimationShown = false;
        
        console.log('[CONSTRUCTOR] Игра инициализирована');

        
    }
    
    init() {
        console.log('[init] Запуск игры...');
        
        // Добавить защиту от частых обновлений
        this.renderTimeout = null;
        this.renderThrottleDelay = 100; // Минимальная задержка между обновлениями
    
        // ВСЕГДА показываем экран входа (убрать авто-вход)
        this.showLoginScreen();
        
        // Показываем патч-нотсы если это первая игра или после обновления
        this.showPatchNotes();
        
        console.log('[init] Игра запущена');
    }

    getInitialState() {
        console.log('[getInitialState] Создание начального состояния');
        return {
            // Ресурсы - начинаем с 0
            credits: 0,
            minerals: 0,
            prestige: 0,
            
            // Энергия
            energy: 100,
            maxEnergy: 100,
            energyRegen: 1,
            
            // Статистика
            clickPower: 1,
            autoIncome: 0,
            totalClicks: 0,
            totalEarned: 0,
            playTime: 0,
            maxCombo: 1,
            
            // Комбо
            combo: 1,
            comboTime: 0,
            comboTimeout: 3000,
            
            // Улучшения - изначально пусто
            upgrades: {},
            
            // Престижные улучшения - изначально пусто
            prestigeUpgrades: {},
            doubleClickChance: 0,  // ✅ Будет ограничено 2.5%
            energySavePercent: 0,
            
            // Достижения
            achievements: {},
            achievementsCollected: {},
            
            // Магазин
            shopCooldowns: {},
            activeBoosts: {},
            
            // Престиж бонусы
            prestigeMultiplier: 1,
            
            // ✅ ИСПРАВЛЕНИЕ 5: Кулдаун покупки 1 секунда
            lastPurchaseTime: 0,
            purchaseCooldown: 1000,  // Было 5000
            
            // Бусты из магазина
            tempClickMultiplier: 1,
            mineralBoost: 1,
            comboDecayMultiplier: 1,
            goldenClicks: 0,
            goldenMultiplier: 1,
            autoBoost: 1,
            
            // Позиция дерева
            treeOffsetX: 0,
            treeOffsetY: 0,
            treeZoom: 1,
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            
            // Инвентарь
            inventory: [],
            
            // Престижные функции
            purchasedPrestigeFunctions: {},
            
            // Мобильные улучшения
            mobileUpgradePanelOpen: false,
            currentMobileUpgradeId: null,
            
            // Дата создания
            createdAt: new Date().toISOString(),
            lastPlayed: new Date().toISOString(),
            
            // Текущие активные бусты магазина
            shopActiveBoosts: {}
        };
    }
    
    initGameData() {
        console.log('[initGameData] Инициализация данных игры...');
        
        // Проверяем, есть ли состояние игры
        const hasState = this.state !== null;
        const currentPrestige = hasState ? this.state.prestige : 0;
        
        console.log('[initGameData] Текущий престиж:', currentPrestige);
        
        // Полное дерево улучшений с ветвями
        this.upgradesTree = [
            {
                id: 'start',
                name: 'Начальная база',
                description: 'Базовая шахта для добычи ресурсов. Позволяет начать добычу!',
                icon: 'fas fa-home',
                basePrice: 100,
                priceMultiplier: 1.0,
                effect: { clickPower: 1 },
                maxLevel: 1,
                requirements: [],
                unlocked: true,
                purchased: false,
                position: { x: 0, y: 0 },
                level: 0,
                connections: ['basic_1', 'auto_1', 'mining_1', 'energy_1'],
                currency: 'credits',
                branch: 'start'
            },
            {
                id: 'gold_basic_1',
                name: 'Золотой усиленный перфоратор',
                description: 'Увеличивает мощность клика в 2 раза (бонус к клику)',
                icon: 'fas fa-gem',
                basePrice: { credits: 50000, minerals: 100000 },
                priceMultiplier: 1.0, // Не увеличивается цена
                effect: { clickPowerMultiplier: 2 },
                maxLevel: 1,
                requirements: [{ id: 'basic_4', level: 3 }],
                unlocked: false,
                purchased: false,
                position: { x: -600, y: -450 },
                level: 5,
                connections: [],
                currency: 'mixed',
                branch: 'gold_basic',
                isGoldUpgrade: true // Это золотое улучшение
            },
            
            // === ВЕТВЬ БАЗОВЫХ УЛУЧШЕНИЙ ===
            {
                id: 'basic_1',
                name: 'Усиленный перфоратор',
                description: 'Увеличивает мощность клика на +1',
                icon: 'fas fa-hammer',
                basePrice: 500,
                priceMultiplier: 1.8,
                effect: { clickPower: 1 },
                maxLevel: 10,
                requirements: [{ id: 'start', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -200, y: -150 },
                level: 1,
                connections: ['basic_2'],
                currency: 'credits',
                branch: 'basic'
            },
            {
                id: 'basic_2',
                name: 'Титановые наконечники',
                description: 'Увеличивает мощность клика на +2',
                icon: 'fas fa-gem',
                basePrice: 2000,
                priceMultiplier: 2.0,
                effect: { clickPower: 2 },
                maxLevel: 5,
                requirements: [{ id: 'basic_1', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -300, y: -250 },
                level: 2,
                connections: ['basic_3'],
                currency: 'credits',
                branch: 'basic'
            },
            {
                id: 'basic_3',
                name: 'Плазменный бурильщик',
                description: 'Увеличивает мощность клика на +5',
                icon: 'fas fa-bolt',
                basePrice: 10000,
                priceMultiplier: 2.2,
                effect: { clickPower: 5 },
                maxLevel: 5,
                requirements: [{ id: 'basic_2', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -400, y: -350 },
                level: 3,
                connections: ['basic_4'],
                currency: 'credits',
                branch: 'basic'
            },
            {
                id: 'basic_4',
                name: 'Квантовый ускоритель',
                description: 'Увеличивает мощность клика на +10',
                icon: 'fas fa-atom',
                basePrice: 50000,
                priceMultiplier: 2.5,
                effect: { clickPower: 10 },
                maxLevel: 3,
                requirements: [{ id: 'basic_3', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -500, y: -450 },
                level: 4,
                connections: [],
                currency: 'credits',
                branch: 'basic'
            },
            
            // === ВЕТВЬ АВТОМАТИЗАЦИИ (СМЕШАННЫЕ РЕСУРСЫ) ===
            {
                id: 'auto_1',
                name: 'Автоматическая дрель',
                description: 'Добывает +1 кредит в секунду',
                icon: 'fas fa-robot',
                basePrice: { credits: 2000, minerals: 5 },
                priceMultiplier: 1.8,
                effect: { autoIncome: 1 },
                maxLevel: 10,
                requirements: [{ id: 'start', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 200, y: -150 },
                level: 1,
                connections: ['auto_2'],
                currency: 'mixed',
                branch: 'auto'
            },
            {
                id: 'auto_2',
                name: 'Конвейерная линия',
                description: 'Добывает +5 кредитов в секунду',
                icon: 'fas fa-conveyor-belt',
                basePrice: { credits: 5000, minerals: 15 },
                priceMultiplier: 2.0,
                effect: { autoIncome: 5 },
                maxLevel: 5,
                requirements: [{ id: 'auto_1', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 300, y: -250 },
                level: 2,
                connections: ['auto_3'],
                currency: 'mixed',
                branch: 'auto'
            },
            {
                id: 'auto_3',
                name: 'Роботизированный завод',
                description: 'Добывает +20 кредитов в секунду',
                icon: 'fas fa-industry',
                basePrice: { credits: 15000, minerals: 30 },
                priceMultiplier: 2.2,
                effect: { autoIncome: 20 },
                maxLevel: 5,
                requirements: [{ id: 'auto_2', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 400, y: -350 },
                level: 3,
                connections: ['auto_4'],
                currency: 'mixed',
                branch: 'auto'
            },
            {
                id: 'auto_4',
                name: 'Искусственный интеллект',
                description: 'Добывает +100 кредитов в секунду',
                icon: 'fas fa-brain',
                basePrice: { credits: 50000, minerals: 50 },
                priceMultiplier: 2.5,
                effect: { autoIncome: 100 },
                maxLevel: 3,
                requirements: [{ id: 'auto_3', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 500, y: -450 },
                level: 4,
                connections: [],
                currency: 'mixed',
                branch: 'auto'
            },
            
            // === ВЕТВЬ ДОБЫЧИ МИНЕРАЛОВ ===
            {
                id: 'mining_1',
                name: 'Геологический сканер',
                description: 'Увеличивает шанс минералов на +2.5%',
                icon: 'fas fa-satellite',
                basePrice: 30,
                priceMultiplier: 1.8,
                effect: { mineralChance: 0.025 },
                maxLevel: 10,
                requirements: [{ id: 'start', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -200, y: 150 },
                level: 1,
                connections: ['mining_2'],
                currency: 'minerals',
                branch: 'mining'
            },
            {
                id: 'mining_2',
                name: 'Глубинный бур',
                description: 'Дает +1 минерал за каждые 10 кликов',
                icon: 'fas fa-mountain',
                basePrice: 150,
                priceMultiplier: 2.0,
                effect: { mineralBonus: 1 },
                maxLevel: 5,
                requirements: [{ id: 'mining_1', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -300, y: 250 },
                level: 2,
                connections: ['mining_3'],
                currency: 'minerals',
                branch: 'mining'
            },
            {
                id: 'mining_3',
                name: 'Сейсмический взрыв',
                description: 'Шанс найти +2 минерала за клик',
                icon: 'fas fa-explosion',
                basePrice: 750,
                priceMultiplier: 2.2,
                effect: { mineralMultiplier: 2 },
                maxLevel: 3,
                requirements: [{ id: 'mining_2', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: -400, y: 350 },
                level: 3,
                connections: [],
                currency: 'minerals',
                branch: 'mining'
            },
            
            // === ВЕТВЬ ЭНЕРГИИ ===
            {
                id: 'energy_1',
                name: 'Солнечные панели',
                description: 'Максимальная энергия +25',
                icon: 'fas fa-solar-panel',
                basePrice: 2000,
                priceMultiplier: 1.8,
                effect: { maxEnergy: 25 },
                maxLevel: 5,
                requirements: [{ id: 'start', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 200, y: 150 },
                level: 1,
                connections: ['energy_2'],
                currency: 'credits',
                branch: 'energy'
            },
            {
                id: 'energy_2',
                name: 'Геотермальная станция',
                description: 'Регенерация энергии +0.5 в секунду',
                icon: 'fas fa-fire',
                basePrice: 10000,
                priceMultiplier: 2.0,
                effect: { energyRegen: 0.5 },
                maxLevel: 5,
                requirements: [{ id: 'energy_1', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 300, y: 250 },
                level: 2,
                connections: ['energy_3'],
                currency: 'credits',
                branch: 'energy'
            },
            {
                id: 'energy_3',
                name: 'Ядерный реактор',
                description: 'Максимальная энергия +100',
                icon: 'fas fa-radiation',
                basePrice: 50000,
                priceMultiplier: 2.2,
                effect: { maxEnergy: 100 },
                maxLevel: 3,
                requirements: [{ id: 'energy_2', level: 1 }],
                unlocked: false,
                purchased: false,
                position: { x: 400, y: 350 },
                level: 3,
                connections: [],
                currency: 'credits',
                branch: 'energy'
            }
        ];
        
        // === ПРЕСТИЖНЫЕ УЛУЧШЕНИЯ ===
        this.prestigeUpgradesTree = [
            {
                id: 'prestige_1',
                name: 'Пространственный ускоритель',
                description: 'Увеличивает скорость восстановления энергии на +0.2 за очко престижа',
                icon: 'fas fa-tachometer-alt',
                basePrice: 1,
                priceMultiplier: 1.8, // Changed from 3.0 to 1.8 to make upgrades cheaper
                effect: { 
                    type: 'energyRegenPerPrestige',
                    value: 0.2 
                },
                maxLevel: 10,
                requirements: [{ type: 'prestige', value: 1 }],
                unlocked: currentPrestige >= 1,
                purchased: false,
                position: { x: 0, y: -500 },
                level: 0,
                connections: ['prestige_2'],
                currency: 'prestige',
                branch: 'prestige'
            },
            {
                id: 'prestige_2',
                name: 'Квантовый дубликатор',
                description: 'Шанс получить двойной доход с клика: +1% за уровень',
                icon: 'fas fa-clone',
                basePrice: 2,
                priceMultiplier: 2.0, // Changed from 3.5 to 2.0 to make upgrades cheaper
                effect: { 
                    type: 'doubleClickChance',
                    value: 0.01 
                },
                maxLevel: 20,
                requirements: [{ id: 'prestige_1', level: 5 }],
                unlocked: false,
                purchased: false,
                position: { x: -200, y: -600 },
                level: 0,
                connections: ['prestige_3'],
                currency: 'prestige',
                branch: 'prestige'
            },
            {
                id: 'prestige_3',
                name: 'Сингулярный накопитель',
                description: 'Сохраняет 5% энергии после престижа (до 100%)',
                icon: 'fas fa-infinity',
                basePrice: 3,
                priceMultiplier: 2.2, // Changed from 4.0 to 2.2 to make upgrades cheaper
                effect: { 
                    type: 'energySave',
                    value: 0.05 
                },
                maxLevel: 20,
                requirements: [{ id: 'prestige_2', level: 10 }],
                unlocked: false,
                purchased: false,
                position: { x: 200, y: -600 },
                level: 0,
                connections: [],
                currency: 'prestige',
                branch: 'prestige'
            }
        ];
        
        // Автоматически разблокируем престижные улучшения если требования выполнены
        if (currentPrestige >= 1) {
            this.unlockPrestigeUpgrades();
        }

        // Магазин улучшений с бустами и анимациями (увеличенные цены)
        this.shopItems = [
            {
                id: 'shop_1',
                name: 'Энергетический напиток',
                description: 'Восстанавливает 50% энергии',
                icon: 'fas fa-wine-bottle',
                price: 500, // Увеличена цена
                effect: { 
                    type: 'energy', 
                    value: 50 
                },
                cooldown: 30,
                currency: 'credits',
                category: 'utility',
                animation: 'energy-drink',
                duration: 0
            },
            {
                id: 'shop_2',
                name: 'Взрывной коктейль',
                description: 'Следующий клик x10 на 5 секунд',
                icon: 'fas fa-glass-cheers',
                price: 1250, // Увеличена цена
                effect: { 
                    type: 'temporaryMultiplier', 
                    value: 10,
                    duration: 5 
                },
                cooldown: 60,
                currency: 'credits',
                category: 'click',
                animation: 'explosion',
                duration: 5
            },
            {
                id: 'shop_3',
                name: 'Золотые руки',
                description: 'Следующие 25 кликов x3',
                icon: 'fas fa-medal',
                price: 2500, // Увеличена цена
                effect: { 
                    type: 'goldenClicks', 
                    value: 25, 
                    multiplier: 3 
                },
                cooldown: 120,
                currency: 'credits',
                category: 'click',
                animation: 'golden-hands',
                duration: 0
            },
            {
                id: 'shop_4',
                name: 'Буст производительности',
                description: 'Автоматический доход x3 на 60 секунд',
                icon: 'fas fa-rocket',
                price: 5000, // Увеличена цена
                effect: { 
                    type: 'autoBoost', 
                    value: 3, 
                    duration: 60 
                },
                cooldown: 180,
                currency: 'credits',
                category: 'auto',
                animation: 'rocket-boost',
                duration: 60
            },
            {
                id: 'shop_5',
                name: 'Кристальный удач',
                description: 'Шанс минералов x3 на 30 секунд',
                icon: 'fas fa-dice',
                price: 3750, // Увеличена цена
                effect: { 
                    type: 'mineralBoost', 
                    value: 3, 
                    duration: 30 
                },
                cooldown: 150,
                currency: 'credits',
                category: 'mineral',
                animation: 'crystal-luck',
                duration: 30
            },
            {
                id: 'shop_6',
                name: 'Комбо-стимулятор',
                description: 'Комбо падает на 50% медленнее на 45 секунд',
                icon: 'fas fa-chart-line',
                price: 3000, // Увеличена цена
                effect: { 
                    type: 'comboBoost', 
                    value: 0.5, 
                    duration: 45 
                },
                cooldown: 120,
                currency: 'credits',
                category: 'combo',
                animation: 'combo-stimulator',
                duration: 45
            }
        ];

        // Престижные функции
        this.prestigeFunctions = [
            {
                id: 'golden_click_upgrade',
                name: 'Золотая ветвь улучшения клика',
                description: 'Даёт золотое улучшение, которое стоит 50 минералов и 100,000 кредитов. Улучшение даёт буст x2 к силе клика и может быть куплено только один раз. Не сбрасывается при престиже.',
                icon: 'fas fa-gem',
                price: 5, // Стоимость в престижных монетах
                currency: 'prestige',
                oneTime: true,
                effect: {
                    type: 'goldenClickUpgrade',
                    description: 'Золотое улучшение клика: x2 к силе клика'
                }
            }
        ];
        
        // Достижения с ПОНИЖЕННЫМИ наградами
        this.achievements = [
            {
                id: 'ach_1',
                name: 'Первый шаг',
                description: 'Сделать 10 кликов',
                icon: 'fas fa-shoe-prints',
                condition: { type: 'clicks', value: 10 },
                reward: { credits: 50 }, // Было 100
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_2',
                name: 'Начинающий майнер',
                description: 'Заработать 500 кредитов',
                icon: 'fas fa-coins',
                condition: { type: 'totalCredits', value: 500 },
                reward: { clickPower: 2 }, // Было 5
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_3',
                name: 'Автоматизация',
                description: 'Иметь 10 авто-кредитов в секунду',
                icon: 'fas fa-robot',
                condition: { type: 'autoIncome', value: 10 },
                reward: { autoIncome: 2 }, // Было 5
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_4',
                name: 'Кристальный король',
                description: 'Добыть 50 минералов',
                icon: 'fas fa-gem',
                condition: { type: 'minerals', value: 50 },
                reward: { mineralMultiplier: 1.5 }, // Было 2
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_5',
                name: 'Энергетический магнат',
                description: 'Максимальная энергия 300',
                icon: 'fas fa-bolt',
                condition: { type: 'maxEnergy', value: 300 },
                reward: { energyRegen: 0.5 }, // Было 1
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_6',
                name: 'Улучшатель',
                description: 'Купить 10 улучшений',
                icon: 'fas fa-tools',
                condition: { type: 'totalUpgrades', value: 10 },
                reward: { credits: 500 }, // Было 1000
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_7',
                name: 'Мастер комбо',
                description: 'Достигнуть комбо x5.0',
                icon: 'fas fa-fire',
                condition: { type: 'maxCombo', value: 5 },
                reward: { credits: 2500, comboDecayMultiplier: 0.9 }, // Было 5000 и 0.8
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_8',
                name: 'Первый престиж',
                description: 'Выполнить первый престиж',
                icon: 'fas fa-star',
                condition: { type: 'prestige', value: 1 },
                reward: { doubleClickChance: 0.02 }, // Было 0.05
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_9',
                name: 'Богатый майнер',
                description: 'Накопить 1,000,000 кредитов',
                icon: 'fas fa-crown',
                condition: { type: 'totalCredits', value: 1000000 },
                reward: { credits: 25000, prestigeMultiplier: 0.05 }, // Было 50000 и 0.1
                unlocked: false,
                rewardCollected: false
            },
            {
                id: 'ach_10',
                name: 'Легенда майнинга',
                description: 'Достигнуть 100 уровня престижа',
                icon: 'fas fa-trophy',
                condition: { type: 'prestige', value: 100 },
                reward: { credits: 500000, clickPower: 50, autoIncome: 500 }, // Было 1000000, 100, 1000
                unlocked: false,
                rewardCollected: false
            }
        ];
        
        console.log('[initGameData] Данные игры загружены:', {
            upgrades: this.upgradesTree.length,
            prestigeUpgrades: this.prestigeUpgradesTree.length,
            shopItems: this.shopItems.length,
            achievements: this.achievements.length
        });
    }
    
    // ===== СИСТЕМА ПОЛЬЗОВАТЕЛЕЙ =====
    
    showLoginScreen() {
        console.log('[showLoginScreen] Показ экрана входа...');
        
        const gameContainer = document.querySelector('.game-container');
        if (!gameContainer) {
            console.error('[showLoginScreen] Игровой контейнер не найден!');
            return;
        }
        
        // Проверяем, не существует ли уже экран входа
        if (document.querySelector('.login-container')) {
            console.log('[showLoginScreen] Экран входа уже существует');
            return;
        }
        
        // Создаем экран входа с анимациями
        const loginHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h1><i class="fas fa-rocket"></i> Космический майнер</h1>
                        <p>Начните свою космическую карьеру!</p>
                    </div>
                    
                    <div class="login-animation">
                        <div class="login-space-animation">
                            <div class="stars"></div>
                            <div class="stars stars-2"></div>
                            <div class="planet-animation"></div>
                            <div class="rocket-animation">
                                <i class="fas fa-rocket"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="login-tabs">
                        <button class="login-tab active" id="login-tab">Вход</button>
                        <button class="login-tab" id="register-tab">Регистрация</button>
                    </div>
                    
                    <div class="login-forms">
                        <div class="login-form active" id="login-form">
                            <div class="form-info">
                                <i class="fas fa-info-circle"></i>
                                <span>Введите имя пользователя и пароль для входа в игру</span>
                            </div>
                            <div class="form-group">
                                <label for="login-username">
                                    <i class="fas fa-user"></i> Имя пользователя
                                    <span class="hint">(от 3 символов)</span>
                                </label>
                                <input type="text" id="login-username" placeholder="Введите имя пользователя" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label for="login-password">
                                    <i class="fas fa-lock"></i> Пароль
                                    <span class="hint">(от 4 символов)</span>
                                </label>
                                <input type="password" id="login-password" placeholder="Введите пароль" maxlength="30">
                            </div>
                            <button class="login-btn" id="login-btn">
                                <i class="fas fa-sign-in-alt"></i> Войти
                            </button>
                        </div>
                        
                        <div class="login-form" id="register-form">
                            <div class="form-info">
                                <i class="fas fa-info-circle"></i>
                                <span>Создайте нового пользователя для начала игры</span>
                            </div>
                            <div class="form-group">
                                <label for="register-username">
                                    <i class="fas fa-user"></i> Имя пользователя
                                    <span class="hint">(3-20 символов, только буквы, цифры и _)</span>
                                </label>
                                <input type="text" id="register-username" placeholder="Придумайте имя пользователя" maxlength="20">
                            </div>
                            <div class="form-group">
                                <label for="register-password">
                                    <i class="fas fa-lock"></i> Пароль
                                    <span class="hint">(минимум 4 символа)</span>
                                </label>
                                <input type="password" id="register-password" placeholder="Придумайте пароль" maxlength="30">
                            </div>
                            <div class="form-group">
                                <label for="register-confirm">
                                    <i class="fas fa-lock"></i> Подтверждение пароля
                                    <span class="hint">(должен совпадать с паролем)</span>
                                </label>
                                <input type="password" id="register-confirm" placeholder="Повторите пароль" maxlength="30">
                            </div>
                            <button class="login-btn" id="register-btn">
                                <i class="fas fa-user-plus"></i> Зарегистрироваться
                            </button>
                        </div>
                    </div>
                    
                    <div class="login-footer">
                        <p>Игра автоматически сохраняется каждые 30 секунд</p>
                        <div class="users-list-toggle">
                            <button id="toggle-users-btn">
                                <i class="fas fa-users"></i>
                                <span>Показать сохраненных пользователей (${this.getAllUsers().length})</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="users-list-container">
                            <div class="users-list" id="users-list">
                                <!-- Список пользователей будет здесь -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем HTML
        document.body.insertAdjacentHTML('afterbegin', loginHTML);
        
        // Скрываем игровой интерфейс
        gameContainer.style.display = 'none';
        
        console.log('[showLoginScreen] HTML добавлен, скрыт игровой интерфейс');
        
        // Добавляем стили для анимаций
        this.addLoginAnimationStyles();
        
        // Ждем пока DOM обновится
        setTimeout(() => {
            console.log('[showLoginScreen] Настройка обработчиков...');
            this.setupLoginHandlers();
            this.loadUsersList();
            this.startLoginAnimation();
        }, 100);
    }
    
    addLoginAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .login-animation {
                height: 150px;
                margin: 20px 0;
                position: relative;
                overflow: hidden;
                border-radius: 15px;
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid rgba(0, 212, 255, 0.3);
            }
            
            .login-space-animation {
                width: 100%;
                height: 100%;
                position: relative;
            }
            
            .stars {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: transparent;
            }
            
            .stars::before,
            .stars::after {
                content: '';
                position: absolute;
                width: 2px;
                height: 2px;
                background: white;
                border-radius: 50%;
                animation: twinkle 3s infinite;
            }
            
            .stars-2::before,
            .stars-2::after {
                width: 1px;
                height: 1px;
                animation-delay: 1.5s;
            }
            
            @keyframes twinkle {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
            
            .planet-animation {
                position: absolute;
                top: 50%;
                left: 20%;
                width: 60px;
                height: 60px;
                background: radial-gradient(circle at 30% 30%, #ff9500, #ff3e00, #9d4edd);
                border-radius: 50%;
                transform: translateY(-50%);
                box-shadow: 
                    inset 0 0 20px rgba(0, 0, 0, 0.9),
                    0 0 30px rgba(255, 62, 0, 0.8);
                animation: planetRotate 20s infinite linear;
            }
            
            @keyframes planetRotate {
                from { transform: translateY(-50%) rotate(0deg); }
                to { transform: translateY(-50%) rotate(360deg); }
            }
            
            .rocket-animation {
                position: absolute;
                top: 50%;
                right: -50px;
                transform: translateY(-50%);
                font-size: 2em;
                color: var(--neon-blue);
                animation: rocketFly 15s infinite linear;
            }
            
            .rocket-animation i {
                filter: drop-shadow(0 0 10px currentColor);
            }
            
            @keyframes rocketFly {
                0% { right: -50px; transform: translateY(-50%) rotate(0deg); }
                25% { transform: translateY(-30%) rotate(10deg); }
                50% { transform: translateY(-50%) rotate(0deg); }
                75% { transform: translateY(-70%) rotate(-10deg); }
                100% { right: 100%; transform: translateY(-50%) rotate(0deg); }
            }
            
            .key-lock-animation {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10001;
                display: none;
            }
            
            .key-lock-animation.show {
                display: block;
                animation: unlockAnimation 2s ease forwards;
            }
            
            .key-lock-container {
                position: relative;
                width: 200px;
                height: 200px;
            }
            
            .lock {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 4em;
                color: var(--neon-blue);
                z-index: 2;
            }
            
            .key {
                position: absolute;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
                font-size: 3em;
                color: var(--energy-yellow);
                z-index: 1;
                animation: keyMove 2s ease-in-out forwards;
            }
            
            @keyframes keyMove {
                0% { left: 0; transform: translateY(-50%) rotate(0deg); }
                50% { left: 50%; transform: translateY(-50%) translateX(-50%) rotate(90deg); }
                100% { left: 100%; transform: translateY(-50%) rotate(180deg); opacity: 0; }
            }
            
            @keyframes unlockAnimation {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
            }
            
            .planet-change-animation {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10001;
                display: none;
            }
            
            .planet-change-animation.show {
                display: block;
                animation: planetChangeAnimation 3s ease forwards;
            }
            
            .old-planet {
                position: absolute;
                top: 50%;
                left: 30%;
                transform: translate(-50%, -50%);
                width: 100px;
                height: 100px;
                background: radial-gradient(circle at 30% 30%, #ff9500, #ff3e00, #9d4edd);
                border-radius: 50%;
                animation: launchOldPlanet 3s ease forwards;
            }
            
            .new-planet {
                position: absolute;
                top: 50%;
                left: 70%;
                transform: translate(-50%, -50%) scale(0);
                width: 100px;
                height: 100px;
                background: radial-gradient(circle at 30% 30%, #00d4ff, #9d4edd, #ff00ff);
                border-radius: 50%;
                animation: arriveNewPlanet 3s ease forwards 1.5s;
            }
            
            .traveling-star {
                position: absolute;
                top: 50%;
                left: 30%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                background: var(--energy-yellow);
                border-radius: 50%;
                filter: blur(5px);
                box-shadow: 0 0 20px var(--energy-yellow);
                animation: travelToNewPlanet 3s ease-in-out forwards 0.5s;
            }
            
            @keyframes launchOldPlanet {
                0% { transform: translate(-50%, -50%) scale(1); }
                30% { transform: translate(-50%, -50%) scale(1.2); }
                50% { transform: translate(-50%, -50%) scale(0.8); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            }
            
            @keyframes travelToNewPlanet {
                0% { left: 30%; opacity: 1; }
                100% { left: 70%; opacity: 0; }
            }
            
            @keyframes arriveNewPlanet {
                0% { transform: translate(-50%, -50%) scale(0); }
                50% { transform: translate(-50%, -50%) scale(1.2); }
                100% { transform: translate(-50%, -50%) scale(1); }
            }
            
            @keyframes planetChangeAnimation {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
            }
            
            /* Стили для активных бустов магазина */
            .active-boosts-section {
                background: rgba(26, 31, 56, 0.95);
                border-radius: 20px;
                padding: 20px;
                margin-top: 20px;
                border: 2px solid rgba(0, 212, 255, 0.4);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
            }
            
            .active-boosts-section h3 {
                font-family: 'Orbitron', sans-serif;
                color: var(--neon-blue);
                margin-bottom: 15px;
                font-size: 1.3em;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .active-boosts-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
            }
            
            .active-boost-item {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 212, 255, 0.1));
                border-radius: 15px;
                padding: 15px;
                border: 2px solid;
                display: flex;
                align-items: center;
                gap: 15px;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
            }
            
            .active-boost-item:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(0, 212, 255, 0.3);
            }
            
            .active-boost-icon {
                font-size: 2em;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .active-boost-info {
                flex: 1;
                min-width: 0;
            }
            
            .active-boost-name {
                font-weight: 600;
                color: var(--text-light);
                margin-bottom: 5px;
                font-family: 'Exo 2', sans-serif;
            }
            
            .active-boost-duration {
                font-size: 0.9em;
                color: var(--text-dim);
                font-family: 'Orbitron', monospace;
            }
            
            .active-boost-timer {
                margin-top: 8px;
                height: 8px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            }
            
            .active-boost-progress {
                height: 100%;
                background: linear-gradient(90deg, var(--mineral-green), var(--neon-blue));
                border-radius: 4px;
                transition: width 0.3s;
            }
            
            .active-boost-multiplier {
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                color: var(--energy-yellow);
                font-size: 1.1em;
                min-width: 50px;
                text-align: right;
            }
            
            /* Стили для кнопки "Забрать награду" в достижениях */
            .achievement-reward {
                margin-top: 10px;
                padding: 10px;
                background: rgba(0, 212, 255, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(0, 212, 255, 0.3);
            }
            
            .reward-info {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                color: var(--text-light);
                font-size: 0.9em;
            }
            
            .claim-reward-btn {
                width: 100%;
                padding: 8px;
                background: linear-gradient(135deg, var(--neon-blue), var(--neon-purple));
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-family: 'Exo 2', sans-serif;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 5px;
            }
            
            .claim-reward-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0, 212, 255, 0.4);
            }
            
            .claim-reward-btn:disabled {
                background: #555;
                cursor: not-allowed;
                opacity: 0.7;
            }
            
            .reward-collected {
                text-align: center;
                color: var(--mineral-green);
                font-weight: 600;
                padding: 8px;
                background: rgba(0, 255, 157, 0.1);
                border-radius: 6px;
                border: 1px solid var(--mineral-green);
            }
            
            /* Улучшенные шрифты для улучшений */
            .upgrade-name {
                font-family: 'Orbitron', sans-serif;
                font-size: 1.1em;
                color: var(--text-light);
                margin-bottom: 8px;
                text-align: center;
                font-weight: 700;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
                letter-spacing: 0.5px;
            }
            
            .upgrade-description {
                font-size: 0.9em;
                color: var(--text-dim);
                margin-bottom: 10px;
                line-height: 1.4;
                text-align: center;
                font-family: 'Exo 2', sans-serif;
            }
            
            .tree-stat {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9em;
                color: var(--text-light);
                font-family: 'Exo 2', sans-serif;
                font-weight: 600;
            }
            
            .stat-box .stat-label {
                font-family: 'Exo 2', sans-serif;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            
            .stat-box .stat-value {
                font-family: 'Orbitron', monospace;
                font-weight: 700;
                letter-spacing: 1px;
            }
            
            /* Меньшая кнопка добычи ресурсов */
            .click-button {
                min-width: 250px !important;
                padding: 20px 30px !important;
                font-size: 1.1em !important;
            }
            
            .click-text {
                font-size: 1em !important;
                letter-spacing: 0.5px !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    startLoginAnimation() {
        // Создаем звезды для фона
        const stars = document.querySelectorAll('.stars');
        stars.forEach(starContainer => {
            for (let i = 0; i < 50; i++) {
                const star = document.createElement('div');
                star.style.position = 'absolute';
                star.style.width = Math.random() * 2 + 'px';
                star.style.height = star.style.width;
                star.style.background = 'white';
                star.style.borderRadius = '50%';
                star.style.top = Math.random() * 100 + '%';
                star.style.left = Math.random() * 100 + '%';
                star.style.opacity = Math.random() * 0.5 + 0.3;
                star.style.animation = `twinkle ${Math.random() * 2 + 2}s infinite`;
                star.style.animationDelay = Math.random() * 2 + 's';
                starContainer.appendChild(star);
            }
        });
    }
    
    playUnlockAnimation() {
        const animationHTML = `
            <div class="key-lock-animation show">
                <div class="key-lock-container">
                    <div class="lock">
                        <i class="fas fa-lock"></i>
                    </div>
                    <div class="key">
                        <i class="fas fa-key"></i>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', animationHTML);
        
        // Удаляем анимацию через 2 секунды
        setTimeout(() => {
            const animation = document.querySelector('.key-lock-animation');
            if (animation) {
                animation.remove();
            }
        }, 2000);
    }
    
    playPrestigePlanetChangeAnimation(oldTheme, newTheme) {
        // Проверяем, что темы определены, иначе используем тему по умолчанию
        let safeOldTheme = oldTheme || this.planetThemes.default;
        let safeNewTheme = newTheme || this.planetThemes.default;
        
        // Проверяем, что темы содержат необходимые свойства
        if (!safeOldTheme.color1 || !safeOldTheme.color2 || !safeOldTheme.color3) {
            safeOldTheme = this.planetThemes.default;
        }
        if (!safeNewTheme.color1 || !safeNewTheme.color2 || !safeNewTheme.color3) {
            safeNewTheme = this.planetThemes.default;
        }
        
        const animationHTML = `
            <div class="planet-change-animation show">
                <div class="old-planet" style="background: radial-gradient(circle at 30% 30%, ${safeOldTheme.color1}, ${safeOldTheme.color2}, ${safeOldTheme.color3})"></div>
                <div class="traveling-star"></div>
                <div class="new-planet" style="background: radial-gradient(circle at 30% 30%, ${safeNewTheme.color1}, ${safeNewTheme.color2}, ${safeNewTheme.color3})"></div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', animationHTML);
        
        // Удаляем анимацию через 3 секунды
        setTimeout(() => {
            const animation = document.querySelector('.planet-change-animation');
            if (animation) {
                animation.remove();
            }
        }, 3000);
    }
    
    setupLoginHandlers() {
        console.log('[setupLoginHandlers] Настройка обработчиков входа...');
        
        // Переключение между вкладками
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        
        if (!loginTab) {
            console.error('[setupLoginHandlers] Элемент login-tab не найден!');
            return;
        }
        
        if (!registerTab) {
            console.error('[setupLoginHandlers] Элемент register-tab не найден!');
            return;
        }
        
        console.log('[setupLoginHandlers] Найдены элементы вкладок');
        
        loginTab.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('[setupLoginHandlers] Клик по вкладке входа');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (loginForm) {
                console.log('[setupLoginHandlers] Активация формы входа');
                loginForm.classList.add('active');
            }
            if (registerForm) {
                registerForm.classList.remove('active');
            }
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
        });
        
        registerTab.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('[setupLoginHandlers] Клик по вкладке регистрации');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (registerForm) {
                console.log('[setupLoginHandlers] Активация формы регистрации');
                registerForm.classList.add('active');
            }
            if (loginForm) {
                loginForm.classList.remove('active');
            }
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
        });
        
        // Кнопка входа
        const loginButton = document.getElementById('login-btn');
        if (!loginButton) {
            console.error('[setupLoginHandlers] Кнопка входа не найдена!');
            return;
        }
        
        console.log('[setupLoginHandlers] Найдена кнопка входа, добавление обработчика');
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('[setupLoginHandlers] Клик по кнопке входа');
            this.login();
        });
        
        // Кнопка регистрации
        const registerButton = document.getElementById('register-btn');
        if (!registerButton) {
            console.error('[setupLoginHandlers] Кнопка регистрации не найдена!');
            return;
        }
        
        console.log('[setupLoginHandlers] Найдена кнопка регистрации, добавление обработчика');
        registerButton.addEventListener('click', (event) => {
            event.preventDefault();
            console.log('[setupLoginHandlers] Клик по кнопке регистрации');
            this.register();
        });
        
        // Кнопка показа/скрытия списка пользователей
        const toggleUsersBtn = document.getElementById('toggle-users-btn');
        if (toggleUsersBtn) {
            toggleUsersBtn.addEventListener('click', () => {
                const usersListContainer = document.querySelector('.users-list-container');
                const usersList = document.getElementById('users-list');
                if (usersListContainer && usersList) {
                    if (usersListContainer.classList.contains('expanded')) {
                        usersListContainer.classList.remove('expanded');
                        toggleUsersBtn.innerHTML = `
                            <i class="fas fa-users"></i>
                            <span>Показать сохраненных пользователей (${this.getAllUsers().length})</span>
                            <i class="fas fa-chevron-down"></i>
                        `;
                    } else {
                        usersListContainer.classList.add('expanded');
                        toggleUsersBtn.innerHTML = `
                            <i class="fas fa-users"></i>
                            <span>Скрыть сохраненных пользователей (${this.getAllUsers().length})</span>
                            <i class="fas fa-chevron-up"></i>
                        `;
                    }
                }
            });
        }
        
        // Ввод по Enter в форме входа
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');
        
        if (loginUsername) {
            loginUsername.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    console.log('[setupLoginHandlers] Enter в поле логина');
                    this.login();
                }
            });
        }
        
        if (loginPassword) {
            loginPassword.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    console.log('[setupLoginHandlers] Enter в поле пароля');
                    this.login();
                }
            });
        }
        
        // Ввод по Enter в форме регистрации
        const registerUsername = document.getElementById('register-username');
        const registerPassword = document.getElementById('register-password');
        const registerConfirm = document.getElementById('register-confirm');
        
        if (registerUsername) {
            registerUsername.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    console.log('[setupLoginHandlers] Enter в поле имени при регистрации');
                    document.getElementById('register-password')?.focus();
                }
            });
        }
        
        if (registerPassword) {
            registerPassword.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    console.log('[setupLoginHandlers] Enter в поле пароля при регистрации');
                    document.getElementById('register-confirm')?.focus();
                }
            });
        }
        
        if (registerConfirm) {
            registerConfirm.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    console.log('[setupLoginHandlers] Enter в поле подтверждения пароля');
                    this.register();
                }
            });
        }
        
        console.log('[setupLoginHandlers] Обработчики входа настроены');
    }
    
    loadUsersList() {
        console.log('[loadUsersList] Загрузка списка пользователей...');
        const usersListElement = document.getElementById('users-list');
        if (!usersListElement) {
            console.error('[loadUsersList] Элемент users-list не найден');
            return;
        }
        
        const users = this.getAllUsers();
        console.log('[loadUsersList] Найдено пользователей:', users.length);
        
        if (users.length === 0) {
            usersListElement.innerHTML = '<p class="no-users">Нет сохраненных пользователей</p>';
            console.log('[loadUsersList] Нет пользователей, показано сообщение');
            return;
        }
        
        let html = '<h3><i class="fas fa-users"></i> Сохраненные пользователи:</h3>';
        html += '<p class="users-list-info">Нажмите на пользователя для быстрого заполнения формы входа</p>';
        
        users.forEach(user => {
            const lastPlayed = new Date(user.lastPlayed).toLocaleDateString('ru-RU');
            const playTime = user.playTime || 0;
            const totalPlayTime = this.formatPlayTime(playTime);
            
            html += `
                <div class="user-item" data-username="${user.username}">
                    <div class="user-avatar">
                        <i class="fas fa-user-astronaut"></i>
                    </div>
                    <div class="user-info">
                        <div class="user-name">${user.username}</div>
                        <div class="user-stats">
                            <span><i class="fas fa-coins"></i> ${this.formatNumber(user.credits || 0)}</span>
                            <span><i class="fas fa-star"></i> ${user.prestige || 0}</span>
                            <span><i class="fas fa-clock"></i> ${totalPlayTime}</span>
                        </div>
                        <div class="user-date">Последний вход: ${lastPlayed}</div>
                    </div>
                </div>
            `;
        });
        
        usersListElement.innerHTML = html;
        console.log('[loadUsersList] HTML списка пользователей установлен');
        
        // Добавляем обработчики для пользователей
        document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const username = item.getAttribute('data-username');
                if (username) {
                    console.log('[loadUsersList] Быстрый вход для пользователя:', username);
                    this.quickLogin(username);
                }
            });
        });
        
        console.log('[loadUsersList] Список пользователей загружен');
    }
    
    formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else {
            return `${minutes}м`;
        }
    }
    
    getAllUsers() {
        console.log('[getAllUsers] Получение всех пользователей из localStorage...');
        const users = [];
        
        // Получаем все ключи из localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Проверяем, что это сохранение пользователя
            if (key.startsWith('spaceMinerUser_')) {
                try {
                    const userData = JSON.parse(localStorage.getItem(key));
                    // Проверяем что данные валидны и есть имя пользователя
                    if (userData && userData.username && userData.password) {
                        users.push({
                            username: userData.username,
                            credits: userData.state?.credits || 0,
                            prestige: userData.state?.prestige || 0,
                            lastPlayed: userData.state?.lastPlayed || new Date().toISOString(),
                            createdAt: userData.state?.createdAt || new Date().toISOString(),
                            playTime: userData.state?.playTime || 0,
                            totalClicks: userData.state?.totalClicks || 0,
                            totalEarned: userData.state?.totalEarned || 0
                        });
                        console.log('[getAllUsers] Найден пользователь:', userData.username);
                    } else {
                        // Удаляем поврежденные данные
                        localStorage.removeItem(key);
                        console.log('[getAllUsers] Удален поврежденный файл пользователя:', key);
                    }
                } catch (error) {
                    console.error('[getAllUsers] Ошибка загрузки пользователя:', key, error);
                    // Удаляем поврежденные данные
                    localStorage.removeItem(key);
                }
            }
        }
        
        // Сортируем по дате последнего входа
        const sortedUsers = users.sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed));
        console.log('[getAllUsers] Всего пользователей:', sortedUsers.length);
        return sortedUsers;
    }
    
    quickLogin(username) {
        console.log('[quickLogin] Быстрый вход для:', username);
        const loginUsernameInput = document.getElementById('login-username');
        const loginPasswordInput = document.getElementById('login-password');
        
        if (loginUsernameInput) {
            loginUsernameInput.value = username;
            console.log('[quickLogin] Установлено имя пользователя:', username);
        }
        if (loginPasswordInput) {
            loginPasswordInput.value = '';
            loginPasswordInput.focus();
            console.log('[quickLogin] Пароль очищен, фокус установлен');
        }
        
        // Переключаемся на вкладку входа
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginTab && registerTab && loginForm && registerForm) {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            console.log('[quickLogin] Переключено на вкладку входа');
        }
        
        this.showNotification(`Введите пароль для пользователя ${username}`, 'info');
    }
    
    login() {
        console.log('[login] Начало процедуры входа');
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        
        if (!usernameInput || !passwordInput) {
            console.error('[login] Не найдены поля ввода');
            this.showNotification('Ошибка формы входа!', 'error');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        
        console.log('[login] Введенные данные:', { username, passwordLength: password.length });
        
        // Валидация ввода
        if (!username) {
            console.log('[login] Имя пользователя пустое');
            this.showNotification('Введите имя пользователя!', 'warning');
            usernameInput.focus();
            return;
        }
        
        if (!password) {
            console.log('[login] Пароль пустой');
            this.showNotification('Введите пароль!', 'warning');
            passwordInput.focus();
            return;
        }
        
        if (username.length < 3) {
            console.log('[login] Имя пользователя слишком короткое:', username.length);
            this.showNotification('Имя пользователя должно быть не менее 3 символов', 'warning');
            usernameInput.focus();
            return;
        }
        
        const userKey = `spaceMinerUser_${username}`;
        console.log('[login] Ключ пользователя:', userKey);
        
        const userData = localStorage.getItem(userKey);
        
        if (!userData) {
            console.log('[login] Пользователь не найден в localStorage');
            this.showNotification('Пользователь не найден!', 'error');
            usernameInput.focus();
            return;
        }
        
        console.log('[login] Данные пользователя найдены в localStorage');
        
        try {
            const data = JSON.parse(userData);
            console.log('[login] Данные парсера:', { 
                hasPassword: !!data.password, 
                dataKeys: Object.keys(data) 
            });
            
            // Простая проверка пароля
            if (data.password !== password) {
                console.log('[login] Неверный пароль. Введен:', password, 'Ожидался:', data.password);
                this.showNotification('Неверный пароль!', 'error');
                passwordInput.focus();
                passwordInput.select();
                return;
            }
            
            console.log('[login] Пароль верный');
            
            // Устанавливаем текущего пользователя
            this.currentUser = username;
            console.log('[login] Установлен текущий пользователь:', this.currentUser);
            
            // Загружаем игру пользователя
            this.loadGame();
            
            // Скрываем экран входа и показываем игру
            this.hideLoginScreen();
            
            // Проигрываем анимацию разблокировки
            this.playUnlockAnimation();
            
            this.showNotification(`Добро пожаловать, ${username}!`, 'success');
            console.log('[login] Вход успешно завершен');
            
        } catch (error) {
            console.error('[login] Ошибка входа:', error);
            this.showNotification('Ошибка входа! Файл сохранения поврежден', 'error');
        }
    }
    
    register() {
        console.log('[register] Начало процедуры регистрации');
        const usernameInput = document.getElementById('register-username');
        const passwordInput = document.getElementById('register-password');
        const confirmInput = document.getElementById('register-confirm');
        
        if (!usernameInput || !passwordInput || !confirmInput) {
            console.error('[register] Не найдены поля регистрации');
            this.showNotification('Ошибка формы регистрации!', 'error');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const confirm = confirmInput.value.trim();
        
        console.log('[register] Введенные данные:', { 
            username, 
            passwordLength: password.length, 
            confirmLength: confirm.length 
        });
        
        // Валидация ввода
        if (!username) {
            console.log('[register] Имя пользователя пустое');
            this.showNotification('Введите имя пользователя!', 'warning');
            usernameInput.focus();
            return;
        }
        
        if (!password) {
            console.log('[register] Пароль пустой');
            this.showNotification('Введите пароль!', 'warning');
            passwordInput.focus();
            return;
        }
        
        if (!confirm) {
            console.log('[register] Подтверждение пароля пустое');
            this.showNotification('Подтвердите пароль!', 'warning');
            confirmInput.focus();
            return;
        }
        
        if (username.length < 3) {
            console.log('[register] Имя пользователя слишком короткое:', username.length);
            this.showNotification('Имя пользователя должно быть не менее 3 символов', 'warning');
            usernameInput.focus();
            return;
        }
        
        if (password.length < 4) {
            console.log('[register] Пароль слишком короткий:', password.length);
            this.showNotification('Пароль должен быть не менее 4 символов', 'warning');
            passwordInput.focus();
            return;
        }
        
        if (password !== confirm) {
            console.log('[register] Пароли не совпадают');
            this.showNotification('Пароли не совпадают!', 'error');
            passwordInput.focus();
            passwordInput.select();
            return;
        }
        
        // Проверка на специальные символы в имени пользователя
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            console.log('[register] Неверный формат имени пользователя:', username);
            this.showNotification('Имя пользователя может содержать только буквы, цифры и символ подчеркивания', 'warning');
            usernameInput.focus();
            return;
        }
        
        const userKey = `spaceMinerUser_${username}`;
        console.log('[register] Проверка существования пользователя:', userKey);
        
        if (localStorage.getItem(userKey)) {
            console.log('[register] Пользователь уже существует');
            this.showNotification('Пользователь уже существует!', 'error');
            usernameInput.focus();
            return;
        }
        
        console.log('[register] Создание нового пользователя');
        
        // Создаем новое состояние игры
        const initialState = this.getInitialState();
        
        // Инициализируем данные игры
        this.initGameData();
        
        // Создаем нового пользователя
        const userData = {
            username: username,
            password: password,
            createdAt: new Date().toISOString(),
            state: initialState,
            achievements: this.achievements,
            upgradesTree: this.upgradesTree,
            prestigeUpgradesTree: this.prestigeUpgradesTree,
            shopItems: this.shopItems
        };
        
        console.log('[register] Данные пользователя для сохранения:', {
            username: userData.username,
            hasPassword: !!userData.password,
            hasState: !!userData.state
        });
        
        // Сохраняем пользователя
        localStorage.setItem(userKey, JSON.stringify(userData));
        console.log('[register] Пользователь сохранен в localStorage');
        
        this.showNotification(`Регистрация успешна! Теперь войдите в игру.`, 'success');
        
        // Переключаемся на вкладку входа
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (loginTab && registerTab && loginForm && registerForm) {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            console.log('[register] Переключено на вкладку входа');
        }
        
        // Заполняем поле логина
        const loginUsernameInput = document.getElementById('login-username');
        if (loginUsernameInput) {
            loginUsernameInput.value = username;
            loginUsernameInput.focus();
            console.log('[register] Поле логина заполнено:', username);
        }
        
        // Очищаем поля регистрации
        usernameInput.value = '';
        passwordInput.value = '';
        confirmInput.value = '';
        console.log('[register] Поля регистрации очищены');
        
        // Обновляем список пользователей
        this.loadUsersList();
        
        console.log('[register] Регистрация завершена успешно');
    }
    
    hideLoginScreen() {
        console.log('[hideLoginScreen] Скрытие экрана входа...');
        const loginContainer = document.querySelector('.login-container');
        const gameContainer = document.querySelector('.game-container');
        
        if (loginContainer) {
            console.log('[hideLoginScreen] Удаление контейнера входа');
            loginContainer.remove();
        }
        
        if (gameContainer) {
            console.log('[hideLoginScreen] Показ игрового контейнера');
            gameContainer.style.display = 'block';
        }
        
        // Автосохранение каждые 30 секунд
        this.autoSaveInterval = setInterval(() => {
            if (this.currentUser) {
                console.log('[hideLoginScreen] Автосохранение...');
                this.saveGame();
            }
        }, 30000);
        
        console.log('[hideLoginScreen] Даем время DOM для обновления');
        
        // Даем время DOM для обновления
        setTimeout(() => {
            console.log('[hideLoginScreen] Инициализация игрового интерфейса');
            
            // Инициализируем игровой интерфейс
            this.setupEventListeners();
            this.renderAll();
            this.startGameLoop();
            this.startPurchaseCooldownTimer();
            
            // Таймер для отображения времени
            this.updateTimeDisplay();
            setInterval(() => this.updateTimeDisplay(), 1000);
            
            // Таймер для обновления интерфейса магазина
            setInterval(() => {
                this.renderShop();
                this.updatePrestigeButton();
                this.renderActiveBoosts();
            }, 100);
            
            console.log('[hideLoginScreen] Игровой интерфейс инициализирован');
        }, 100);
    }
    
    showPatchNotes() {
        const patchNotesShown = localStorage.getItem('spaceMinerPatchNotesShown');
        const currentVersion = '1.4.0';
        
        if (patchNotesShown !== currentVersion) {
            setTimeout(() => {
                const notesHTML = `
                    <div class="patch-notes-overlay">
                        <div class="patch-notes-modal">
                            <div class="patch-notes-header">
                                <h2><i class="fas fa-code-branch"></i> Обновление ${currentVersion}</h2>
                                <button class="close-patch-notes">&times;</button>
                            </div>
                            <div class="patch-notes-content">
                                <div class="patch-note-item">
                                    <i class="fas fa-plus-circle"></i>
                                    <span><strong>Исправлено:</strong> Достижения сохраняются после престижа и не сбрасываются</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-gem"></i>
                                    <span><strong>Добавлено:</strong> Система клейма (забирания) наград за достижения</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-font"></i>
                                    <span><strong>Улучшено:</strong> Шрифты и типографика во всех разделах игры</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-bolt"></i>
                                    <span><strong>Добавлено:</strong> Раздел активных бустов магазина с таймерами</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-magic"></i>
                                    <span><strong>Новое:</strong> Анимации входа и престижа</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-gamepad"></i>
                                    <span><strong>Изменено:</strong> Размер кнопки добычи ресурсов уменьшен</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-star"></i>
                                    <span><strong>Добавлено:</strong> Новые достижения и улучшенная система наград</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-mobile-alt"></i>
                                    <span><strong>Улучшено:</strong> Интерфейс для мобильных устройств с 3 уровнями адаптивности (560px, 480px, 360px)</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-toggle-on"></i>
                                    <span><strong>Добавлено:</strong> Кнопки скрытия интерфейса для удобства на мобильных устройствах</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-calculator"></i>
                                    <span><strong>Изменено:</strong> Формула престижа (теперь 25000 стартовых кредитов, 1.1x за уровень)</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-tags"></i>
                                    <span><strong>Изменено:</strong> Престижные улучшения стали дешевле (уменьшены множители цен)</span>
                                </div>
                                <div class="patch-note-item">
                                    <i class="fas fa-arrows-alt-v"></i>
                                    <span><strong>Улучшено:</strong> Прокрутка в профиле улучшена для просмотра всех опций</span>
                                </div>
                            </div>
                            <div class="patch-notes-footer">
                                <label>
                                    <input type="checkbox" id="dont-show-again">
                                    Не показывать при следующем запуске
                                </label>
                                <button class="patch-notes-close-btn">Понятно</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', notesHTML);
                
                // Обработчики для закрытия
                document.querySelector('.close-patch-notes').addEventListener('click', () => {
                    this.closePatchNotes();
                });
                
                document.querySelector('.patch-notes-close-btn').addEventListener('click', () => {
                    this.closePatchNotes();
                });
                
                // Сохраняем версию
                const dontShow = document.getElementById('dont-show-again');
                document.querySelector('.patch-notes-close-btn').addEventListener('click', () => {
                    if (dontShow && dontShow.checked) {
                        localStorage.setItem('spaceMinerPatchNotesShown', currentVersion);
                    }
                    this.closePatchNotes();
                });
            }, 1000);
        }
    }
    
    closePatchNotes() {
        const modal = document.querySelector('.patch-notes-overlay');
        if (modal) {
            modal.remove();
        }
        const dontShow = document.getElementById('dont-show-again');
        if (dontShow && dontShow.checked) {
            localStorage.setItem('spaceMinerPatchNotesShown', '1.4.0');
        }
    }

    logout() {
        console.log('[logout] Выход из системы');
        if (this.currentUser) {
            this.saveGame();
            this.showNotification(`До свидания, ${this.currentUser}!`, 'info');
            
            // Очищаем интервалы
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
                console.log('[logout] Интервал автосохранения очищен');
            }
            
            this.currentUser = null;
            this.state = null;
            
            // Показываем экран входа
            this.showLoginScreen();
            
            // Скрываем игровой интерфейс
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.style.display = 'none';
            }
            
            console.log('[logout] Выход завершен');
        }
    }
    
    showProfile() {
        console.log('[showProfile] Показ профиля пользователя');
        
        if (!this.currentUser || !this.state) {
            console.log('[showProfile] Нет пользователя или состояния');
            this.showNotification('Сначала войдите в игру!', 'warning');
            return;
        }
        
        // Закрываем все другие модальные окна
        this.closeAllModals();
        
        // Рассчитываем статистику
        const totalUpgrades = Object.keys(this.state.upgrades || {}).length;
        const unlockedAchievements = this.achievements ? 
            this.achievements.filter(a => a.unlocked).length : 0;
        const totalAchievements = this.achievements ? this.achievements.length : 0;
        const playTimeFormatted = this.formatPlayTime(this.state.playTime || 0);
        const createdAt = new Date(this.state.createdAt || Date.now()).toLocaleDateString('ru-RU');
        const lastPlayed = new Date(this.state.lastPlayed || Date.now()).toLocaleDateString('ru-RU');
        
        // Получаем все пользователей для админки
        const allUsers = this.getAllUsers();
        
        const profileHTML = `
            <div class="profile-modal-overlay">
                <div class="profile-modal">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <i class="fas fa-user-astronaut"></i>
                        </div>
                        <div class="profile-info">
                            <h3>${this.currentUser}</h3>
                            <div class="profile-stats">
                                <div class="profile-stat">
                                    <i class="fas fa-calendar"></i>
                                    <span>Создан: ${createdAt}</span>
                                </div>
                                <div class="profile-stat">
                                    <i class="fas fa-clock"></i>
                                    <span>Время игры: ${playTimeFormatted}</span>
                                </div>
                                <div class="profile-stat">
                                    <i class="fas fa-star"></i>
                                    <span>Престиж: ${this.state.prestige || 0} (x${(this.state.prestigeMultiplier || 1).toFixed(2)})</span>
                                </div>
                                <div class="profile-stat">
                                    <i class="fas fa-history"></i>
                                    <span>Последний вход: ${lastPlayed}</span>
                                </div>
                            </div>
                        </div>
                        <button class="close-profile-modal">&times;</button>
                    </div>
                    
                    <div class="profile-content">
                        <!-- Секция статистики -->
                        <div class="profile-section">
                            <h4><i class="fas fa-chart-bar"></i> Статистика</h4>
                            <div class="profile-stats-grid">
                                <div class="profile-stat-card">
                                    <div class="stat-icon"><i class="fas fa-mouse-pointer"></i></div>
                                    <div class="stat-value">${this.formatNumber(this.state.totalClicks || 0)}</div>
                                    <div class="stat-name">Всего кликов</div>
                                </div>
                                <div class="profile-stat-card">
                                    <div class="stat-icon"><i class="fas fa-coins"></i></div>
                                    <div class="stat-value">${this.formatNumber(this.state.totalEarned || 0)}</div>
                                    <div class="stat-name">Всего заработано</div>
                                </div>
                                <div class="profile-stat-card">
                                    <div class="stat-icon"><i class="fas fa-sitemap"></i></div>
                                    <div class="stat-value">${totalUpgrades}</div>
                                    <div class="stat-name">Улучшений</div>
                                </div>
                                <div class="profile-stat-card">
                                    <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                                    <div class="stat-value">${unlockedAchievements}/${totalAchievements}</div>
                                    <div class="stat-name">Достижений</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Секция ресурсов -->
                        <div class="profile-section">
                            <h4><i class="fas fa-wallet"></i> Текущие ресурсы</h4>
                            <div class="profile-resources">
                                <div class="profile-resource-item">
                                    <i class="fas fa-coins" style="color: var(--energy-yellow);"></i>
                                    <span>Кредиты: <strong>${this.formatNumber(this.state.credits || 0)}</strong></span>
                                </div>
                                <div class="profile-resource-item">
                                    <i class="fas fa-gem" style="color: var(--mineral-green);"></i>
                                    <span>Минералы: <strong>${this.formatNumber(this.state.minerals || 0)}</strong></span>
                                </div>
                                <div class="profile-resource-item">
                                    <i class="fas fa-bolt" style="color: var(--neon-blue);"></i>
                                    <span>Энергия: <strong>${Math.floor(this.state.energy || 0)}/${this.state.maxEnergy || 100}</strong></span>
                                </div>
                                ${(this.state.prestige || 0) > 0 ? `
                                <div class="profile-resource-item">
                                    <i class="fas fa-star" style="color: var(--neon-purple);"></i>
                                    <span>Очки престижа: <strong>${this.state.prestige}</strong></span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Секция характеристик -->
                        <div class="profile-section">
                            <h4><i class="fas fa-chart-line"></i> Характеристики</h4>
                            <div class="profile-characteristics">
                                <div class="characteristic-item">
                                    <i class="fas fa-hammer" style="color: var(--energy-yellow);"></i>
                                    <span>Сила клика: <strong>${this.state.clickPower || 1}</strong></span>
                                </div>
                                <div class="characteristic-item">
                                    <i class="fas fa-robot" style="color: var(--neon-purple);"></i>
                                    <span>Автодоход/сек: <strong>${this.formatNumber(this.state.autoIncome || 0)}</strong></span>
                                </div>
                                <div class="characteristic-item">
                                    <i class="fas fa-battery-full" style="color: var(--neon-blue);"></i>
                                    <span>Макс. энергия: <strong>${this.state.maxEnergy || 100}</strong></span>
                                </div>
                                <div class="characteristic-item">
                                    <i class="fas fa-sync-alt" style="color: var(--mineral-green);"></i>
                                    <span>Регенерация: <strong>${(this.state.energyRegen || 1).toFixed(1)}/сек</strong></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Секция престижа (если есть) -->
                        ${(this.state.prestige || 0) > 0 ? `
                        <div class="profile-section">
                            <h4><i class="fas fa-rocket"></i> Престижные бонусы</h4>
                            <div class="prestige-bonuses-list">
                                <div class="prestige-bonus-item">
                                    <i class="fas fa-chart-line" style="color: #ffd700;"></i>
                                    <span>Множитель дохода: <strong>x${(this.state.prestigeMultiplier || 1).toFixed(2)}</strong></span>
                                </div>
                                ${(this.state.doubleClickChance || 0) > 0 ? `
                                <div class="prestige-bonus-item">
                                    <i class="fas fa-clone" style="color: #00ff9d;"></i>
                                    <span>Шанс двойного клика: <strong>${((this.state.doubleClickChance || 0) * 100).toFixed(1)}%</strong></span>
                                </div>
                                ` : ''}
                                ${(this.state.energySavePercent || 0) > 0 ? `
                                <div class="prestige-bonus-item">
                                    <i class="fas fa-infinity" style="color: #ff00ff;"></i>
                                    <span>Сохранение энергии: <strong>${((this.state.energySavePercent || 0) * 100).toFixed(1)}%</strong></span>
                                </div>
                                ` : ''}
                                <div class="prestige-bonus-item">
                                    <i class="fas fa-sync-alt" style="color: #00d4ff;"></i>
                                    <span>Престижей выполнено: <strong>${this.state.prestige}</strong></span>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <!-- Секция управления -->
                        <div class="profile-section">
                            <h4><i class="fas fa-cog"></i> Управление игрой</h4>
                            <button class="profile-btn" id="change-password-btn">
                                <i class="fas fa-key"></i>
                                <span>Изменить пароль</span>
                            </button>
                            <button class="profile-btn" id="export-save-btn">
                                <i class="fas fa-download"></i>
                                <span>Экспорт сохранения</span>
                            </button>
                            <button class="profile-btn" id="import-save-btn">
                                <i class="fas fa-upload"></i>
                                <span>Импорт сохранения</span>
                            </button>
                        </div>
                        
                        <!-- АДМИН-ПАНЕЛЬ (только для Gihido) -->
                        ${this.currentUser.toLowerCase() === 'gihido' ? `
                        <div class="profile-section admin-panel">
                            <h4><i class="fas fa-crown"></i> Админ-панель</h4>
                            <div class="admin-controls">
                                <div class="admin-row">
                                    <input type="text" id="admin-username" class="admin-input" placeholder="Имя пользователя">
                                    <button class="admin-btn" onclick="window.game.adminSwitchUser(document.getElementById('admin-username').value)">
                                        <i class="fas fa-sign-in-alt"></i> Переключиться
                                    </button>
                                </div>
                                <div class="admin-row">
                                    <input type="number" id="admin-credits" class="admin-input" placeholder="Кредиты">
                                    <button class="admin-btn" onclick="window.game.adminSetResource('credits', document.getElementById('admin-credits').value)">
                                        <i class="fas fa-coins"></i> Установить
                                    </button>
                                </div>
                                <div class="admin-row">
                                    <input type="number" id="admin-minerals" class="admin-input" placeholder="Минералы">
                                    <button class="admin-btn" onclick="window.game.adminSetResource('minerals', document.getElementById('admin-minerals').value)">
                                        <i class="fas fa-gem"></i> Установить
                                    </button>
                                </div>
                                <div class="admin-row">
                                    <input type="number" id="admin-prestige" class="admin-input" placeholder="Престиж">
                                    <button class="admin-btn" onclick="window.game.adminSetResource('prestige', document.getElementById('admin-prestige').value)">
                                        <i class="fas fa-star"></i> Установить
                                    </button>
                                </div>
                                <div class="admin-quick-actions">
                                    <button class="admin-btn" onclick="window.game.adminAddMillion()">
                                        +1,000,000 кредитов
                                    </button>
                                    <button class="admin-btn" onclick="window.game.adminMaxUpgrades()">
                                        Макс. улучшения
                                    </button>
                                    <button class="admin-btn" onclick="window.game.adminUnlockAll()">
                                        Разблокировать всё
                                    </button>
                                    <button class="admin-btn admin-btn-danger" onclick="window.game.adminResetCurrent()">
                                        Сбросить текущего
                                    </button>
                                </div>
                                <div class="admin-users-list">
                                    <h5>Все пользователи (${allUsers.length}):</h5>
                                    <div class="admin-users-scroll">
                                        ${allUsers.map(user => `
                                            <div class="admin-user-item" onclick="document.getElementById('admin-username').value='${user.username}'">
                                                <span class="admin-user-name">${user.username}</span>
                                                <span class="admin-user-stats">
                                                    <i class="fas fa-coins"></i> ${this.formatNumber(user.credits || 0)} |
                                                    <i class="fas fa-star"></i> ${user.prestige || 0}
                                                </span>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="profile-footer">
                        <button class="profile-danger-btn" id="logout-btn">
                            <i class="fas fa-sign-out-alt"></i>
                            Выйти
                        </button>
                        <button class="profile-danger-btn" id="delete-account-btn">
                            <i class="fas fa-trash-alt"></i>
                            Удалить аккаунт
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', profileHTML);
        
        // Обработчики событий
        document.querySelector('.close-profile-modal').addEventListener('click', () => {
            this.closeProfileModal();
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.closeProfileModal();
            this.logout();
        });
        
        document.getElementById('delete-account-btn').addEventListener('click', () => {
            this.closeProfileModal();
            this.showDeleteAccountConfirmation();
        });
        
        document.getElementById('change-password-btn').addEventListener('click', () => {
            this.showChangePasswordModal();
        });
        
        document.getElementById('export-save-btn').addEventListener('click', () => {
            this.exportSave();
        });
        
        document.getElementById('import-save-btn').addEventListener('click', () => {
            this.importSave();
        });
        
        // Закрытие по клику вне модального окна
        document.querySelector('.profile-modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('profile-modal-overlay')) {
                this.closeProfileModal();
            }
        });
        
        // Блокировка клавиши Escape
        this.profileEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeProfileModal();
            }
        };
        document.addEventListener('keydown', this.profileEscapeHandler);
        
        console.log('[showProfile] Профиль показан');
    }
    
    // ===== МЕТОДЫ ДЛЯ ЗАКРЫТИЯ МОДАЛЬНЫХ ОКОН =====
    
    closeAllModals() {
        this.closeProfileModal();
        this.closePrestigeModal();
        this.closeDeleteModal();
        const patchNotes = document.querySelector('.patch-notes-overlay');
        if (patchNotes) {
            patchNotes.remove();
        }
    }
    
    closeDeleteModal() {
        const modal = document.querySelector('.delete-account-modal');
        if (modal) {
            modal.remove();
        }
        
        // Удаляем обработчик Escape
        if (this.deleteEscapeHandler) {
            document.removeEventListener('keydown', this.deleteEscapeHandler);
            this.deleteEscapeHandler = null;
        }
    }
    
    closeProfileModal() {
        const modal = document.querySelector('.profile-modal-overlay');
        if (modal) {
            modal.remove();
        }
        
        // Удаляем обработчик Escape
        if (this.profileEscapeHandler) {
            document.removeEventListener('keydown', this.profileEscapeHandler);
            this.profileEscapeHandler = null;
        }
    }

    showDeleteAccountConfirmation() {
        const deleteModalHTML = `
            <div class="modal-overlay delete-account-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Удаление аккаунта</h3>
                        <button class="close-modal close-delete-modal">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="warning-text">ВНИМАНИЕ: Это действие необратимо!</div>
                        <p>Вы собираетесь удалить свой аккаунт <strong>${this.currentUser}</strong> и все связанные с ним данные:</p>
                        <ul class="delete-list">
                            <li><i class="fas fa-coins"></i> Все кредиты и минералы</li>
                            <li><i class="fas fa-sitemap"></i> Все улучшения</li>
                            <li><i class="fas fa-trophy"></i> Все достижения</li>
                            <li><i class="fas fa-chart-bar"></i> Всю статистику</li>
                            <li><i class="fas fa-star"></i> Все очки престижа</li>
                        </ul>
                        <p>Для подтверждения введите пароль:</p>
                        <input type="password" id="confirm-password-input" class="confirm-input" placeholder="Введите пароль">
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-cancel close-delete-modal">Отмена</button>
                        <button class="modal-btn modal-btn-danger" id="confirm-delete-btn" disabled>УДАЛИТЬ АККАУНТ</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', deleteModalHTML);
        
        // Обработчики событий
        document.querySelector('.close-delete-modal').addEventListener('click', () => {
            this.closeDeleteModal();
        });
        
        const confirmInput = document.getElementById('confirm-password-input');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        
        confirmInput.addEventListener('input', () => {
            confirmBtn.disabled = confirmInput.value.length === 0;
        });
        
        confirmBtn.addEventListener('click', () => {
            const password = confirmInput.value;
            this.deleteAccount(password);
        });
        
        confirmInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                this.deleteAccount(confirmInput.value);
            }
        });
        
        // Закрытие по клику вне модального окна
        document.querySelector('.delete-account-modal .modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeDeleteModal();
            }
        });
        
        // Блокировка клавиши Escape
        this.deleteEscapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDeleteModal();
            }
        };
        document.addEventListener('keydown', this.deleteEscapeHandler);
    }

    deleteAccount(password) {
        console.log('[deleteAccount] Удаление аккаунта');
        
        if (!this.currentUser) {
            this.showNotification('Нет активного пользователя!', 'error');
            this.closeDeleteModal();
            return;
        }
        
        const userKey = `spaceMinerUser_${this.currentUser}`;
        const userData = localStorage.getItem(userKey);
        
        if (!userData) {
            this.showNotification('Аккаунт не найден!', 'error');
            this.closeDeleteModal();
            return;
        }
        
        try {
            const data = JSON.parse(userData);
            
            if (data.password !== password) {
                this.showNotification('Неверный пароль!', 'error');
                return;
            }
            
            // Удаляем аккаунт
            localStorage.removeItem(userKey);
            
            // Удаляем из списка последних пользователей
            const lastUser = localStorage.getItem('spaceMinerLastUser');
            if (lastUser === this.currentUser) {
                localStorage.removeItem('spaceMinerLastUser');
            }
            
            // Закрываем модальные окна
            this.closeDeleteModal();
            this.closeProfileModal();
            
            // Показываем экран входа
            this.currentUser = null;
            this.state = null;
            
            // Очищаем интервалы
            if (this.autoSaveInterval) {
                clearInterval(this.autoSaveInterval);
            }
            
            // Показываем уведомление
            this.showNotification('Аккаунт успешно удален', 'info');
            
            // Перезагружаем игру
            setTimeout(() => {
                this.showLoginScreen();
                const gameContainer = document.querySelector('.game-container');
                if (gameContainer) {
                    gameContainer.style.display = 'none';
                }
            }, 1000);
            
        } catch (error) {
            console.error('[deleteAccount] Ошибка удаления аккаунта:', error);
            this.showNotification('Ошибка при удалении аккаунта', 'error');
        }
    }

    showChangePasswordModal() {
        // Реализация смены пароля
        this.showNotification('Функция смены пароля в разработке', 'info');
    }
    
    exportSave() {
        if (!this.currentUser) return;
        
        const userKey = `spaceMinerUser_${this.currentUser}`;
        const saveData = localStorage.getItem(userKey);
        
        if (!saveData) {
            this.showNotification('Нет данных для экспорта', 'error');
            return;
        }
        
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `space_miner_save_${this.currentUser}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Сохранение экспортировано', 'success');
    }
    
    importSave() {
        this.showNotification('Функция импорта в разработке', 'info');
    }

    // ===== ИГРОВАЯ ЛОГИКА =====
    
    setupEventListeners() {
        console.log('[setupEventListeners] Настройка обработчиков событий...');
        
        // ✅ ИСПРАВЛЕНИЕ: Убираем кнопку клика, оставляем только планету
        const planet = document.getElementById('click-planet');
        const clickButton = document.getElementById('click-button');
        
        // Скрываем кнопку добычи
        if (clickButton) {
            console.log('[setupEventListeners] Скрываем кнопку добычи');
            clickButton.style.display = 'none';
        }
        
        if (planet) {
            console.log('[setupEventListeners] Найдена планета, добавление обработчиков');
            planet.addEventListener('click', () => this.click());
            // Добавляем поддержку тач-событий для мобильных устройств
            planet.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Предотвращаем стандартное поведение
                this.click();
            });
            
            // ✅ Создаем контейнер для планеты и левой панели
            const planetContainer = document.querySelector('.planet-container');
            if (!planetContainer) {
                // Если контейнера нет, создаем его
                const planetHTML = `
                    <div class="planet-container">
                        <div class="planet-left-panel">
                            <div class="click-power-display">
                                <i class="fas fa-hammer"></i>
                                <span id="left-click-power">${this.state.clickPower || 1}</span>
                            </div>
                            <div class="left-panel-stats">
                                <div class="left-stat-item" id="left-double-chance">
                                    <i class="fas fa-clone"></i>
                                    <span>${((this.state.doubleClickChance || 0) * 100).toFixed(1)}%</span>
                                </div>
                                <div class="left-stat-item" id="left-auto-income">
                                    <i class="fas fa-robot"></i>
                                    <span>${this.state.autoIncome || 0}</span>
                                </div>
                                <div class="left-stat-item" id="left-energy-regen">
                                    <i class="fas fa-bolt"></i>
                                    <span>${(this.state.energyRegen || 1).toFixed(1)}</span>
                                </div>
                            </div>
                            <div class="left-boosts-title">Активные бусты:</div>
                            <div id="left-active-boosts">
                                <div class="no-boosts">Нет активных бустов</div>
                            </div>
                        </div>
                        <div class="planet" id="click-planet">
                            <div class="planet-core"></div>
                            <div class="planet-rings">
                                <div class="ring"></div>
                                <div class="ring"></div>
                                <div class="ring"></div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Заменяем планету на контейнер
                planet.outerHTML = planetHTML;
            } else {
                // Если контейнер есть, добавляем левую панель
                const leftPanelHTML = `
                    <div class="planet-left-panel">
                        <div class="click-power-display">
                            <i class="fas fa-hammer"></i>
                            <span id="left-click-power">${this.state.clickPower || 1}</span>
                        </div>
                        <div class="left-panel-stats">
                            <div class="left-stat-item" id="left-double-chance">
                                <i class="fas fa-clone"></i>
                                <span>${((this.state.doubleClickChance || 0) * 100).toFixed(1)}%</span>
                            </div>
                            <div class="left-stat-item" id="left-auto-income">
                                <i class="fas fa-robot"></i>
                                <span>${this.state.autoIncome || 0}</span>
                            </div>
                            <div class="left-stat-item" id="left-energy-regen">
                                <i class="fas fa-bolt"></i>
                                <span>${(this.state.energyRegen || 1).toFixed(1)}</span>
                            </div>
                        </div>
                        <div class="left-boosts-title">Активные бусты:</div>
                        <div id="left-active-boosts">
                            <div class="no-boosts">Нет активных бустов</div>
                        </div>
                    </div>
                `;
                
                // Удаляем старую панель если есть
                const oldPanel = planetContainer.querySelector('.planet-left-panel');
                if (oldPanel) oldPanel.remove();
                
                // Добавляем новую панель
                planetContainer.insertAdjacentHTML('afterbegin', leftPanelHTML);
            }
        } else {
            console.error('[setupEventListeners] Планета не найдена!');
        }
        
        // Навигация
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.addEventListener('click', () => {
                const section = button.getAttribute('data-section');
                console.log('[setupEventListeners] Переключение секции:', section);
                this.switchSection(section);
                
                // Добавляем кнопку админки для пользователя Gihido
                if (this.currentUser && this.currentUser.toLowerCase() === 'gihido' && !document.getElementById('admin-nav-btn')) {
                    this.addAdminNavButton();
                }
            });
        });
        
        // Кнопка престижа
        const prestigeButton = document.getElementById('prestige-button');
        if (prestigeButton) {
            console.log('[setupEventListeners] Найдена кнопка престижа, добавление обработчика');
            prestigeButton.addEventListener('click', () => {
                this.prestige();
            });
        }
        
        // Управление игрой
        const saveButton = document.getElementById('save-btn');
        const loadButton = document.getElementById('load-btn');
        const resetButton = document.getElementById('reset-btn');
        
        if (saveButton) {
            console.log('[setupEventListeners] Найдена кнопка сохранения, добавление обработчика');
            saveButton.addEventListener('click', () => {
                this.saveGame();
                this.showNotification('Игра сохранена!', 'success');
            });
        }
        
        if (loadButton) {
            console.log('[setupEventListeners] Найдена кнопка загрузки, добавление обработчика');
            loadButton.addEventListener('click', () => {
                this.loadGame();
                this.renderAll();
                this.showNotification('Игра загружена!', 'success');
            });
        }
        
        if (resetButton) {
            console.log('[setupEventListeners] Найдена кнопка сброса, добавление обработчика');
            resetButton.addEventListener('click', () => {
                if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
                    this.resetGame();
                    this.showNotification('Игра сброшена', 'info');
                }
            });
        }
        
        // Кнопка профиля
        let profileButton = document.getElementById('profile-btn');
        if (!profileButton) {
            console.log('[setupEventListeners] Создание кнопки профиля');
            // Создаем кнопку профиля
            const navPanel = document.querySelector('.nav-panel');
            if (navPanel) {
                profileButton = document.createElement('button');
                profileButton.className = 'nav-btn';
                profileButton.id = 'profile-btn';
                profileButton.innerHTML = `
                    <i class="fas fa-user-circle"></i>
                    <span>Профиль</span>
                `;
                profileButton.addEventListener('click', () => this.showProfile());
                navPanel.appendChild(profileButton);
            }
        } else {
            console.log('[setupEventListeners] Найдена кнопка профиля, добавление обработчика');
            profileButton.addEventListener('click', () => this.showProfile());
        }
        
        // Управление деревом улучшений
        this.setupTreeControls();
        
        // ✅ Добавляем кнопку админки если пользователь Gihido
        if (this.currentUser && this.currentUser.toLowerCase() === 'gihido') {
            this.addAdminNavButton();
        }
        
        // Добавляем функциональность для кнопок скрытия интерфейса
        this.setupGuiToggleButtons();

        console.log('[setupEventListeners] Обработчики событий настроены');
    }
    
    setupGuiToggleButtons() {
        // Кнопка скрытия/показа интерфейса
        const toggleGuiBtn = document.querySelector('.toggle-gui-btn');
        if (toggleGuiBtn) {
            toggleGuiBtn.addEventListener('click', () => {
                document.body.classList.toggle('gui-hidden');
                
                // Меняем иконку кнопки
                if (document.body.classList.contains('gui-hidden')) {
                    toggleGuiBtn.innerHTML = '<i class="fas fa-eye"></i>';
                    toggleGuiBtn.title = 'Показать интерфейс';
                } else {
                    toggleGuiBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                    toggleGuiBtn.title = 'Скрыть интерфейс';
                }
            });
        }
        
        // Кнопка скрытия таблицы улучшений
        const treeHideBtn = document.querySelector('.tree-hide-btn');
        if (treeHideBtn) {
            treeHideBtn.addEventListener('click', () => {
                const treeContainer = document.querySelector('.tree-container');
                if (treeContainer) {
                    treeContainer.classList.toggle('hidden-upgrade-table');
                    
                    // Меняем иконку кнопки
                    if (treeContainer.classList.contains('hidden-upgrade-table')) {
                        treeHideBtn.innerHTML = '<i class="fas fa-table"></i>';
                        treeHideBtn.title = 'Показать таблицу';
                    } else {
                        treeHideBtn.innerHTML = '<i class="fas fa-times"></i>';
                        treeHideBtn.title = 'Скрыть таблицу';
                    }
                }
            });
        }
    }
    
    addAdminNavButton() {
        // Проверяем, не добавлена ли уже кнопка админки
        if (document.getElementById('admin-nav-btn')) return;
        
        const navPanel = document.querySelector('.nav-panel');
        if (navPanel) {
            const adminButton = document.createElement('button');
            adminButton.className = 'nav-btn admin-nav-btn';
            adminButton.id = 'admin-nav-btn';
            adminButton.style.background = 'linear-gradient(135deg, #ff0000, #ff4500)';
            adminButton.innerHTML = `
                <i class="fas fa-crown"></i>
                <span>Админ</span>
            `;
            adminButton.addEventListener('click', () => {
                this.showAdminPanel();
            });
            navPanel.appendChild(adminButton);
        }
    }
    
    showAdminPanel() {
        // Просто открываем профиль, там есть админ-панель
        this.showProfile();
    }
    
    click() {
        if (!this.currentUser) {
            console.log('[click] Нет текущего пользователя, клик игнорируется');
            return;
        }
        
        console.log('[click] Обработка клика');
        
        // Проверяем энергию
        if (this.state.energy < 1) {
            console.log('[click] Недостаточно энергии:', this.state.energy);
            this.showNotification('Недостаточно энергии!', 'warning');
            return;
        }

        // ✅ ИСПРАВЛЕНИЕ: Ограничиваем шанс двойного клика 2.5%
        let doubleClickBonus = this.state.doubleClickChance || 0;
        
        // Добавляем бонус от престижа (0.1% за каждый престиж, но не более 2.5%)
        const prestigeBonus = Math.min((this.state.prestige || 0) * 0.001, 0.025);
        doubleClickBonus = Math.min(doubleClickBonus + prestigeBonus, 0.025);
        
        // Добавляем бонус от планеты если есть
        const planetTheme = this.planetThemes[this.currentPlanetTheme];
        if (planetTheme && planetTheme.doubleClickBonus) {
            doubleClickBonus = Math.min(doubleClickBonus + planetTheme.doubleClickBonus, 0.025);
        }
        
        let isDoubleClick = false;
        if (doubleClickBonus > 0 && Math.random() < doubleClickBonus) {
            isDoubleClick = true;
        }
        
        // Рассчитываем базовый доход
        let baseIncome = this.state.clickPower;
        
        // Учитываем комбо и престиж
        let multiplier = this.state.combo * this.state.prestigeMultiplier;
        
        // Учитываем временный множитель из магазина
        if (this.state.tempClickMultiplier > 1) {
            multiplier *= this.state.tempClickMultiplier;
        }
        
        // Учитываем золотые клики из магазина
        if (this.state.goldenClicks > 0) {
            multiplier *= this.state.goldenMultiplier;
            this.state.goldenClicks--;
            if (this.state.goldenClicks === 0) {
                this.showNotification('Золотые клики закончились!', 'info');
            } else if (this.state.goldenClicks % 5 === 0) {
                this.showNotification(`Золотых кликов осталось: ${this.state.goldenClicks}`, 'info');
            }
        }
        
        // Учитываем двойной клик
        if (isDoubleClick) {
            multiplier *= 2;
            this.showNotification('КРИТИЧЕСКИЙ УДАР! x2', 'success');
        }
        
        // Добавляем бонус от планеты если есть
        if (planetTheme && planetTheme.incomeBonus) {
            multiplier *= (1 + planetTheme.incomeBonus);
        }
        
        let totalIncome = baseIncome * multiplier;
        totalIncome = Math.floor(totalIncome);
        
        // Добавляем доход
        this.state.credits += totalIncome;
        this.state.totalEarned += totalIncome;
        this.state.totalClicks++;
        this.state.energy -= 1;
        
        // Обновляем комбо
        this.updateCombo();
        
        // Шанс найти минералы с учетом буста и планеты
        const mineralChance = this.getMineralChance();
        const mineralBoost = this.state.mineralBoost || 1;
        let finalMineralChance = mineralChance * mineralBoost;
        
        // Добавляем бонус от планеты если есть
        if (planetTheme && planetTheme.mineralBonus) {
            finalMineralChance += planetTheme.mineralBonus;
        }
        
        if (Math.random() < finalMineralChance) {
            const mineralsFound = Math.floor(Math.random() * 3) + 1;
            const mineralMultiplier = this.getMineralMultiplier();
            const totalMinerals = mineralsFound * mineralMultiplier;
            this.state.minerals += totalMinerals;
            this.showNotification(`Найдены минералы! +${totalMinerals}`, 'success');
        }
        
        // Проверяем достижения
        this.checkAchievements();
        
        // Визуальные эффекты
        this.createClickAnimation(totalIncome);
        this.animatePlanet();
        
        // Обновляем отображение
        this.renderResources();
        this.updatePrestigeButton();
        
        // ✅ Обновляем левую панель
        this.updateLeftPanel();
        
        console.log(`[click] Клик обработан: +${totalIncome} кредитов, осталось энергии: ${this.state.energy}, шанс крита: ${(doubleClickBonus * 100).toFixed(2)}%`);
    }
    
    getMineralChance() {
        let chance = 0.025;
        
        // Учитываем улучшения mining_1 (по 2.5% за уровень)
        if (this.state.upgrades['mining_1']) {
            const level = this.state.upgrades['mining_1'];
            chance += 0.025 * level;
        }
        
        return Math.min(chance, 0.1);
    }
    
    getMineralMultiplier() {
        let multiplier = 1;
        
        // Учитываем улучшения mining_3
        if (this.state.upgrades['mining_3']) {
            const level = this.state.upgrades['mining_3'];
            multiplier += 2 * level;
        }
        
        return multiplier;
    }
    
    updateCombo() {
        const now = Date.now();
        const comboDecayMultiplier = this.state.comboDecayMultiplier || 1;
        
        if (now - this.state.comboTime < this.state.comboTimeout * comboDecayMultiplier) {
            this.state.combo = Math.min(this.state.combo + 0.1, 5);
            if (this.state.combo > this.state.maxCombo) {
                this.state.maxCombo = this.state.combo;
            }
        } else {
            this.state.combo = Math.max(1, this.state.combo - 0.2);
        }
        
        this.state.comboTime = now;
        this.renderCombo();
    }
    
    checkPurchaseCooldown() {
        const now = Date.now();
        const timeSinceLastPurchase = now - this.state.lastPurchaseTime;
        
        if (timeSinceLastPurchase < this.state.purchaseCooldown) {
            const remaining = Math.ceil((this.state.purchaseCooldown - timeSinceLastPurchase) / 1000);
            // ✅ ИСПРАВЛЕНИЕ 6: Убираем мерцающее уведомление
            // Просто возвращаем false без показа уведомления
            return false;
        }
        
        return true;
    }
    
    startPurchaseCooldownTimer() {
        console.log('[startPurchaseCooldownTimer] Запуск таймера кулдауна покупок...');
        setInterval(() => {
            if (!this.currentUser) return;
            
            const now = Date.now();
            const timeSinceLastPurchase = now - this.state.lastPurchaseTime;
            
            if (timeSinceLastPurchase < this.state.purchaseCooldown) {
                const remaining = Math.ceil((this.state.purchaseCooldown - timeSinceLastPurchase) / 1000);
                const timer = document.getElementById('purchase-timer');
                if (timer) {
                    timer.textContent = `Кулдаун: ${remaining} секунд`;
                    timer.style.display = 'block';
                }
            } else {
                const timer = document.getElementById('purchase-timer');
                if (timer) {
                    timer.style.display = 'none';
                }
            }
        }, 100);
    }
    
    buyUpgrade(upgradeId) {
        if (!this.currentUser) {
            console.log('[buyUpgrade] Нет пользователя');
            this.showNotification('Сначала войдите в игру!', 'warning');
            return false;
        }
        
        if (!this.state) {
            console.error('[buyUpgrade] Нет состояния игры');
            this.showNotification('Ошибка состояния игры', 'error');
            return false;
        }
        
        console.log('[buyUpgrade] Покупка улучшения:', upgradeId);
        
        // Проверяем кулдаун
        if (!this.checkPurchaseCooldown()) {
            console.log('[buyUpgrade] Кулдаун активен');
            return false;
        }
        
        // Проверяем, это престижное улучшение или обычное
        if (upgradeId.startsWith('prestige_')) {
            return this.buyPrestigeUpgrade(upgradeId);
        }

        // Находим улучшение
        const upgrade = this.upgradesTree.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error('[buyUpgrade] Улучшение не найдено:', upgradeId);
            this.showNotification('Улучшение не найдено!', 'error');
            return false;
        }
        
        // Проверяем требования
        if (!this.checkUpgradeRequirements(upgrade)) {
            console.log('[buyUpgrade] Требования не выполнены для:', upgradeId);
            this.showNotification('Требования не выполнены! Проверьте нужные улучшения.', 'warning');
            return false;
        }
        
        // Получаем текущий уровень
        const currentLevel = this.state.upgrades[upgradeId] || 0;
        
        // Проверяем максимальный уровень
        if (currentLevel >= upgrade.maxLevel) {
            console.log('[buyUpgrade] Максимальный уровень достигнут');
            this.showNotification('Максимальный уровень достигнут!', 'info');
            return false;
        }
        
        // Рассчитываем цену
        let price;
        let mineralsPrice = 0;
        let creditsPrice = 0;
        
        if (upgrade.currency === 'mixed') {
            // Для смешанных цен
            creditsPrice = Math.floor(upgrade.basePrice.credits * Math.pow(upgrade.priceMultiplier, currentLevel));
            mineralsPrice = Math.floor(upgrade.basePrice.minerals * Math.pow(upgrade.priceMultiplier, currentLevel));
            price = { credits: creditsPrice, minerals: mineralsPrice };
        } else {
            // Для обычных цен
            price = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));
        }
        
        // Проверяем достаточно ли ресурсов
        let canAfford = false;
        let currencyName = '';
        let currencyDisplay = '';
        
        if (upgrade.currency === 'minerals') {
            canAfford = this.state.minerals >= price;
            currencyName = 'минералов';
            currencyDisplay = `<i class="fas fa-gem"></i> ${price}`;
        } else if (upgrade.currency === 'credits') {
            canAfford = this.state.credits >= price;
            currencyName = 'кредитов';
            currencyDisplay = `<i class="fas fa-coins"></i> ${price}`;
        } else if (upgrade.currency === 'mixed') {
            canAfford = this.state.credits >= creditsPrice && this.state.minerals >= mineralsPrice;
            currencyName = 'ресурсов';
            currencyDisplay = `<i class="fas fa-coins"></i> ${creditsPrice} + <i class="fas fa-gem"></i> ${mineralsPrice}`;
        }
        
        if (!canAfford) {
            console.log('[buyUpgrade] Недостаточно ресурсов:', currencyName);
            let needed = '';
            if (upgrade.currency === 'mixed') {
                needed = `Нужно: ${creditsPrice} кредитов и ${mineralsPrice} минералов`;
            } else {
                needed = `Нужно: ${price} ${currencyName}`;
            }
            this.showNotification(`Недостаточно ${currencyName}! ${needed}`, 'warning');
            return false;
        }
        
        // Устанавливаем кулдаун
        this.state.lastPurchaseTime = Date.now();
        
        // Покупаем улучшение (списываем нужные ресурсы)
        if (upgrade.currency === 'minerals') {
            this.state.minerals -= price;
        } else if (upgrade.currency === 'credits') {
            this.state.credits -= price;
        } else if (upgrade.currency === 'mixed') {
            this.state.credits -= creditsPrice;
            this.state.minerals -= mineralsPrice;
        }
        
        // Увеличиваем уровень улучшения
        this.state.upgrades[upgradeId] = currentLevel + 1;
        
        // Применяем эффект улучшения
        this.applyUpgradeEffect(upgrade);
        
        // Разблокируем связанные улучшения
        this.unlockConnectedUpgrades(upgradeId);
        
        // Показываем уведомление с информацией о покупке
        this.showNotification(
            `<div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 5px;">Куплено улучшение!</div>
                <div>${upgrade.name}</div>
                <div>Уровень ${currentLevel + 1}/${upgrade.maxLevel}</div>
                <div style="color: ${upgrade.currency === 'minerals' ? 'var(--mineral-green)' : 
                                  upgrade.currency === 'mixed' ? 'var(--neon-blue)' : 
                                  'var(--energy-yellow)'}; margin-top: 5px;">
                    ${currencyDisplay}
                </div>
            </div>`, 
            'success'
        );
        
        // Обновляем отображение
        this.renderResources();
        this.renderUpgrades();
        this.checkAchievements();
        
        // Сохраняем игру
        this.saveGame();
        
        console.log(`[buyUpgrade] Улучшение куплено: ${upgradeId} уровень ${currentLevel + 1}`);
        return true;
    }
    
    calculateUpgradePrice(upgrade, currentLevel) {
        if (upgrade.currency === 'mixed') {
            return {
                credits: Math.floor(upgrade.basePrice.credits * Math.pow(upgrade.priceMultiplier, currentLevel)),
                minerals: Math.floor(upgrade.basePrice.minerals * Math.pow(upgrade.priceMultiplier, currentLevel))
            };
        }
        return Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));
    }
    
    checkUpgradeRequirements(upgrade) {
        if (!upgrade.requirements || upgrade.requirements.length === 0) {
            return true;
        }
        
        for (const requirement of upgrade.requirements) {
            const currentLevel = this.state.upgrades[requirement.id] || 0;
            console.log(`[checkUpgradeRequirements] Проверка требования: ${requirement.id} нужно ${requirement.level}, есть ${currentLevel}`);
            
            if (currentLevel < requirement.level) {
                console.log(`[checkUpgradeRequirements] Требование не выполнено: ${requirement.id} нужен уровень ${requirement.level}, текущий: ${currentLevel}`);
                return false;
            }
        }
        
        return true;
    }
    
    applyUpgradeEffect(upgrade) {
        const effect = upgrade.effect;
        
        console.log('[applyUpgradeEffect] Применение эффекта улучшения:', upgrade.id, effect);
        
        if (effect.clickPower) {
            this.state.clickPower += effect.clickPower;
            console.log(`[applyUpgradeEffect] Сила клика увеличена на ${effect.clickPower}, теперь: ${this.state.clickPower}`);
        }
        if (effect.autoIncome) {
            this.state.autoIncome += effect.autoIncome;
            console.log(`[applyUpgradeEffect] Автоматический доход увеличен на ${effect.autoIncome}, теперь: ${this.state.autoIncome}`);
        }
        if (effect.maxEnergy) {
            this.state.maxEnergy += effect.maxEnergy;
            console.log(`[applyUpgradeEffect] Максимальная энергия увеличена на ${effect.maxEnergy}, теперь: ${this.state.maxEnergy}`);
        }
        if (effect.energyRegen) {
            this.state.energyRegen += effect.energyRegen;
            console.log(`[applyUpgradeEffect] Регенерация энергии увеличена на ${effect.energyRegen}, теперь: ${this.state.energyRegen}`);
        }
        if (effect.mineralChance) {
            // Этот эффект применяется динамически в getMineralChance()
            console.log(`[applyUpgradeEffect] Шанс минералов увеличен на ${effect.mineralChance}`);
        }
        
        this.updateStatsDisplay();
    }
    
    unlockConnectedUpgrades(upgradeId) {
        console.log('[unlockConnectedUpgrades] Разблокировка связанных улучшений для:', upgradeId);
        
        const upgrade = this.upgradesTree.find(u => u.id === upgradeId);
        if (!upgrade) return;
        
        // Получаем текущий уровень купленного улучшения
        const currentLevel = this.state.upgrades[upgradeId] || 0;
        
        // Для каждого улучшения в дереве проверяем требования
        for (const otherUpgrade of this.upgradesTree) {
            if (otherUpgrade.unlocked) continue;
            
            if (otherUpgrade.requirements && otherUpgrade.requirements.length > 0) {
                let allRequirementsMet = true;
                
                for (const requirement of otherUpgrade.requirements) {
                    if (requirement.id === upgradeId) {
                        // Проверяем, достигнут ли требуемый уровень
                        if (currentLevel < requirement.level) {
                            allRequirementsMet = false;
                            console.log(`[unlockConnectedUpgrades] Требование не выполнено для ${otherUpgrade.id}: нужен уровень ${requirement.level}, текущий: ${currentLevel}`);
                            break;
                        }
                    } else {
                        // Проверяем другие требования
                        const otherLevel = this.state.upgrades[requirement.id] || 0;
                        if (otherLevel < requirement.level) {
                            allRequirementsMet = false;
                            break;
                        }
                    }
                }
                
                if (allRequirementsMet) {
                    otherUpgrade.unlocked = true;
                    console.log(`[unlockConnectedUpgrades] Разблокировано улучшение: ${otherUpgrade.name}`);
                }
            }
        }
    }
    
    unlockPrestigeUpgrades() {
        console.log('[unlockPrestigeUpgrades] Проверка разблокировки престижных улучшений');
        
        if (!this.prestigeUpgradesTree || this.prestigeUpgradesTree.length === 0) {
            console.log('[unlockPrestigeUpgrades] Нет престижных улучшений для проверки');
            return;
        }
        
        if (!this.state) {
            console.log('[unlockPrestigeUpgrades] Нет состояния');
            return;
        }
        
        // Всегда показываем престижные улучшения если есть престиж
        const hasPrestige = this.state.prestige >= 1;
        
        for (const upgrade of this.prestigeUpgradesTree) {
            // Разблокируем если есть престиж или требования выполнены
            if (!upgrade.unlocked && hasPrestige) {
                let allRequirementsMet = true;
                
                if (upgrade.requirements && upgrade.requirements.length > 0) {
                    for (const requirement of upgrade.requirements) {
                        if (requirement.type === 'prestige') {
                            if ((this.state.prestige || 0) < requirement.value) {
                                allRequirementsMet = false;
                                break;
                            }
                        } else if (requirement.id) {
                            const level = this.state.prestigeUpgrades?.[requirement.id] || 0;
                            if (level < requirement.level) {
                                allRequirementsMet = false;
                                break;
                            }
                        }
                    }
                }
                
                if (allRequirementsMet) {
                    upgrade.unlocked = true;
                    console.log(`[unlockPrestigeUpgrades] Разблокировано престижное улучшение: ${upgrade.name}`);
                }
            }
        }
    }

    buyShopItem(itemId) {
        if (!this.currentUser) {
            console.log('[buyShopItem] Нет пользователя');
            return false;
        }
        
        console.log('[buyShopItem] Покупка предмета магазина:', itemId);
        
        // Проверяем кулдаун
        if (!this.checkPurchaseCooldown()) {
            console.log('[buyShopItem] Кулдаун активен');
            return false;
        }
        
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) {
            console.error('[buyShopItem] Предмет не найден:', itemId);
            return false;
        }
        
        const cooldown = this.state.shopCooldowns[itemId];
        if (cooldown && cooldown > Date.now()) {
            const remaining = Math.ceil((cooldown - Date.now()) / 1000);
            this.showNotification(`Перезарядка: ${remaining} секунд`, 'warning');
            return false;
        }
        
        if (this.state.credits < item.price) {
            console.log('[buyShopItem] Недостаточно кредитов:', this.state.credits, 'нужно:', item.price);
            this.showNotification(`Недостаточно кредитов! Нужно: ${item.price}`, 'warning');
            return false;
        }
        
        this.state.lastPurchaseTime = Date.now();
        this.state.credits -= item.price;
        
        // Добавляем предмет в инвентарь вместо немедленной активации
        const inventoryItem = {
            id: item.id + '_' + Date.now(), // уникальный ID
            originalId: item.id,
            name: item.name,
            description: item.description,
            icon: item.icon,
            effect: item.effect,
            category: item.category,
            animation: item.animation,
            duration: item.duration,
            cooldown: item.cooldown,
            price: item.price,
            purchasedAt: Date.now(),
            active: false
        };
        
        this.state.inventory.push(inventoryItem);
        
        this.state.shopCooldowns[itemId] = Date.now() + (item.cooldown * 1000);
        
        this.showNotification(`Добавлено в инвентарь: ${item.name}`, 'success');
        
        // Создаем анимацию если есть
        if (item.animation) {
            this.createShopAnimation(item);
        }
        
        this.renderResources();
        this.renderShop();
        this.renderInventory(); // Обновляем инвентарь
        console.log(`[buyShopItem] Предмет добавлен в инвентарь: ${itemId} за ${item.price} кредитов`);
        return true;
    }

    // ===== СИСТЕМА ИНВЕНТАРЯ =====
    
    renderInventory() {
        if (!this.currentUser) return;

        console.log('[renderInventory] Рендеринг инвентаря...');
        const container = document.getElementById('inventory-grid');
        if (!container) {
            console.error('[renderInventory] Контейнер инвентаря не найден');
            return;
        }

        if (!this.state.inventory || this.state.inventory.length === 0) {
            container.innerHTML = `
                <div class="inventory-empty">
                    <i class="fas fa-backpack"></i>
                    <div>Ваш инвентарь пуст</div>
                    <div>Купите предметы в магазине, чтобы добавить их сюда</div>
                </div>
            `;
            return;
        }

        let html = '';

        for (const item of this.state.inventory) {
            const originalItem = this.shopItems.find(i => i.id === item.originalId);
            if (!originalItem) continue;

            html += `
                <div class="inventory-item" data-item-id="${item.id}">
                    <div class="inventory-item-icon">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="inventory-item-name">${item.name}</div>
                    <div class="inventory-item-description">${item.description}</div>
                    <div class="inventory-item-actions">
                        <button class="inventory-item-action-btn inventory-item-use-btn" 
                                onclick="window.game.useInventoryItem('${item.id}')" 
                                ${item.active ? 'disabled' : ''}>
                            <i class="fas fa-play"></i> Использовать
                        </button>
                        <button class="inventory-item-action-btn inventory-item-delete-btn" 
                                onclick="window.game.deleteInventoryItem('${item.id}')">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        console.log('[renderInventory] Инвентарь отрисован, количество предметов:', this.state.inventory.length);
    }

    useInventoryItem(itemId) {
        if (!this.currentUser) return;

        console.log('[useInventoryItem] Использование предмета инвентаря:', itemId);
        
        const itemIndex = this.state.inventory.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
            console.error('[useInventoryItem] Предмет не найден в инвентаре:', itemId);
            this.showNotification('Предмет не найден!', 'error');
            return;
        }

        const item = this.state.inventory[itemIndex];
        const originalItem = this.shopItems.find(i => i.id === item.originalId);

        if (!originalItem) {
            console.error('[useInventoryItem] Оригинальный предмет не найден:', item.originalId);
            this.showNotification('Ошибка предмета!', 'error');
            return;
        }

        // Проверяем кулдаун
        if (!this.checkPurchaseCooldown()) {
            console.log('[useInventoryItem] Кулдаун активен');
            return false;
        }

        // Применяем эффект предмета
        const success = this.applyShopEffect(originalItem);

        if (success) {
            // Отмечаем предмет как активный
            this.state.inventory[itemIndex].active = true;
            
            // Добавляем информацию о бусте в активные бусты
            if (originalItem.duration > 0) {
                const boostInfo = {
                    type: originalItem.effect.type,
                    name: originalItem.name,
                    icon: originalItem.icon,
                    multiplier: originalItem.effect.value || 1,
                    duration: originalItem.duration,
                    expires: Date.now() + (originalItem.duration * 1000),
                    startTime: Date.now()
                };
                
                // Сохраняем информацию о бусте в зависимости от типа
                let boostKey = '';
                switch(originalItem.effect.type) {
                    case 'temporaryMultiplier':
                        boostKey = 'tempClickMultiplier';
                        break;
                    case 'autoBoost':
                        boostKey = 'autoBoost';
                        break;
                    case 'mineralBoost':
                        boostKey = 'mineralBoost';
                        break;
                    case 'comboBoost':
                        boostKey = 'comboBoost';
                        break;
                    case 'goldenClicks':
                        boostKey = 'goldenClicks';
                        break;
                }
                
                if (boostKey) {
                    this.state.shopActiveBoosts[boostKey] = boostInfo;
                }
            }
            
            this.showNotification(`Использовано: ${item.name}`, 'success');
            
            // Создаем анимацию если есть
            if (originalItem.animation) {
                this.createShopAnimation(originalItem);
            }
            
            this.renderInventory();
            this.renderActiveBoosts();
            this.renderResources();
            console.log(`[useInventoryItem] Предмет использован: ${itemId}`);
            return true;
        }
        
        return false;
    }

    deleteInventoryItem(itemId) {
        if (!this.currentUser) return;

        console.log('[deleteInventoryItem] Удаление предмета инвентаря:', itemId);

        if (confirm('Вы уверены, что хотите удалить этот предмет из инвентаря?')) {
            const itemIndex = this.state.inventory.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                console.error('[deleteInventoryItem] Предмет не найден в инвентаре:', itemId);
                this.showNotification('Предмет не найден!', 'error');
                return;
            }

            const item = this.state.inventory[itemIndex];
            this.state.inventory.splice(itemIndex, 1);

            this.showNotification(`Предмет удалён: ${item.name}`, 'info');

            this.renderInventory();
            console.log(`[deleteInventoryItem] Предмет удалён: ${itemId}`);
        }
    }

    // ===== ПРЕСТИЖНЫЕ ФУНКЦИИ =====
    
    renderPrestigeFunctions() {
        if (!this.currentUser) return;

        console.log('[renderPrestigeFunctions] Рендеринг престижных функций...');
        const container = document.getElementById('prestige-functions-grid');
        if (!container) {
            console.error('[renderPrestigeFunctions] Контейнер престижных функций не найден');
            return;
        }

        let html = '';

        for (const func of this.prestigeFunctions) {
            const owned = this.state.purchasedPrestigeFunctions[func.id] || false;
            const canBuy = !owned && this.state.prestige >= func.price;

            html += `
                <div class="prestige-function ${owned ? 'owned' : (canBuy ? '' : 'locked')}" data-function-id="${func.id}">
                    <div class="prestige-function-icon">
                        <i class="${func.icon}"></i>
                    </div>
                    <div class="prestige-function-name">${func.name}</div>
                    <div class="prestige-function-description">${func.description}</div>
                    <div class="prestige-function-cost">
                        Цена: ${func.price} престижных монет
                    </div>
                    <button class="prestige-function-buy-btn" 
                            onclick="window.game.buyPrestigeFunction('${func.id}')" 
                            ${owned || !canBuy ? 'disabled' : ''}>
                        ${owned ? 'Куплено' : (canBuy ? 'Купить' : 'Недостаточно')}
                    </button>
                </div>
            `;
        }

        container.innerHTML = html;
        console.log('[renderPrestigeFunctions] Престижные функции отрисованы');
    }

    buyPrestigeFunction(functionId) {
        if (!this.currentUser) return;

        console.log('[buyPrestigeFunction] Покупка престижной функции:', functionId);

        const func = this.prestigeFunctions.find(f => f.id === functionId);
        if (!func) {
            console.error('[buyPrestigeFunction] Функция не найдена:', functionId);
            this.showNotification('Функция не найдена!', 'error');
            return;
        }

        if (this.state.purchasedPrestigeFunctions[functionId]) {
            console.error('[buyPrestigeFunction] Функция уже куплена:', functionId);
            this.showNotification('Функция уже куплена!', 'warning');
            return;
        }

        if (this.state.prestige < func.price) {
            console.error('[buyPrestigeFunction] Недостаточно престижных монет:', this.state.prestige, 'нужно:', func.price);
            this.showNotification(`Недостаточно престижных монет! Нужно: ${func.price}`, 'warning');
            return;
        }

        // Покупаем функцию
        this.state.prestige -= func.price;
        this.state.purchasedPrestigeFunctions[functionId] = true;

        // Применяем эффект функции
        this.applyPrestigeFunctionEffect(func);

        this.showNotification(`Куплена функция: ${func.name}`, 'success');

        this.renderResources();
        this.renderPrestigeFunctions();
        this.renderPrestigeButton();

        // Если это золотое улучшение клика, добавляем его в дерево улучшений
        if (functionId === 'golden_click_upgrade') {
            this.addGoldenClickUpgrade();
        }

        console.log(`[buyPrestigeFunction] Функция куплена: ${functionId} за ${func.price} престижных монет`);
    }

    applyPrestigeFunctionEffect(func) {
        console.log('[applyPrestigeFunctionEffect] Применение эффекта функции:', func.id);
        
        // В зависимости от типа функции применяем эффект
        switch(func.id) {
            case 'golden_click_upgrade':
                // Эффект будет применен через добавление улучшения в дерево
                break;
            default:
                console.warn('[applyPrestigeFunctionEffect] Неизвестная функция:', func.id);
        }
    }

    addGoldenClickUpgrade() {
        console.log('[addGoldenClickUpgrade] Добавление золотого улучшения клика...');
        
        // Проверяем, не добавлено ли уже золотое улучшение
        const existingUpgrade = this.upgradesTree.find(u => u.id === 'gold_basic_1_new');
        if (existingUpgrade) {
            console.log('[addGoldenClickUpgrade] Золотое улучшение уже существует');
            return;
        }

        // Добавляем новое золотое улучшение в дерево
        const goldenUpgrade = {
            id: 'gold_basic_1_new',
            name: 'Золотой усиленный перфоратор',
            description: 'Увеличивает мощность клика в 2 раза (бонус к клику)',
            icon: 'fas fa-gem',
            basePrice: { credits: 100000, minerals: 50 }, // 100,000 кредитов и 50 минералов
            priceMultiplier: 1.0, // Не увеличивается цена
            effect: { clickPowerMultiplier: 2 },
            maxLevel: 1,
            requirements: [{ id: 'basic_4', level: 3 }],
            unlocked: true, // Разблокировано сразу после покупки
            purchased: true, // Покупается автоматически при получении
            position: { x: -700, y: -450 }, // Положение рядом с обычным улучшением
            level: 1,
            connections: [],
            currency: 'mixed',
            branch: 'gold_basic',
            isGoldUpgrade: true, // Это золотое улучшение
            oneTime: true // Можно купить только один раз
        };

        // Добавляем улучшение в дерево
        this.upgradesTree.push(goldenUpgrade);

        // Отмечаем как купленное в состоянии
        this.state.upgrades['gold_basic_1_new'] = 1;

        // Применяем эффект улучшения
        this.applyUpgradeEffect(goldenUpgrade);

        console.log('[addGoldenClickUpgrade] Золотое улучшение добавлено и активировано');
    }
    
    // ===== ПРЕСТИЖНЫЕ УЛУЧШЕНИЯ =====
    
    buyPrestigeUpgrade(upgradeId) {
        if (!this.currentUser || this.state.prestige < 1) {
            this.showNotification('Требуется хотя бы 1 престиж!', 'warning');
            return false;
        }
        
        const upgrade = this.prestigeUpgradesTree.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error('[buyPrestigeUpgrade] Улучшение не найдено:', upgradeId);
            return false;
        }
        
        // Проверка требований
        if (!this.checkPrestigeRequirements(upgrade)) {
            this.showNotification('Требования не выполнены!', 'warning');
            return false;
        }
        
        const currentLevel = this.state.prestigeUpgrades?.[upgradeId] || 0;
        if (currentLevel >= upgrade.maxLevel) {
            this.showNotification('Максимальный уровень достигнут!', 'info');
            return false;
        }
        
        const price = Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel));
        
        if (this.state.prestige < price) {
            this.showNotification(`Недостаточно очков престижа! Нужно: ${price}`, 'warning');
            return false;
        }
        
        // Покупка
        this.state.prestige -= price;
        if (!this.state.prestigeUpgrades) {
            this.state.prestigeUpgrades = {};
        }
        this.state.prestigeUpgrades[upgradeId] = currentLevel + 1;
        
        // Применение эффекта
        this.applyPrestigeUpgradeEffect(upgrade, currentLevel + 1);
        
        // Разблокировка следующих
        this.unlockPrestigeUpgrades();
        
        this.showNotification(`Куплено престижное улучшение: ${upgrade.name} Уровень ${currentLevel + 1}`, 'success');
        
        this.renderAll();
        this.saveGame();
        return true;
    }
    
    checkPrestigeRequirements(upgrade) {
        if (!upgrade.requirements) return true;
        
        for (const req of upgrade.requirements) {
            if (req.type === 'prestige') {
                if (this.state.prestige < req.value) return false;
            } else if (req.id) {
                const level = this.state.prestigeUpgrades?.[req.id] || 0;
                if (level < req.level) return false;
            }
        }
        
        return true;
    }
    
    applyPrestigeUpgradeEffect(upgrade, level) {
        const effect = upgrade.effect;
        
        switch(effect.type) {
            case 'energyRegenPerPrestige':
                this.state.energyRegen += effect.value * this.state.prestige;
                break;
                
            case 'doubleClickChance':
                this.state.doubleClickChance = (this.state.doubleClickChance || 0) + (effect.value * level);
                break;
                
            case 'energySave':
                this.state.energySavePercent = (this.state.energySavePercent || 0) + (effect.value * level);
                break;
        }
    }
    
    applyShopEffect(item) {
        const effect = item.effect;
        console.log('[applyShopEffect] Применение эффекта магазина:', effect.type, effect.value);
        
        try {
            switch(effect.type) {
                case 'energy':
                    if (typeof effect.value === 'number') {
                        const energyToRestore = effect.value;
                        this.state.energy = Math.min(this.state.energy + energyToRestore, this.state.maxEnergy);
                        this.showNotification(`Энергия восстановлена на ${energyToRestore} единиц!`, 'success');
                    }
                    break;
                    
                case 'temporaryMultiplier':
                    this.state.tempClickMultiplier = effect.value;
                    this.state.activeBoosts.tempClickMultiplier = {
                        expires: Date.now() + (effect.duration * 1000),
                        duration: effect.duration
                    };
                    this.showNotification(`Клик x${effect.value} на ${effect.duration} секунд!`, 'success');
                    break;
                    
                case 'goldenClicks':
                    this.state.goldenClicks += effect.value;
                    this.state.goldenMultiplier = effect.multiplier;
                    this.showNotification(`Активировано ${effect.value} золотых кликов x${effect.multiplier}!`, 'success');
                    break;
                    
                case 'autoBoost':
                    this.state.autoBoost = effect.value;
                    this.state.activeBoosts.autoBoost = {
                        expires: Date.now() + (effect.duration * 1000),
                        duration: effect.duration
                    };
                    this.showNotification(`Автоматический доход x${effect.value} на ${effect.duration} секунд!`, 'success');
                    break;
                    
                case 'mineralBoost':
                    this.state.mineralBoost = effect.value;
                    this.state.activeBoosts.mineralBoost = {
                        expires: Date.now() + (effect.duration * 1000),
                        duration: effect.duration
                    };
                    this.showNotification(`Шанс минералов x${effect.value} на ${effect.duration} секунд!`, 'success');
                    break;
                    
                case 'comboBoost':
                    this.state.comboDecayMultiplier = effect.value;
                    this.state.activeBoosts.comboBoost = {
                        expires: Date.now() + (effect.duration * 1000),
                        duration: effect.duration
                    };
                    this.showNotification(`Комбо падает на ${(1-effect.value)*100}% медленнее на ${effect.duration} секунд!`, 'success');
                    break;
                    
                default:
                    console.error('[applyShopEffect] Неизвестный тип эффекта:', effect.type);
                    return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('[applyShopEffect] Ошибка применения эффекта:', error);
            return false;
        }
    }
    
    updateBoosts() {
        if (!this.currentUser) return;
        
        const now = Date.now();
        let updated = false;
        
        // Проверяем все активные бусты
        for (const boostName in this.state.activeBoosts) {
            if (this.state.activeBoosts[boostName].expires < now) {
                switch(boostName) {
                    case 'tempClickMultiplier':
                        this.state.tempClickMultiplier = 1;
                        break;
                    case 'autoBoost':
                        this.state.autoBoost = 1;
                        break;
                    case 'mineralBoost':
                        this.state.mineralBoost = 1;
                        break;
                    case 'comboBoost':
                        this.state.comboDecayMultiplier = 1;
                        break;
                }
                delete this.state.activeBoosts[boostName];
                console.log(`[updateBoosts] Буст ${boostName} закончился`);
                updated = true;
            }
        }
        
        // Проверяем бусты магазина
        for (const boostName in this.state.shopActiveBoosts) {
            if (this.state.shopActiveBoosts[boostName].expires < now) {
                delete this.state.shopActiveBoosts[boostName];
                console.log(`[updateBoosts] Буст магазина ${boostName} закончился`);
                updated = true;
            }
        }
        
        if (updated) {
            this.renderActiveBoosts();
        }
    }
    
    checkAchievements() {
        if (!this.currentUser) return;
        
        let updated = false;
        
        for (const achievement of this.achievements) {
            if (achievement.unlocked) continue;
            
            if (this.checkAchievementCondition(achievement)) {
                achievement.unlocked = true;
                // Не применяем награду сразу, ждем когда игрок ее заберет
                updated = true;
            }
        }
        
        if (updated) {
            this.renderAchievements();
        }
    }
    
    checkAchievementCondition(achievement) {
        const condition = achievement.condition;
        
        switch (condition.type) {
            case 'clicks':
                return this.state.totalClicks >= condition.value;
            case 'totalCredits':
                return this.state.totalEarned >= condition.value;
            case 'autoIncome':
                return this.state.autoIncome >= condition.value;
            case 'minerals':
                return this.state.minerals >= condition.value;
            case 'maxEnergy':
                return this.state.maxEnergy >= condition.value;
            case 'totalUpgrades':
                return Object.keys(this.state.upgrades).length >= condition.value;
            case 'maxCombo':
                return this.state.maxCombo >= condition.value;
            case 'prestige':
                return this.state.prestige >= condition.value;
            default:
                return false;
        }
    }
    
    claimAchievementReward(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) {
            console.error('[claimAchievementReward] Достижение не найдено:', achievementId);
            return false;
        }
        
        if (!achievement.unlocked) {
            this.showNotification('Достижение еще не разблокировано!', 'warning');
            return false;
        }
        
        if (achievement.rewardCollected) {
            this.showNotification('Награда уже получена!', 'info');
            return false;
        }
        
        const reward = achievement.reward;
        console.log('[claimAchievementReward] Получение награды за достижение:', achievement.name, 'Награда:', reward);
        
        // Применяем награду
        let rewardText = '';
        if (reward.credits) {
            this.state.credits += reward.credits;
            rewardText += `+${reward.credits} кредитов `;
        }
        if (reward.clickPower) {
            this.state.clickPower += reward.clickPower;
            rewardText += `+${reward.clickPower} к силе клика `;
        }
        if (reward.autoIncome) {
            this.state.autoIncome += reward.autoIncome;
            rewardText += `+${reward.autoIncome} авто-дохода `;
        }
        if (reward.mineralMultiplier) {
            // Уже применяется динамически
            rewardText += `+${reward.mineralMultiplier} к множителю минералов `;
        }
        if (reward.energyRegen) {
            this.state.energyRegen += reward.energyRegen;
            rewardText += `+${reward.energyRegen} регенерации энергии `;
        }
        if (reward.comboDecayMultiplier) {
            this.state.comboDecayMultiplier *= reward.comboDecayMultiplier;
            rewardText += `x${reward.comboDecayMultiplier} к замедлению комбо `;
        }
        if (reward.doubleClickChance) {
            this.state.doubleClickChance += reward.doubleClickChance;
            rewardText += `+${(reward.doubleClickChance * 100).toFixed(1)}% шанса двойного клика `;
        }
        if (reward.prestigeMultiplier) {
            this.state.prestigeMultiplier += reward.prestigeMultiplier;
            rewardText += `+${reward.prestigeMultiplier} к множителю престижа `;
        }
        
        // Отмечаем награду как полученную
        achievement.rewardCollected = true;
        this.state.achievementsCollected[achievementId] = true;
        
        this.showNotification(`Получена награда за достижение "${achievement.name}": ${rewardText}`, 'success');
        
        // Обновляем отображение
        this.renderResources();
        this.renderAchievements();
        this.updateStatsDisplay();
        
        // Сохраняем игру
        this.saveGame();
        
        return true;
    }
    
    prestige() {
        if (!this.currentUser) return;

        // Рассчитываем возможное количество престижей, которое может позволить себе игрок
        let totalPrestigeGains = 0;
        let remainingCredits = this.state.credits;
        let currentPrestige = this.state.prestige;
        
        while (true) {
            const baseRequiredCredits = 25000;
            const prestigeMultiplier =  Math.pow(1.1, currentPrestige);
            const requiredCredits = Math.floor(baseRequiredCredits * prestigeMultiplier);
            
            if (remainingCredits >= requiredCredits) {
                totalPrestigeGains++;
                remainingCredits -= requiredCredits;
                currentPrestige++;
            } else {
                break;
            }
        }

        if (totalPrestigeGains === 0) {
            const baseRequiredCredits = 25000;
            const prestigeMultiplier =  Math.pow(1.1, this.state.prestige);
            const requiredCredits = Math.floor(baseRequiredCredits * prestigeMultiplier);
            console.log('[prestige] Недостаточно кредитов для престижа:', this.state.credits, 'нужно:', requiredCredits);
            this.showNotification(`Нужно ${this.formatNumber(requiredCredits)} кредитов для престижа!`, 'warning');
            return;
        }

        // Сохраняем текущую тему планеты для анимации
        const oldTheme = this.planetThemes[this.currentPlanetTheme];

        // Создаем модальное окно подтверждения
        this.showPrestigeConfirmation(totalPrestigeGains, oldTheme);
    }

    showPrestigeConfirmation(prestigePoints, oldTheme) {
        console.log('[showPrestigeConfirmation] Показ подтверждения престижа');
        
        // Закрываем другие модалки если есть
        this.closePrestigeModal();
        
        const prestigeModalHTML = `
            <div class="modal-overlay prestige-modal">
                <div class="modal">
                    <div class="modal-header">
                        <div class="prestige-icon-animation">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-rocket"></i>
                            <i class="fas fa-crown"></i>
                        </div>
                        <h2>ПРЕСТИЖ!</h2>
                        <button class="close-modal close-prestige-modal">&times;</button>
                    </div>
                    <div class="modal-content">
                        <div class="prestige-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <div>
                                <p>Вы собираетесь выполнить престиж! Это сбросит:</p>
                            </div>
                        </div>
                        <div class="prestige-reset-list">
                            <div class="reset-item">
                                <i class="fas fa-coins"></i>
                                <span>Все кредиты</span>
                            </div>
                            <div class="reset-item">
                                <i class="fas fa-gem"></i>
                                <span>Все минералы</span>
                            </div>
                            <div class="reset-item">
                                <i class="fas fa-sitemap"></i>
                                <span>Все улучшения</span>
                            </div>
                            <div class="reset-item">
                                <i class="fas fa-bolt"></i>
                                <span>Энергию (частично)</span>
                            </div>
                        </div>
                        
                        <div class="prestige-warning">
                            <i class="fas fa-check-circle"></i>
                            <div>
                                <p>Следующие вещи сохранятся:</p>
                            </div>
                        </div>
                        <div class="prestige-save-list">
                            <div class="save-item">
                                <i class="fas fa-trophy"></i>
                                <span>Все достижения</span>
                            </div>
                            <div class="save-item">
                                <i class="fas fa-chart-bar"></i>
                                <span>Вся статистика</span>
                            </div>
                            <div class="save-item">
                                <i class="fas fa-star"></i>
                                <span>Очки престижа</span>
                            </div>
                            <div class="save-item">
                                <i class="fas fa-infinity"></i>
                                <span>Престижные улучшения</span>
                            </div>
                        </div>
                        
                        <div class="prestige-rewards">
                            <h3><i class="fas fa-gift"></i> Вы получите:</h3>
                            <div class="reward-item">
                                <div class="reward-icon">
                                    <i class="fas fa-star"></i>
                                </div>
                                <div class="reward-info">
                                    <div class="reward-name">${prestigePoints} очков престижа</div>
                                    <div class="reward-desc">Множитель дохода: x${(1 + ((this.state.prestige + prestigePoints) * 0.1)).toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="prestige-final">
                            <p><i class="fas fa-info-circle"></i> После престижа вы начнете с бонусных кредитов, но с сохраненными достижениями и бонусами престижа!</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="modal-btn modal-btn-cancel prestige-cancel-btn">
                            <i class="fas fa-times"></i> Отмена
                        </button>
                        <button class="modal-btn modal-btn-confirm prestige-confirm-btn">
                            <i class="fas fa-rocket"></i> ВЫПОЛНИТЬ ПРЕСТИЖ
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', prestigeModalHTML);
        
        // ✅ ИСПРАВЛЕНИЕ: Проверяем существование элементов перед добавлением обработчиков
        const closeBtn = document.querySelector('.close-prestige-modal');
        const cancelBtn = document.querySelector('.prestige-cancel-btn');
        const confirmBtn = document.querySelector('.prestige-confirm-btn');
        const overlay = document.querySelector('.prestige-modal .modal-overlay');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closePrestigeModal();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closePrestigeModal();
            });
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.executePrestige(prestigePoints, oldTheme);
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    this.closePrestigeModal();
                }
            });
        }
        
        // Блокировка клавиши Escape
        this.escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePrestigeModal();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }
    
    closePrestigeModal() {
        const modal = document.querySelector('.prestige-modal');
        if (modal) {
            modal.remove();
        }
        
        // Удаляем обработчик Escape
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }
    
    executePrestige(prestigePoints, oldTheme) {
        console.log('[executePrestige] Выполнение престижа, очков:', prestigePoints);
        
        if (!this.currentUser || !this.state) {
            console.error('[executePrestige] Нет пользователя или состояния');
            return;
        }
        
        // Закрываем модальное окно
        this.closePrestigeModal();
        
        // Используем переданное количество очков престижа
        const actualPrestigePoints = prestigePoints || 1;
        
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
        
        // ✅ ИСПРАВЛЕНИЕ 1: Сохраняем ВСЕ данные достижений
        const oldAchievementsData = this.achievements ? [...this.achievements] : [];
        
        // Сохраняем дерево престижных улучшений
        const oldPrestigeTree = this.prestigeUpgradesTree ? [...this.prestigeUpgradesTree] : [];

        // Рассчитываем итоговый уровень престижа
        const newPrestige = oldPrestige + actualPrestigePoints;

        // Рассчитываем, сколько кредитов было потрачено на престижи
        let spentCredits = 0;
        let tempPrestige = oldPrestige;
        for (let i = 0; i < actualPrestigePoints; i++) {
            const baseRequiredCredits = 25000; // Changed from 10000 to 25000
            const prestigeMultiplier = Math.pow(1.1, tempPrestige); // Changed from 2.5 to 1.1
            const requiredCredits = Math.floor(baseRequiredCredits * prestigeMultiplier);
            spentCredits += requiredCredits;
            tempPrestige++;
        }

        // Создаем новое состояние игры
        const newState = this.getInitialState();
        
        // Восстанавливаем сохраненные данные
        newState.prestige = newPrestige;
        newState.prestigeMultiplier = 1 + (newPrestige * 0.1);
        newState.playTime = oldPlayTime;
        newState.totalClicks = oldTotalClicks;
        newState.totalEarned = oldTotalEarned;
        newState.maxCombo = oldMaxCombo;
        
        // ✅ ИСПРАВЛЕНИЕ 3: Ограничиваем шанс двойного клика 2.5%
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
        
        // ✅ ИСПРАВЛЕНИЕ 4: Восстанавливаем ВСЕ достижения полностью
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
            `Престиж выполнен! Получено ${actualPrestigePoints} очков престижа! ` +
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
    }
    
    determinePlanetTheme(prestige) {
        if (prestige >= 10) {
            return this.planetThemes.prestige10;
        } else if (prestige >= 5) {
            return this.planetThemes.prestige5;
        } else if (prestige >= 1) {
            return this.planetThemes.prestige1;
        } else {
            return this.planetThemes.default;
        }
    }
    
    updatePlanetTheme() {
        const prestige = this.state.prestige || 0;
        
        // Определяем тему планеты в зависимости от престижа
        if (prestige >= 10) {
            this.currentPlanetTheme = 'prestige10';
        } else if (prestige >= 5) {
            this.currentPlanetTheme = 'prestige5';
        } else if (prestige >= 1) {
            this.currentPlanetTheme = 'prestige1';
        } else {
            this.currentPlanetTheme = 'default';
        }
        
        // Обновляем внешний вид планеты
        this.updatePlanetAppearance();
    }
    
    updatePlanetAppearance() {
        const planetCore = document.querySelector('.planet-core');
        if (!planetCore) return;
        
        const theme = this.planetThemes[this.currentPlanetTheme];
        
        // Обновляем градиент планеты
        planetCore.style.background = `radial-gradient(circle at 30% 30%, ${theme.color1}, ${theme.color2}, ${theme.color3})`;
        
        // Обновляем тень
        planetCore.style.boxShadow = `
            inset 0 0 60px rgba(0, 0, 0, 0.9),
            0 0 100px ${this.hexToRgba(theme.color1, 0.8)},
            0 0 150px ${this.hexToRgba(theme.color3, 0.6)}
        `;
        
        // Добавляем текст с бонусом планеты
        let planetInfo = document.querySelector('.planet-info');
        if (!planetInfo) {
            planetInfo = document.createElement('div');
            planetInfo.className = 'planet-info';
            document.querySelector('.planet').appendChild(planetInfo);
        }
        
        planetInfo.innerHTML = `
            <div class="planet-name">${theme.name}</div>
            <div class="planet-boost">${theme.boostText}</div>
        `;
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    updatePrestigeButton() {
        if (!this.currentUser) return;
    
        const button = document.getElementById('prestige-button');
        if (!button) return;
    
        // Calculate how many prestige points the player can earn based on their credits
        const baseRequiredCredits = 25000; // Changed from 10000 to 25000
        let currentPrestige = this.state.prestige || 0;
        let possiblePrestigeGains = 0;
        let tempCredits = this.state.credits;
        
        // Calculate how many times we can prestige with current credits
        while (tempCredits >= baseRequiredCredits * Math.pow(1.1, currentPrestige + possiblePrestigeGains)) {
            const nextPrestigeCost = baseRequiredCredits * Math.pow(1.1, currentPrestige + possiblePrestigeGains);
            if (tempCredits >= nextPrestigeCost) {
                tempCredits -= nextPrestigeCost;
                possiblePrestigeGains++;
            } else {
                break;
            }
        }
        
        // At least 1 prestige point if we can afford the next one
        if (this.state.credits >= baseRequiredCredits * Math.pow(1.1, currentPrestige)) {
            possiblePrestigeGains = Math.max(1, possiblePrestigeGains);
        }
        
        const requiredCredits = Math.floor(baseRequiredCredits * Math.pow(1.1, currentPrestige));
        const canPrestige = this.state.credits >= requiredCredits;
    
        const requirementElement = document.getElementById('prestige-requirement');
        const gainElement = document.getElementById('prestige-gain');
    
        if (requirementElement) requirementElement.textContent = this.formatNumber(requiredCredits);
        if (gainElement) gainElement.textContent = possiblePrestigeGains > 0 ? possiblePrestigeGains : '0';
    
        if (canPrestige) {
            button.disabled = false;
            button.innerHTML = `
                <i class="fas fa-rocket"></i>
                <span>ВЫПОЛНИТЬ ПРЕСТИЖ (+${possiblePrestigeGains})</span>
                <small>Начать заново с бонусами престижа</small>
            `;
            button.title = `Нажмите для получения ${possiblePrestigeGains} очков престижа`;
        } else {
            button.disabled = true;
            button.innerHTML = `
                <i class="fas fa-rocket"></i>
                <span>ПРЕСТИЖ НЕДОСТУПЕН</span>
                <small>Требуется: ${this.formatNumber(requiredCredits)} кредитов</small>
            `;
            button.title = `Нужно ещё ${this.formatNumber(requiredCredits - this.state.credits)} кредитов`;
        }
    
        this.renderPrestigeBonuses();
    }
    
    renderPrestigeBonuses() {
        if (!this.currentUser) return;
    
        const container = document.getElementById('prestige-bonuses');
        if (!container) return;
    
        const bonuses = [
            { 
                icon: 'fas fa-coins', 
                text: `Множитель дохода: x${this.state.prestigeMultiplier.toFixed(2)}`,
                color: '#ffd700'
            },
            { 
                icon: 'fas fa-star', 
                text: `Очков престижа: ${this.state.prestige}`,
                color: '#ff00ff'
            },
            { 
                icon: 'fas fa-bolt', 
                text: 'Увеличивает доход от всех источников',
                color: '#00d4ff'
            },
            { 
                icon: 'fas fa-chart-line', 
                text: 'Следующий престиж дороже в 2.5 раза',
                color: '#9d4edd'
            }
        ];
    
        // Добавляем информацию о текущей планете
        const theme = this.planetThemes[this.currentPlanetTheme];
        if (theme && this.state.prestige > 0) {
            bonuses.push({
                icon: 'fas fa-globe',
                text: `Планета: ${theme.name} (${theme.boostText})`,
                color: theme.color1
            });
        }
    
        if (this.state.doubleClickChance && this.state.doubleClickChance > 0) {
            bonuses.push({
                icon: 'fas fa-clone',
                text: `Шанс двойного клика: ${(this.state.doubleClickChance * 100).toFixed(1)}%`,
                color: '#00ff9d'
            });
        }
    
        if (this.state.energySavePercent && this.state.energySavePercent > 0) {
            bonuses.push({
                icon: 'fas fa-infinity',
                text: `Сохранение энергии: ${(this.state.energySavePercent * 100).toFixed(1)}%`,
                color: '#ff9500'
            });
        }
    
        container.innerHTML = bonuses.map(bonus => `
            <div class="bonus-item">
                <i class="${bonus.icon}" style="color: ${bonus.color}"></i>
                <span>${bonus.text}</span>
            </div>
        `).join('');
    }
    
    startGameLoop() {
        console.log('[startGameLoop] Запуск игрового цикла...');
        
        setInterval(() => {
            if (!this.currentUser) return;
            this.gameTick();
        }, 1000);
        
        setInterval(() => {
            if (!this.currentUser) return;
            this.renderEnergy();
            this.updateComboDisplay();
            this.updateBoosts();
        }, 100);
        
        console.log('[startGameLoop] Игровой цикл запущен');
    }
    
    gameTick() {
        if (!this.currentUser) return;
    
        this.updateBoosts();
    
        // Обновление энергии
        if (this.state.energy < this.state.maxEnergy) {
            this.state.energy = Math.min(this.state.energy + this.state.energyRegen, this.state.maxEnergy);
            this.renderEnergy();
        }
    
        // Автоматический доход
        if (this.state.autoIncome > 0) {
            let autoMultiplier = this.state.prestigeMultiplier * this.state.autoBoost;
            
            // Добавляем бонус от планеты если есть
            const planetTheme = this.planetThemes[this.currentPlanetTheme];
            if (planetTheme && planetTheme.incomeBonus) {
                autoMultiplier *= (1 + planetTheme.incomeBonus);
            }
            
            const autoEarned = this.state.autoIncome * autoMultiplier;
            this.state.credits += autoEarned;
            this.state.totalEarned += autoEarned;
            this.renderResources();
        }
    
        this.state.playTime++;
        this.state.lastPlayed = new Date().toISOString();
    
        // Обновляем таймер каждую секунду
        if (Date.now() - this.lastTimeUpdate > 1000) {
            this.updateTimeDisplay();
            this.lastTimeUpdate = Date.now();
        }
    
        // Обновляем престиж кнопку только если есть изменения
        this.updatePrestigeButton();
    
        console.log('[gameTick] Игровой цикл выполнен');
    }
    
    updateComboDisplay() {
        const now = Date.now();
        if (now - this.state.comboTime > this.state.comboTimeout) {
            this.state.combo = Math.max(1, this.state.combo - 0.05);
        }
        
        this.renderCombo();
    }
    
    updateLeftPanel() {
        if (!this.currentUser) return;
        
        console.log('[updateLeftPanel] Обновление левой панели...');
        
        // Обновляем силу клика
        const clickPowerElement = document.getElementById('left-click-power');
        if (clickPowerElement) {
            clickPowerElement.textContent = this.formatNumber(this.state.clickPower);
        }
        
        // Обновляем шанс двойного клика (ограниченный 2.5%)
        const doubleChanceElement = document.getElementById('left-double-chance');
        if (doubleChanceElement) {
            // Общий шанс = базовый шанс + бонус от престижа (0.1% за каждый престиж, макс 2.5%)
            const baseChance = this.state.doubleClickChance || 0;
            const prestigeBonus = Math.min((this.state.prestige || 0) * 0.001, 0.025);
            const totalChance = Math.min(baseChance + prestigeBonus, 0.025);
            doubleChanceElement.querySelector('span').textContent = `${(totalChance * 100).toFixed(1)}%`;
        }
        
        // Обновляем авто-доход
        const autoIncomeElement = document.getElementById('left-auto-income');
        if (autoIncomeElement) {
            autoIncomeElement.querySelector('span').textContent = this.formatNumber(this.state.autoIncome);
        }
        
        // Обновляем регенерацию энергии
        const energyRegenElement = document.getElementById('left-energy-regen');
        if (energyRegenElement) {
            energyRegenElement.querySelector('span').textContent = (this.state.energyRegen || 1).toFixed(1);
        }
        
        // Обновляем активные бусты
        const boostsContainer = document.getElementById('left-active-boosts');
        if (boostsContainer) {
            let boostsHTML = '';
            const now = Date.now();
            let activeCount = 0;
            
            // Проверяем активные бусты из магазина
            for (const boostKey in this.state.shopActiveBoosts) {
                const boost = this.state.shopActiveBoosts[boostKey];
                if (boost.expires > now && activeCount < 5) {
                    const remaining = Math.ceil((boost.expires - now) / 1000);
                    const progress = Math.max(0, ((boost.duration - remaining) / boost.duration) * 100);
                    
                    let borderColor = 'var(--neon-blue)';
                    switch(boost.type) {
                        case 'temporaryMultiplier':
                            borderColor = 'var(--warning-red)';
                            break;
                        case 'autoBoost':
                            borderColor = 'var(--mineral-green)';
                            break;
                        case 'mineralBoost':
                            borderColor = 'var(--neon-purple)';
                            break;
                        case 'comboBoost':
                            borderColor = '#ff9500';
                            break;
                    }
                    
                    boostsHTML += `
                        <div class="left-boost-item" style="border-left-color: ${borderColor}">
                            <i class="${boost.icon}" style="color: ${borderColor}"></i>
                            <div class="boost-info">
                                <div class="boost-name">${boost.name}</div>
                                <div class="boost-timer">${remaining}с</div>
                            </div>
                            <div class="boost-multiplier">x${boost.multiplier}</div>
                        </div>
                    `;
                    activeCount++;
                }
            }
            
            // Проверяем золотые клики
            if (this.state.goldenClicks > 0 && activeCount < 5) {
                boostsHTML += `
                    <div class="left-boost-item golden-boost">
                        <i class="fas fa-medal"></i>
                        <div class="boost-info">
                            <div class="boost-name">Золотые клики</div>
                            <div class="boost-timer">${this.state.goldenClicks} кликов</div>
                        </div>
                        <div class="boost-multiplier">x${this.state.goldenMultiplier}</div>
                    </div>
                `;
                activeCount++;
            }
            
            // Проверяем временный множитель
            if (this.state.tempClickMultiplier > 1 && this.state.activeBoosts.tempClickMultiplier && 
                this.state.activeBoosts.tempClickMultiplier.expires > now && activeCount < 5) {
                const remaining = Math.ceil((this.state.activeBoosts.tempClickMultiplier.expires - now) / 1000);
                boostsHTML += `
                    <div class="left-boost-item click-boost">
                        <i class="fas fa-bolt"></i>
                        <div class="boost-info">
                            <div class="boost-name">Усиление клика</div>
                            <div class="boost-timer">${remaining}с</div>
                        </div>
                        <div class="boost-multiplier">x${this.state.tempClickMultiplier}</div>
                    </div>
                `;
                activeCount++;
            }
            
            // Проверяем буст автодохода
            if (this.state.autoBoost > 1 && this.state.activeBoosts.autoBoost && 
                this.state.activeBoosts.autoBoost.expires > now && activeCount < 5) {
                const remaining = Math.ceil((this.state.activeBoosts.autoBoost.expires - now) / 1000);
                boostsHTML += `
                    <div class="left-boost-item auto-boost">
                        <i class="fas fa-rocket"></i>
                        <div class="boost-info">
                            <div class="boost-name">Усиление автодохода</div>
                            <div class="boost-timer">${remaining}с</div>
                        </div>
                        <div class="boost-multiplier">x${this.state.autoBoost}</div>
                    </div>
                `;
                activeCount++;
            }
            
            if (activeCount === 0) {
                boostsHTML = '<div class="no-boosts">Нет активных бустов</div>';
            }
            
            boostsContainer.innerHTML = boostsHTML;
        }
        
        console.log('[updateLeftPanel] Левая панель обновлена');
    }

    updateTimeDisplay() {
        if (!this.currentUser) return;
        
        const hours = Math.floor(this.state.playTime / 3600);
        const minutes = Math.floor((this.state.playTime % 3600) / 60);
        const seconds = this.state.playTime % 60;
        
        const timeElement = document.getElementById('play-time-stat');
        if (timeElement) {
            timeElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    // ===== НОВЫЕ ФУНКЦИИ: АКТИВНЫЕ БУСТЫ И УЛУЧШЕННЫЕ ДОСТИЖЕНИЯ =====
    
    renderActiveBoosts() {
        if (!this.currentUser) return;
        
        // Находим или создаем секцию активных бустов
        let boostsSection = document.querySelector('.active-boosts-section');
        const shopSection = document.getElementById('shop-section');
        
        if (!boostsSection && shopSection) {
            boostsSection = document.createElement('div');
            boostsSection.className = 'active-boosts-section';
            boostsSection.innerHTML = `
                <h3><i class="fas fa-bolt"></i> Активные бусты</h3>
                <div class="active-boosts-grid" id="active-boosts-grid">
                    <!-- Активные бусты будут здесь -->
                </div>
            `;
            shopSection.appendChild(boostsSection);
        }
        
        if (!boostsSection) return;
        
        const container = document.getElementById('active-boosts-grid');
        if (!container) return;
        
        const now = Date.now();
        let activeBoosts = [];
        
        // Проверяем бусты из магазина
        for (const boostKey in this.state.shopActiveBoosts) {
            const boost = this.state.shopActiveBoosts[boostKey];
            if (boost.expires > now) {
                const remaining = Math.ceil((boost.expires - now) / 1000);
                const progress = Math.max(0, ((boost.duration - remaining) / boost.duration) * 100);
                
                activeBoosts.push({
                    name: boost.name,
                    icon: boost.icon,
                    multiplier: boost.multiplier,
                    remaining: remaining,
                    progress: progress,
                    type: boost.type
                });
            }
        }
        
        // Проверяем золотые клики
        if (this.state.goldenClicks > 0) {
            activeBoosts.push({
                name: 'Золотые клики',
                icon: 'fas fa-medal',
                multiplier: this.state.goldenMultiplier,
                remaining: this.state.goldenClicks,
                progress: 0,
                type: 'goldenClicks'
            });
        }
        
        if (activeBoosts.length === 0) {
            container.innerHTML = `
                <div class="active-boost-item" style="justify-content: center; opacity: 0.7;">
                    <div class="active-boost-icon">
                        <i class="fas fa-ban"></i>
                    </div>
                    <div class="active-boost-info">
                        <div class="active-boost-name">Нет активных бустов</div>
                        <div class="active-boost-duration">Купите бусты в магазине</div>
                    </div>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        activeBoosts.forEach(boost => {
            let durationText = '';
            let borderColor = 'var(--neon-blue)';
            
            if (boost.type === 'goldenClicks') {
                durationText = `Осталось кликов: ${boost.remaining}`;
                borderColor = 'var(--energy-yellow)';
            } else {
                durationText = `Осталось: ${boost.remaining}сек`;
                
                // Разные цвета для разных типов бустов
                switch(boost.type) {
                    case 'temporaryMultiplier':
                        borderColor = 'var(--warning-red)';
                        break;
                    case 'autoBoost':
                        borderColor = 'var(--mineral-green)';
                        break;
                    case 'mineralBoost':
                        borderColor = 'var(--neon-purple)';
                        break;
                    case 'comboBoost':
                        borderColor = '#ff9500';
                        break;
                }
            }
            
            html += `
                <div class="active-boost-item" style="border-color: ${borderColor}">
                    <div class="active-boost-icon" style="color: ${borderColor}">
                        <i class="${boost.icon}"></i>
                    </div>
                    <div class="active-boost-info">
                        <div class="active-boost-name">${boost.name}</div>
                        <div class="active-boost-duration">${durationText}</div>
                        ${boost.type !== 'goldenClicks' ? `
                            <div class="active-boost-timer">
                                <div class="active-boost-progress" style="width: ${boost.progress}%"></div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="active-boost-multiplier">
                        x${boost.multiplier}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // ===== РЕНДЕРИНГ =====
    
    renderAll() {
        if (!this.currentUser) return;
        
        console.log('[renderAll] Рендеринг всех элементов...');
        this.renderResources();
        this.updateStatsDisplay();
        this.renderCombo();
        this.renderEnergy();
        this.updatePrestigeButton();
        this.renderPrestigeBonuses();
        this.renderShop();
        this.renderAchievements();
        this.renderStatsSection();
        this.renderUpgrades();
        this.renderActiveBoosts();
        
        // ✅ ВАЖНО: Добавляем обновление левой панели
        this.updateLeftPanel();
        
        console.log('[renderAll] Все элементы отрендерены');
    }
    
    renderResources() {
        if (!this.currentUser) return;
        
        console.log('[renderResources] Рендеринг ресурсов...');
        
        const creditsElement = document.getElementById('credits-value');
        const mineralsElement = document.getElementById('minerals-value');
        const prestigeElement = document.getElementById('prestige-value');
        const autoIncomeElement = document.getElementById('auto-income-value');
        
        if (creditsElement) {
            creditsElement.textContent = this.formatNumber(this.state.credits);
            console.log('[renderResources] Кредиты установлены:', this.formatNumber(this.state.credits));
        }
        if (mineralsElement) {
            mineralsElement.textContent = this.formatNumber(this.state.minerals);
            console.log('[renderResources] Минералы установлены:', this.formatNumber(this.state.minerals));
        }
        if (prestigeElement) {
            prestigeElement.textContent = this.state.prestige;
            console.log('[renderResources] Престиж установлен:', this.state.prestige);
        }
        if (autoIncomeElement) {
            // Учитываем бонус от планеты
            let autoMultiplier = this.state.autoBoost;
            const planetTheme = this.planetThemes[this.currentPlanetTheme];
            if (planetTheme && planetTheme.incomeBonus) {
                autoMultiplier *= (1 + planetTheme.incomeBonus);
            }
            autoIncomeElement.textContent = this.formatNumber(this.state.autoIncome * autoMultiplier);
            console.log('[renderResources] Автодоход установлен:', this.formatNumber(this.state.autoIncome * autoMultiplier));
        }
    }
    
    updateStatsDisplay() {
        if (!this.currentUser) return;
        
        console.log('[updateStatsDisplay] Обновление статистики...');
        
        const clickPowerElement = document.getElementById('click-power-value');
        const maxEnergyElement = document.getElementById('max-energy-value');
        const totalClicksElement = document.getElementById('total-clicks-value');
        
        if (clickPowerElement) {
            clickPowerElement.textContent = this.formatNumber(this.state.clickPower);
            console.log('[updateStatsDisplay] Сила клика установлена:', this.formatNumber(this.state.clickPower));
        }
        if (maxEnergyElement) {
            maxEnergyElement.textContent = this.formatNumber(this.state.maxEnergy);
            console.log('[updateStatsDisplay] Макс. энергия установлена:', this.formatNumber(this.state.maxEnergy));
        }
        if (totalClicksElement) {
            totalClicksElement.textContent = this.formatNumber(this.state.totalClicks);
            console.log('[updateStatsDisplay] Всего кликов установлено:', this.formatNumber(this.state.totalClicks));
        }
    }
    
    renderEnergy() {
        if (!this.currentUser) return;
        
        const energyPercent = (this.state.energy / this.state.maxEnergy) * 100;
        const energyValueElement = document.getElementById('energy-value');
        
        if (energyValueElement) {
            energyValueElement.textContent = 
                `${Math.floor(this.state.energy)}/${this.state.maxEnergy}`;
        }
        
        const energyBar = document.getElementById('energy-bar');
        if (energyBar) {
            energyBar.style.width = `${energyPercent}%`;
        }
    }
    
    renderCombo() {
        if (!this.currentUser) return;
        
        const comboDisplayElement = document.getElementById('combo-display');
        const comboFillElement = document.getElementById('combo-fill');
        
        if (comboDisplayElement) {
            comboDisplayElement.textContent = `x${this.state.combo.toFixed(1)}`;
        }
        if (comboFillElement) {
            const comboPercent = ((this.state.combo - 1) / 4) * 100;
            comboFillElement.style.width = `${comboPercent}%`;
        }
    }
    
    renderUpgrades() {
        if (!this.currentUser) return;
        
        console.log('[renderUpgrades] Рендеринг дерева улучшений...');
        const container = document.getElementById('tree-container');
        
        if (!container) {
            console.error('[renderUpgrades] Контейнер дерева не найден');
            return;
        }
        
        // Объединяем обычные и престижные улучшения
        let allUpgrades = [...this.upgradesTree];
        if (this.prestigeUpgradesTree && this.prestigeUpgradesTree.length > 0) {
            console.log('[renderUpgrades] Добавляем престижные улучшения:', this.prestigeUpgradesTree.length);
            
            // Показываем все престижные улучшения всегда, независимо от количества престижных очков
            const visiblePrestigeUpgrades = this.prestigeUpgradesTree.filter(upgrade => 
                true  // Always include all prestige upgrades
            );
            console.log('[renderUpgrades] Видимых престижных улучшений:', visiblePrestigeUpgrades.length);
            
            allUpgrades = [...allUpgrades, ...visiblePrestigeUpgrades];
        }
        
        if (!Array.isArray(allUpgrades)) {
            console.error('[renderUpgrades] upgradesTree не является массивом! Переинициализация...');
            this.initGameData();
            return;
        }
        
        console.log('[renderUpgrades] Всего улучшений для отображения:', allUpgrades.length);
        
        let html = `
            <div class="tree-controls">
                <div class="tree-info desktop-only">
                    <i class="fas fa-info-circle"></i>
                    <span>Перетащите для перемещения, колесико для зума, двойной клик для сброса</span>
                </div>
                <div class="tree-stats">
                    <div class="tree-stat">
                        <i class="fas fa-sitemap"></i>
                        <span>Улучшений куплено: ${Object.keys(this.state.upgrades).length}</span>
                    </div>
                    <div class="tree-stat">
                        <i class="fas fa-bolt"></i>
                        <span>Мощность клика: ${this.state.clickPower}</span>
                    </div>
                    <div class="tree-stat">
                        <i class="fas fa-robot"></i>
                        <span>Автоматический доход: ${this.state.autoIncome} в секунду</span>
                    </div>
                    <div class="tree-stat">
                        <i class="fas fa-coins"></i>
                        <span>Кредитов: ${this.formatNumber(this.state.credits)}</span>
                    </div>
                    <div class="tree-stat">
                        <i class="fas fa-gem"></i>
                        <span>Минералов: ${this.formatNumber(this.state.minerals)}</span>
                    </div>
                    ${this.state.prestige > 0 ? `
                    <div class="tree-stat">
                        <i class="fas fa-star"></i>
                        <span>Престиж: ${this.state.prestige} (x${this.state.prestigeMultiplier.toFixed(2)})</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="upgrade-tree" style="transform: translate(${this.state.treeOffsetX}px, ${this.state.treeOffsetY}px) scale(${this.state.treeZoom || 1})">
                <svg class="upgrade-connections" width="2000" height="2000">
        `;
        
        // Рисуем соединения для обычных улучшений
        for (const upgrade of this.upgradesTree) {
            if (upgrade.connections && upgrade.connections.length > 0) {
                const startX = upgrade.position.x + 1000;
                const startY = upgrade.position.y + 500;
                
                for (const targetId of upgrade.connections) {
                    const target = this.upgradesTree.find(u => u.id === targetId);
                    if (target) {
                        const endX = target.position.x + 1000;
                        const endY = target.position.y + 500;
                        
                        const isActive = this.isConnectionActive(upgrade.id, targetId);
                        const connectionClass = isActive ? 'active' : 'inactive';
                        
                        html += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" 
                                class="upgrade-connection ${connectionClass}"/>`;
                    }
                }
            }
        }
        
        // Рисуем соединения для престижных улучшений
        if (this.prestigeUpgradesTree && this.prestigeUpgradesTree.length > 0) {
            for (const upgrade of this.prestigeUpgradesTree) {
                // Показываем соединения только если улучшение видимо
                if (upgrade.connections && upgrade.connections.length > 0 && 
                    (upgrade.unlocked || this.state.prestige >= 1)) {
                    const startX = upgrade.position.x + 1000;
                    const startY = upgrade.position.y + 500;
                    
                    for (const targetId of upgrade.connections) {
                        const target = this.prestigeUpgradesTree.find(u => u.id === targetId);
                        if (target && (target.unlocked || this.state.prestige >= 1)) {
                            const endX = target.position.x + 1000;
                            const endY = target.position.y + 500;
                            
                            const isActive = this.isPrestigeConnectionActive(upgrade.id, targetId);
                            const connectionClass = isActive ? 'active prestige-connection' : 'inactive';
                            
                            html += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" 
                                    class="upgrade-connection ${connectionClass}"/>`;
                        }
                    }
                }
            }
        }
        
        html += '</svg>';
        
        // Рисуем узлы улучшений
        for (const upgrade of allUpgrades) {
            // Пропускаем скрытые улучшения
            if (upgrade.id !== 'start' && !this.isUpgradeVisible(upgrade)) {
                continue;
            }
            
            let currentLevel = 0;
            let price = 0;
            let mineralsPrice = 0;
            let creditsPrice = 0;
            let maxed = false;
            let canBuy = false;
            let currencyIcon = 'fas fa-coins';
            let currencyColor = 'var(--energy-yellow)';
            let nodeClass = 'upgrade-node';
            let buttonText = '';
            let priceDisplay = '';
            
            // Определяем тип улучшения
            const isPrestigeUpgrade = upgrade.currency === 'prestige';
            const isMixedCurrency = upgrade.currency === 'mixed';
            
            if (isPrestigeUpgrade) {
                // Престижное улучшение
                currentLevel = this.state.prestigeUpgrades?.[upgrade.id] || 0;
                price = upgrade.basePrice > 0 ? 
                    Math.floor(upgrade.basePrice * Math.pow(upgrade.priceMultiplier, currentLevel)) : 0;
                maxed = currentLevel >= upgrade.maxLevel;
                
                // Проверяем возможность покупки престижного улучшения
                canBuy = this.state.prestige >= price && 
                         upgrade.unlocked && 
                         !maxed;
                
                currencyIcon = 'fas fa-star';
                currencyColor = '#ff00ff';
                nodeClass += ' prestige-upgrade-node';
                priceDisplay = `${price} очков престижа`;
                
            } else if (isMixedCurrency) {
                // Улучшение со смешанной ценой
                currentLevel = this.state.upgrades[upgrade.id] || 0;
                const prices = this.calculateUpgradePrice(upgrade, currentLevel);
                creditsPrice = prices.credits;
                mineralsPrice = prices.minerals;
                maxed = currentLevel >= upgrade.maxLevel;
                
                // Проверяем возможность покупки
                canBuy = this.state.credits >= creditsPrice && 
                         this.state.minerals >= mineralsPrice && 
                         upgrade.unlocked && 
                         !maxed;
                
                currencyIcon = 'fas fa-coins';
                currencyColor = 'var(--neon-blue)';
                nodeClass += ' mixed-currency-node';
                priceDisplay = `${creditsPrice} кредитов + ${mineralsPrice} минералов`;
                
            } else {
                // Обычное улучшение
                currentLevel = this.state.upgrades[upgrade.id] || 0;
                price = upgrade.basePrice > 0 ? this.calculateUpgradePrice(upgrade, currentLevel) : 0;
                maxed = currentLevel >= upgrade.maxLevel;
                
                // Проверяем валюту
                if (upgrade.currency === 'minerals') {
                    canBuy = this.state.minerals >= price && upgrade.unlocked && !maxed;
                    currencyIcon = 'fas fa-gem';
                    currencyColor = 'var(--mineral-green)';
                    priceDisplay = `${price} минералов`;
                } else {
                    canBuy = this.state.credits >= price && upgrade.unlocked && !maxed;
                    currencyIcon = 'fas fa-coins';
                    currencyColor = 'var(--energy-yellow)';
                    priceDisplay = `${price} кредитов`;
                }
            }
            
            // Определяем классы для разных состояний
            if (maxed) nodeClass += ' maxed';
            if (!upgrade.unlocked) nodeClass += ' locked';
            if (currentLevel > 0) nodeClass += ' purchased';
            if (upgrade.id === 'start') nodeClass += ' start-node';
            
            // Добавляем класс ветки для стилизации
            if (upgrade.branch) {
                nodeClass += ` ${upgrade.branch}-branch`;
            }
            
            const x = upgrade.position.x + 1000;
            const y = upgrade.position.y + 500;
            
            // Текст для кнопки
            if (upgrade.id === 'start' && currentLevel === 0) {
                buttonText = 'НАЧАТЬ ИГРУ!';
            } else if (maxed) {
                buttonText = 'МАКС';
            } else if (canBuy) {
                buttonText = 'КУПИТЬ';
            } else if (!upgrade.unlocked) {
                buttonText = 'ЗАБЛОКИРОВАНО';
            } else {
                buttonText = 'НЕДОСТУПНО';
            }
            
            // Определяем обработчик клика
            let onclickHandler = '';
            if (canBuy && !maxed) {
                if (isPrestigeUpgrade) {
                    onclickHandler = `window.game.buyPrestigeUpgrade('${upgrade.id}')`;
                } else {
                    onclickHandler = `window.game.buyUpgrade('${upgrade.id}')`;
                }
            }
            
            html += `
                <div class="${nodeClass}" style="left: ${x}px; top: ${y}px;"
                     onclick="${onclickHandler}"
                     ontouchstart="event.preventDefault(); ${onclickHandler}">
                    <div class="upgrade-icon-wrapper">
                        <div class="upgrade-icon">
                            <i class="${upgrade.icon}"></i>
                        </div>
                        ${currentLevel > 0 ? `<div class="upgrade-level-badge">${currentLevel}/${upgrade.maxLevel}</div>` : ''}
                    </div>
                    <div class="upgrade-tooltip">
                        <div class="upgrade-name">${upgrade.name}</div>
                        <div class="upgrade-description">${upgrade.description}</div>
                        ${upgrade.id !== 'start' || currentLevel === 0 ? `
                            ${maxed ? 
                                '<div class="upgrade-status maxed">МАКСИМАЛЬНЫЙ УРОВЕНЬ</div>' :
                                `<div class="upgrade-price" style="color: ${currencyColor}">
                                    <i class="${currencyIcon}"></i> ${priceDisplay}
                                </div>`
                            }
                            <div class="upgrade-status ${canBuy ? 'available' : 'unavailable'}">
                                ${buttonText}
                            </div>
                        ` : `
                            <div class="upgrade-status available">
                                ИГРАЕТСЯ
                            </div>
                        `}
                        ${upgrade.requirements && upgrade.requirements.length > 0 ? `
                            <div class="upgrade-requirements">
                                <div class="requirements-title">Требования:</div>
                                ${upgrade.requirements.map(requirement => {
                                    if (requirement.type === 'prestige') {
                                        const hasPrestige = this.state.prestige || 0;
                                        const met = hasPrestige >= requirement.value;
                                        return `
                                            <div class="requirement ${met ? 'met' : 'not-met'}">
                                                Престиж: ${hasPrestige}/${requirement.value}
                                            </div>
                                        `;
                                    } else if (requirement.id) {
                                        const reqUpgrade = this.upgradesTree.find(u => u.id === requirement.id) || 
                                                          this.prestigeUpgradesTree?.find(u => u.id === requirement.id);
                                        let hasLevel = 0;
                                        
                                        if (requirement.id.startsWith('prestige_')) {
                                            hasLevel = this.state.prestigeUpgrades?.[requirement.id] || 0;
                                        } else {
                                            hasLevel = this.state.upgrades[requirement.id] || 0;
                                        }
                                        
                                        const met = hasLevel >= requirement.level;
                                        return `
                                            <div class="requirement ${met ? 'met' : 'not-met'}">
                                                ${reqUpgrade?.name || requirement.id}: ${hasLevel}/${requirement.level}
                                            </div>
                                        `;
                                    }
                                    return '';
                                }).join('')}
                            </div>
                        ` : ''}
                        ${currentLevel > 0 && !maxed ? `
                            <div class="upgrade-effect">
                                <i class="fas fa-chart-line"></i>
                                <span>Текущий уровень: ${currentLevel}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
        console.log('[renderUpgrades] Дерево отрисовано');
    }
    
    isConnectionActive(sourceId, targetId) {
        const source = this.upgradesTree.find(u => u.id === sourceId);
        const target = this.upgradesTree.find(u => u.id === targetId);
        
        if (!source || !target) return false;
        
        // Соединение активно, если источник куплен или цель разблокирована
        const sourcePurchased = (this.state.upgrades[sourceId] || 0) > 0;
        const targetUnlocked = target.unlocked;
        
        return sourcePurchased && targetUnlocked;
    }
    
    isPrestigeConnectionActive(sourceId, targetId) {
        const source = this.prestigeUpgradesTree.find(u => u.id === sourceId);
        const target = this.prestigeUpgradesTree.find(u => u.id === targetId);
        
        if (!source || !target) return false;
        
        // Соединение активно, если источник куплен или цель разблокирована
        const sourcePurchased = (this.state.prestigeUpgrades?.[sourceId] || 0) > 0;
        const targetUnlocked = target.unlocked;
        
        return sourcePurchased && targetUnlocked;
    }
    
    isUpgradeVisible(upgrade) {
        // "Начальная база" всегда видна
        if (upgrade.id === 'start') return true;
        
        // Если улучшение куплено - видно
        if (upgrade.id.startsWith('prestige_')) {
            if (this.state.prestigeUpgrades?.[upgrade.id] > 0) return true;
        } else if (this.state.upgrades[upgrade.id] > 0) {
            return true;
        }
        
        // Если улучшение разблокировано - видно
        if (upgrade.unlocked) return true;
        
        // ✅ ИСПРАВЛЕНИЕ 9: Престижные улучшения видны если есть престиж
        if (upgrade.id.startsWith('prestige_') && this.state.prestige >= 1) {
            return true;
        }
        
        // Проверяем, есть ли купленное улучшение в цепочке до этого
        if (upgrade.requirements && upgrade.requirements.length > 0) {
            for (const requirement of upgrade.requirements) {
                let reqUpgrade;
                if (requirement.id && requirement.id.startsWith('prestige_')) {
                    reqUpgrade = this.prestigeUpgradesTree.find(u => u.id === requirement.id);
                } else if (requirement.id) {
                    reqUpgrade = this.upgradesTree.find(u => u.id === requirement.id);
                }
                if (reqUpgrade && this.isUpgradeVisible(reqUpgrade)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    renderShop(force = false) {
        if (!this.currentUser) return;
    
        // Защита от слишком частых обновлений
        const now = Date.now();
        if (!force && this.lastShopRender && (now - this.lastShopRender < 1000)) {
            return;
        }
        this.lastShopRender = now;
    
        console.log('[renderShop] Рендеринг магазина...');
        const container = document.getElementById('shop-grid');
        if (!container) {
            console.error('[renderShop] Контейнер магазина не найден');
            return;
        }
    
        let html = '';
    
        for (const item of this.shopItems) {
            const cooldown = this.state.shopCooldowns?.[item.id];
            const onCooldown = cooldown && cooldown > Date.now();
            const canBuy = this.state.credits >= item.price && !onCooldown;
            
            // Проверяем активные бусты для отображения таймера
            let activeBoostInfo = '';
            const activeBoost = this.state.activeBoosts[item.effect.type === 'temporaryMultiplier' ? 'tempClickMultiplier' : 
                                                       item.effect.type === 'autoBoost' ? 'autoBoost' :
                                                       item.effect.type === 'mineralBoost' ? 'mineralBoost' :
                                                       item.effect.type === 'comboBoost' ? 'comboBoost' : null];
            
            if (activeBoost && activeBoost.expires > Date.now() && item.duration > 0) {
                const remaining = Math.ceil((activeBoost.expires - Date.now()) / 1000);
                const progressPercent = Math.max(0, ((item.duration - remaining) / item.duration) * 100);
                
                activeBoostInfo = `
                    <div class="shop-item-timer">
                        <div class="timer-progress" style="width: ${progressPercent}%"></div>
                        <span>Осталось: ${remaining}сек</span>
                    </div>
                `;
            }
        
            let cooldownHtml = '';
            if (onCooldown) {
                const remaining = Math.ceil((cooldown - Date.now()) / 1000);
                const totalCooldown = item.cooldown;
                const progressPercent = Math.max(0, ((totalCooldown - remaining) / totalCooldown) * 100);
            
                cooldownHtml = `
                    <div class="shop-item-cooldown" data-item-id="${item.id}">
                        <div class="cooldown-progress" style="width: ${progressPercent}%"></div>
                        <span>Перезарядка: ${remaining}сек</span>
                    </div>
                `;
            }
        
            const buttonHtml = onCooldown ? '' : `
                <div class="shop-item-effect ${canBuy ? 'available' : 'unavailable'}">
                    ${canBuy ? 
                        '<i class="fas fa-cart-plus"></i> Купить' : 
                        '<i class="fas fa-lock"></i> Недостаточно средств'
                    }
                </div>
            `;
        
            html += `
                <div class="shop-item ${!canBuy && !onCooldown ? 'locked' : ''}" 
                    data-item-id="${item.id}"
                    onclick="${canBuy && !onCooldown ? `window.game.buyShopItem('${item.id}')` : ''}">
                    <div class="shop-item-icon">
                        <i class="${item.icon}"></i>
                        ${item.animation ? `<div class="shop-item-animation ${item.animation}"></div>` : ''}
                    </div>
                    <div class="shop-item-name">${item.name}</div>
                    <div class="shop-item-description">${item.description}</div>
                    ${item.duration > 0 ? `<div class="shop-item-duration">Длительность: ${item.duration}сек</div>` : ''}
                    <div class="shop-item-price">
                        <i class="fas fa-coins"></i>
                        ${this.formatNumber(item.price)}
                    </div>
                    ${activeBoostInfo}
                    ${cooldownHtml}
                    ${buttonHtml}
                </div>
            `;
        }
    
        container.innerHTML = html;
        console.log('[renderShop] Магазин отрисован');
    }
    
    createShopAnimation(item) {
        const animationContainer = document.createElement('div');
        animationContainer.className = `shop-animation ${item.animation}`;
        
        switch(item.animation) {
            case 'energy-drink':
                animationContainer.innerHTML = '<div class="energy-wave"></div>';
                break;
            case 'explosion':
                animationContainer.innerHTML = '<div class="explosion-effect"></div>';
                break;
            case 'golden-hands':
                animationContainer.innerHTML = '<div class="golden-sparkles"></div>';
                break;
            case 'rocket-boost':
                animationContainer.innerHTML = '<div class="rocket-trail"></div>';
                break;
            case 'crystal-luck':
                animationContainer.innerHTML = '<div class="crystal-shards"></div>';
                break;
            case 'combo-stimulator':
                animationContainer.innerHTML = '<div class="combo-waves"></div>';
                break;
        }
        
        document.body.appendChild(animationContainer);
        
        setTimeout(() => {
            animationContainer.remove();
        }, 2000);
    }
    
    renderAchievements() {
        if (!this.currentUser) return;
        
        console.log('[renderAchievements] Рендеринг достижений...');
        const container = document.getElementById('achievements-grid');
        if (!container) {
            console.error('[renderAchievements] Контейнер достижений не найден');
            return;
        }
        
        let html = '';
        let unlockedCount = 0;
        let collectedCount = 0;
        
        for (const achievement of this.achievements) {
            if (achievement.unlocked) {
                unlockedCount++;
                if (achievement.rewardCollected) {
                    collectedCount++;
                }
            }
            
            // Определяем прогресс
            let progressText = '';
            let progressValue = 0;
            let progressMax = 0;
            
            switch(achievement.condition.type) {
                case 'clicks':
                    progressValue = this.state.totalClicks || 0;
                    progressMax = achievement.condition.value;
                    break;
                case 'totalCredits':
                    progressValue = this.state.totalEarned || 0;
                    progressMax = achievement.condition.value;
                    break;
                case 'autoIncome':
                    progressValue = this.state.autoIncome || 0;
                    progressMax = achievement.condition.value;
                    break;
                case 'minerals':
                    progressValue = this.state.minerals || 0;
                    progressMax = achievement.condition.value;
                    break;
                case 'maxEnergy':
                    progressValue = this.state.maxEnergy || 0;
                    progressMax = achievement.condition.value;
                    break;
                case 'totalUpgrades':
                    progressValue = Object.keys(this.state.upgrades || {}).length;
                    progressMax = achievement.condition.value;
                    break;
                case 'maxCombo':
                    progressValue = this.state.maxCombo || 1;
                    progressMax = achievement.condition.value;
                    break;
                case 'prestige':
                    progressValue = this.state.prestige || 0;
                    progressMax = achievement.condition.value;
                    break;
            }
            
            const progressPercent = Math.min(100, (progressValue / progressMax) * 100);
            
            let rewardHtml = '';
            if (achievement.unlocked) {
                if (achievement.rewardCollected) {
                    rewardHtml = `
                        <div class="reward-collected">
                            <i class="fas fa-check-circle"></i> Награда получена
                        </div>
                    `;
                } else {
                    // Создаем описание награды
                    let rewardDescription = '';
                    const reward = achievement.reward;
                    
                    if (reward.credits) rewardDescription += `<i class="fas fa-coins"></i> ${reward.credits} кредитов `;
                    if (reward.clickPower) rewardDescription += `<i class="fas fa-hammer"></i> +${reward.clickPower} к силе `;
                    if (reward.autoIncome) rewardDescription += `<i class="fas fa-robot"></i> +${reward.autoIncome} авто-дохода `;
                    if (reward.mineralMultiplier) rewardDescription += `<i class="fas fa-gem"></i> x${reward.mineralMultiplier} минералов `;
                    if (reward.energyRegen) rewardDescription += `<i class="fas fa-bolt"></i> +${reward.energyRegen} регенерации `;
                    if (reward.comboDecayMultiplier) rewardDescription += `<i class="fas fa-fire"></i> x${reward.comboDecayMultiplier} к комбо `;
                    if (reward.doubleClickChance) rewardDescription += `<i class="fas fa-clone"></i> +${(reward.doubleClickChance * 100).toFixed(1)}% двойного клика `;
                    if (reward.prestigeMultiplier) rewardDescription += `<i class="fas fa-star"></i> +${reward.prestigeMultiplier} к множителю престижа `;
                    
                    rewardHtml = `
                        <div class="achievement-reward">
                            <div class="reward-info">
                                <i class="fas fa-gift"></i>
                                <span>Награда: ${rewardDescription}</span>
                            </div>
                            <button class="claim-reward-btn" onclick="window.game.claimAchievementReward('${achievement.id}')">
                                <i class="fas fa-hand-holding-usd"></i> Забрать награду
                            </button>
                        </div>
                    `;
                }
            } else {
                rewardHtml = `
                    <div class="achievement-progress">
                        <div class="progress-incomplete">
                            Прогресс: ${this.formatNumber(progressValue)}/${this.formatNumber(progressMax)} (${progressPercent.toFixed(1)}%)
                        </div>
                    </div>
                `;
            }
            
            html += `
                <div class="achievement ${achievement.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">
                        <i class="${achievement.icon}"></i>
                        ${achievement.unlocked ? '<div class="achievement-badge"><i class="fas fa-check"></i></div>' : ''}
                    </div>
                    <div class="achievement-content">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                        ${rewardHtml}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        const unlockedStatElement = document.getElementById('achievements-unlocked-stat');
        if (unlockedStatElement) {
            unlockedStatElement.textContent = `${unlockedCount}/${this.achievements.length} (${collectedCount} наград)`;
        }
        
        console.log('[renderAchievements] Достижения отрисованы, разблокировано:', unlockedCount, 'наград получено:', collectedCount);
    }
    
    renderStatsSection() {
        if (!this.currentUser) return;
        
        console.log('[renderStatsSection] Рендеринг статистики...');
        
        const totalEarnedElement = document.getElementById('total-earned-stat');
        const maxComboElement = document.getElementById('max-combo-stat');
        const upgradesBoughtElement = document.getElementById('upgrades-bought-stat');
        const prestigeLevelElement = document.getElementById('prestige-level-stat');
        
        if (totalEarnedElement) {
            totalEarnedElement.textContent = this.formatNumber(this.state.totalEarned);
            console.log('[renderStatsSection] Всего заработано установлено:', this.formatNumber(this.state.totalEarned));
        }
        if (maxComboElement) {
            maxComboElement.textContent = `x${this.state.maxCombo.toFixed(1)}`;
            console.log('[renderStatsSection] Макс. комбо установлено:', `x${this.state.maxCombo.toFixed(1)}`);
        }
        if (upgradesBoughtElement) {
            upgradesBoughtElement.textContent = Object.keys(this.state.upgrades).length;
            console.log('[renderStatsSection] Куплено улучшений установлено:', Object.keys(this.state.upgrades).length);
        }
        if (prestigeLevelElement) {
            prestigeLevelElement.textContent = this.state.prestige;
            console.log('[renderStatsSection] Уровень престижа установлен:', this.state.prestige);
        }
    }
    
    createClickAnimation(amount) {
        const planet = document.getElementById('click-planet');
        if (!planet) return;
        
        const rect = planet.getBoundingClientRect();
        
        const animation = document.createElement('div');
        animation.className = 'click-animation';
        animation.textContent = `+${amount}`;
        animation.style.left = `${rect.left + Math.random() * rect.width}px`;
        animation.style.top = `${rect.top + Math.random() * rect.height}px`;
        
        if (amount > 50) {
            animation.style.color = '#ffd700';
            animation.style.fontSize = '1.8em';
        } else if (amount > 10) {
            animation.style.color = '#00ff9d';
        }
        
        document.body.appendChild(animation);
        
        setTimeout(() => {
            animation.style.opacity = '0';
            animation.style.transform = 'translateY(-100px) scale(1.5)';
            setTimeout(() => animation.remove(), 300);
        }, 700);
    }
    
    animatePlanet() {
        const planet = document.getElementById('click-planet');
        if (planet) {
            planet.classList.add('pulse');
            
            setTimeout(() => {
                planet.classList.remove('pulse');
            }, 300);
        }
    }
    
    showNotification(message, type = 'info') {
        console.log(`[showNotification] ${type}: ${message}`);
        const notifications = document.getElementById('notifications');
        if (!notifications) {
            console.error('[showNotification] Контейнер уведомлений не найден');
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${type === 'success' ? 'fas fa-check-circle' : 
                          type === 'warning' ? 'fas fa-exclamation-triangle' : 
                          type === 'error' ? 'fas fa-times-circle' : 
                          'fas fa-info-circle'}"></i>
            </div>
            <div class="notification-text">${message}</div>
        `;
        
        notifications.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        if (notifications.children.length > 5) {
            notifications.removeChild(notifications.firstChild);
        }
    }
    
    saveGame() {
        if (!this.currentUser || !this.state) {
            console.log('[saveGame] Нечего сохранять, нет пользователя или состояния');
            return;
        }
        
        console.log('[saveGame] Сохранение игры для пользователя:', this.currentUser);
        
        const saveData = {
            username: this.currentUser,
            password: this.getUserPassword(this.currentUser),
            state: this.state,
            achievements: this.achievements,
            upgradesTree: this.upgradesTree,
            prestigeUpgradesTree: this.prestigeUpgradesTree,
            shopItems: this.shopItems,
            currentPlanetTheme: this.currentPlanetTheme,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`spaceMinerUser_${this.currentUser}`, JSON.stringify(saveData));
        
        // Сохраняем имя последнего пользователя
        localStorage.setItem('spaceMinerLastUser', this.currentUser);
        
        console.log('[saveGame] Игра сохранена, размер данных:', JSON.stringify(saveData).length, 'байт');
    }
    
    loadGame() {
        if (!this.currentUser) {
            console.log('[loadGame] Нет текущего пользователя');
            return false;
        }
        
        console.log('[loadGame] Загрузка игры для пользователя:', this.currentUser);
        
        const userKey = `spaceMinerUser_${this.currentUser}`;
        const saveData = localStorage.getItem(userKey);
        
        if (saveData) {
            console.log('[loadGame] Данные найдены в localStorage, размер:', saveData.length, 'байт');
            try {
                const data = JSON.parse(saveData);
                console.log('[loadGame] Данные успешно разобраны, ключи:', Object.keys(data));
                
                if (data.state) {
                    console.log('[loadGame] Загрузка состояния игры');
                    this.state = { ...this.getInitialState(), ...data.state };
                } else {
                    console.log('[loadGame] Состояние не найдено, создание нового');
                    this.state = this.getInitialState();
                }
                
                // Инициализируем данные игры после загрузки состояния
                this.initGameData();
                
                if (data.achievements) {
                    console.log('[loadGame] Загрузка достижений, количество:', data.achievements.length);
                    this.achievements = data.achievements;
                }
                
                if (data.upgradesTree && Array.isArray(data.upgradesTree)) {
                    console.log('[loadGame] Загрузка дерева улучшений, количество:', data.upgradesTree.length);
                    this.upgradesTree = data.upgradesTree;
                }
                
                if (data.prestigeUpgradesTree && Array.isArray(data.prestigeUpgradesTree)) {
                    console.log('[loadGame] Загрузка престижных улучшений, количество:', data.prestigeUpgradesTree.length);
                    this.prestigeUpgradesTree = data.prestigeUpgradesTree;
                }
                
                if (data.shopItems && Array.isArray(data.shopItems)) {
                    console.log('[loadGame] Загрузка предметов магазина, количество:', data.shopItems.length);
                    this.shopItems = data.shopItems;
                }
                
                if (data.currentPlanetTheme) {
                    console.log('[loadGame] Загрузка темы планеты:', data.currentPlanetTheme);
                    this.currentPlanetTheme = data.currentPlanetTheme;
                }
                
                this.recalculateStats();
                this.updatePlanetTheme();
                console.log('[loadGame] Игра успешно загружена');
                return true;
            } catch (error) {
                console.error('[loadGame] Ошибка загрузки игры:', error);
                this.showNotification('Ошибка загрузки сохранения', 'error');
                this.state = this.getInitialState();
                this.initGameData();
                return false;
            }
        } else {
            console.log('[loadGame] Нет сохранения, создание нового');
            // Нет сохранения, создаем новое
            this.state = this.getInitialState();
            this.initGameData();
            console.log('[loadGame] Создано новое сохранение');
            return true;
        }
    }
    
    recalculateStats() {
        if (!this.state) {
            console.log('[recalculateStats] Нет состояния для пересчета');
            return;
        }
        
        console.log('[recalculateStats] Пересчет статистики...');
        
        this.state.clickPower = 1;
        this.state.autoIncome = 0;
        this.state.maxEnergy = 100;
        this.state.energyRegen = 1;
        
        for (const upgrade of this.upgradesTree) {
            const level = this.state.upgrades[upgrade.id] || 0;
            if (level > 0) {
                console.log(`[recalculateStats] Применение эффекта для ${upgrade.id} уровень ${level}`);
                
                for (let i = 0; i < level; i++) {
                    const effect = upgrade.effect;
                    if (effect.clickPower) {
                        this.state.clickPower += effect.clickPower;
                    }
                    if (effect.autoIncome) {
                        this.state.autoIncome += effect.autoIncome;
                    }
                    if (effect.maxEnergy) {
                        this.state.maxEnergy += effect.maxEnergy;
                    }
                    if (effect.energyRegen) {
                        this.state.energyRegen += effect.energyRegen;
                    }
                }
                
                this.unlockConnectedUpgrades(upgrade.id);
            }
        }
        
        // Применяем собранные награды достижений
        for (const achievement of this.achievements) {
            if (achievement.unlocked && achievement.rewardCollected) {
                const reward = achievement.reward;
                if (reward.clickPower) {
                    this.state.clickPower += reward.clickPower;
                }
                if (reward.autoIncome) {
                    this.state.autoIncome += reward.autoIncome;
                }
                if (reward.energyRegen) {
                    this.state.energyRegen += reward.energyRegen;
                }
                if (reward.doubleClickChance) {
                    this.state.doubleClickChance += reward.doubleClickChance;
                }
                if (reward.prestigeMultiplier) {
                    this.state.prestigeMultiplier += reward.prestigeMultiplier;
                }
            }
        }
        
        if (this.state.energy > this.state.maxEnergy) {
            this.state.energy = this.state.maxEnergy;
        }
        
        console.log('[recalculateStats] Статистика пересчитана:', {
            clickPower: this.state.clickPower,
            autoIncome: this.state.autoIncome,
            maxEnergy: this.state.maxEnergy,
            energyRegen: this.state.energyRegen
        });
    }
    
    resetGame() {
        if (!this.currentUser) return;
        
        console.log('[resetGame] Сброс игры для пользователя:', this.currentUser);
        
        if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
            localStorage.removeItem(`spaceMinerUser_${this.currentUser}`);
            this.state = this.getInitialState();
            this.initGameData();
            this.renderAll();
            this.showNotification('Игра сброшена', 'info');
            console.log('[resetGame] Игра сброшена');
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }
    
    setupTreeControls() {
        console.log('[setupTreeControls] Настройка управления деревом...');
        const treeContainer = document.getElementById('tree-container');
        
        if (!treeContainer) {
            console.error('[setupTreeControls] Контейнер дерева не найден');
            return;
        }
        
        treeContainer.addEventListener('mousedown', (event) => {
            this.state.isDragging = true;
            this.state.lastMouseX = event.clientX;
            this.state.lastMouseY = event.clientY;
            treeContainer.style.cursor = 'grabbing';
            event.preventDefault();
        });
        
        // Добавляем переменные для оптимизации перетаскивания
        this.lastDragRender = 0;
        const DRAG_RENDER_INTERVAL = 16; // ~60fps

        document.addEventListener('mousemove', (event) => {
            if (!this.state.isDragging) return;
            
            const deltaX = event.clientX - this.state.lastMouseX;
            const deltaY = event.clientY - this.state.lastMouseY;
            
            this.state.treeOffsetX += deltaX;
            this.state.treeOffsetY += deltaY;
            
            this.state.lastMouseX = event.clientX;
            this.state.lastMouseY = event.clientY;
            
            // Ограничиваем частоту рендеринга во время перетаскивания
            const now = Date.now();
            if (now - this.lastDragRender > DRAG_RENDER_INTERVAL) {
                this.renderUpgrades();
                this.lastDragRender = now;
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.state.isDragging = false;
            if (treeContainer) {
                treeContainer.style.cursor = 'grab';
            }
        });
        
        treeContainer.addEventListener('wheel', (event) => {
            event.preventDefault();
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
            const tree = document.querySelector('.upgrade-tree');
            if (tree) {
                const currentScale = this.state.treeZoom || 1;
                const newScale = Math.max(0.3, Math.min(3, currentScale * zoomFactor));
                this.state.treeZoom = newScale;
                tree.style.transform = `translate(${this.state.treeOffsetX}px, ${this.state.treeOffsetY}px) scale(${newScale})`;
            }
        });
        
        treeContainer.addEventListener('dblclick', () => {
            const tree = document.querySelector('.upgrade-tree');
            if (tree) {
                tree.style.transform = 'translate(0px, 0px) scale(1)';
                this.state.treeOffsetX = 0;
                this.state.treeOffsetY = 0;
                this.state.treeZoom = 1;
                this.renderUpgrades();
            }
        });
        
        // Добавляем поддержку touch событий для мобильных устройств
        treeContainer.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                this.state.isDragging = true;
                this.state.lastMouseX = event.touches[0].clientX;
                this.state.lastMouseY = event.touches[0].clientY;
                treeContainer.style.cursor = 'grabbing';
                event.preventDefault();
            } else if (event.touches.length === 2) {
                // Обработка pinch-to-zoom
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                this.initialDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
                this.initialScale = this.state.treeZoom || 1;
                
                // Вычисляем центр жеста для корректного масштабирования
                this.pinchCenterX = (touch1.clientX + touch2.clientX) / 2;
                this.pinchCenterY = (touch1.clientY + touch2.clientY) / 2;
                
                event.preventDefault();
            }
        });
        
        treeContainer.addEventListener('touchmove', (event) => {
            if (!this.state.isDragging || event.touches.length !== 1) {
                // Обработка pinch-to-zoom
                if (event.touches.length === 2) {
                    event.preventDefault();
                    
                    const touch1 = event.touches[0];
                    const touch2 = event.touches[1];
                    const currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
                    
                    if (typeof this.initialDistance !== 'undefined' && this.initialDistance > 0) {
                        const scale = currentDistance / this.initialDistance;
                        const tree = document.querySelector('.upgrade-tree');
                        
                        if (tree) {
                            const currentScale = this.state.treeZoom || 1;
                            
                            // Используем текущее значение масштаба дерева из состояния игры, если оно есть
                            const newScale = Math.max(0.3, Math.min(3, currentScale * scale));
                            this.state.treeZoom = newScale;
                            tree.style.transform = `translate(${this.state.treeOffsetX}px, ${this.state.treeOffsetY}px) scale(${newScale})`;
                        }
                    }
                }
                return;
            }
            
            const touch = event.touches[0];
            let deltaX = touch.clientX - this.state.lastMouseX;
            let deltaY = touch.clientY - this.state.lastMouseY;
            
            // Увеличиваем чувствительность для мобильных устройств
            deltaX *= 1.5;
            deltaY *= 1.5;

            this.state.treeOffsetX += deltaX;
            this.state.treeOffsetY += deltaY;

            this.state.lastMouseX = touch.clientX;
            this.state.lastMouseY = touch.clientY;
            // Ограничиваем частоту рендеринга во время перетаскивания
            const now = Date.now();
            if (now - this.lastDragRender > DRAG_RENDER_INTERVAL) {
                this.renderUpgrades();
                this.lastDragRender = now;
            }
            event.preventDefault();
        });
        
        treeContainer.addEventListener('touchend', (event) => {
            this.state.isDragging = false;
            // Проверяем, остались ли еще пальцы на экране
            if (event.touches.length === 0) {
                treeContainer.style.cursor = 'grab';
            }
        });
        
        treeContainer.addEventListener('touchcancel', () => {
            this.state.isDragging = false;
            treeContainer.style.cursor = 'grab';
        });
        
        // Объявляем переменные для pinch-to-zoom как свойства объекта
        this.initialDistance = null;
        this.initialScale = 1;
        this.pinchCenterX = 0;
        this.pinchCenterY = 0;
        

        
        treeContainer.style.cursor = 'grab';
        console.log('[setupTreeControls] Управление деревом настроено');
    }
    
    switchSection(section) {
        console.log('[switchSection] Переключение на секцию:', section);
        
        // Сохраняем текущие параметры дерева перед переключением
        if (section !== 'upgrades' && document.getElementById('tree-container')) {
            const tree = document.querySelector('.upgrade-tree');
            if (tree) {
                // Обновляем состояние дерева, чтобы сохранить текущие параметры
                const computedStyle = getComputedStyle(tree);
                if (computedStyle.transform && computedStyle.transform !== 'none') {
                    // Сохраняем текущие значения в состоянии
                    // Извлекаем масштаб из трансформации
                    const matrix = new DOMMatrixReadOnly(computedStyle.transform);
                    this.state.treeZoom = matrix.a; // масштаб
                    
                    // Извлечение смещений из трансформации
                    const transformMatch = computedStyle.transform.match(/translate\(([-\d.]+)px, ([-\d.]+)px\)/);
                    if (transformMatch) {
                        this.state.treeOffsetX = parseFloat(transformMatch[1]);
                        this.state.treeOffsetY = parseFloat(transformMatch[2]);
                    }
                }
            }
        }
        
        document.querySelectorAll('.nav-btn').forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-section') === section) {
                button.classList.add('active');
            }
        });
        
        document.querySelectorAll('.content-section').forEach(sectionElement => {
            sectionElement.classList.remove('active');
            if (sectionElement.id === `${section}-section`) {
                sectionElement.classList.add('active');
            }
        });
        
        if (section === 'upgrades') {
            console.log('[switchSection] Рендеринг дерева улучшений...');
            this.renderUpgrades();
        } else if (section === 'shop') {
            console.log('[switchSection] Рендеринг магазина...');
            this.renderShop(true);
        } else if (section === 'achievements') {
            console.log('[switchSection] Рендеринг достижений...');
            this.renderAchievements();
        } else if (section === 'stats') {
            console.log('[switchSection] Рендеринг статистики...');
            this.renderStatsSection();
        } else if (section === 'prestige') {
            console.log('[switchSection] Рендеринг престижа...');
            this.updatePrestigeButton();
        }
    }
    
    getUserPassword(username) {
        const userKey = `spaceMinerUser_${username}`;
        const userData = localStorage.getItem(userKey);
        
        if (userData) {
            try {
                const data = JSON.parse(userData);
                return data.password || '';
            } catch (error) {
                console.error('[getUserPassword] Ошибка парсинга данных пользователя:', error);
                return '';
            }
        }
        return '';
    }

        // ===== АДМИН-ФУНКЦИИ =====
    
    adminAddResource(type, amount) {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        const numAmount = parseInt(amount);
        if (isNaN(numAmount)) {
            this.showNotification('Введите корректное число!', 'warning');
            return;
        }
        
        switch(type) {
            case 'credits':
                this.state.credits += numAmount;
                break;
            case 'minerals':
                this.state.minerals += numAmount;
                break;
            case 'prestige':
                this.state.prestige += numAmount;
                this.updatePlanetTheme();
                break;
            default:
                this.showNotification('Неизвестный тип ресурса', 'error');
                return;
        }
        
        this.showNotification(`Добавлено ${numAmount} ${type}`, 'success');
        this.renderAll();
        this.saveGame();
    }
    
    adminSetResource(type, value) {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 0) {
            this.showNotification('Введите корректное положительное число!', 'warning');
            return;
        }
        
        switch(type) {
            case 'credits':
                this.state.credits = numValue;
                break;
            case 'minerals':
                this.state.minerals = numValue;
                break;
            case 'prestige':
                this.state.prestige = numValue;
                this.updatePlanetTheme();
                break;
            case 'clickPower':
                this.state.clickPower = numValue;
                break;
            case 'autoIncome':
                this.state.autoIncome = numValue;
                break;
            case 'energy':
                this.state.energy = Math.min(numValue, this.state.maxEnergy);
                break;
            default:
                this.showNotification('Неизвестный параметр', 'error');
                return;
        }
        
        this.showNotification(`Установлено ${type}: ${numValue}`, 'success');
        this.renderAll();
        this.saveGame();
    }
    
    adminSwitchUser(username) {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        if (!username || username.trim() === '') {
            this.showNotification('Введите имя пользователя!', 'warning');
            return;
        }
        
        const userKey = `spaceMinerUser_${username}`;
        if (!localStorage.getItem(userKey)) {
            this.showNotification('Пользователь не найден!', 'error');
            return;
        }
        
        // Сохраняем текущую игру
        this.saveGame();
        
        // Переключаем пользователя
        this.currentUser = username;
        this.loadGame();
        
        // Обновляем интерфейс
        this.renderAll();
        
        this.showNotification(`Переключено на пользователя: ${username}`, 'success');
    }
    
    adminDeleteUser(username) {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        if (!username || username.trim() === '') {
            this.showNotification('Введите имя пользователя!', 'warning');
            return;
        }
        
        if (username.toLowerCase() === 'gihido') {
            this.showNotification('Нельзя удалить администратора!', 'error');
            return;
        }
        
        if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
            return;
        }
        
        const userKey = `spaceMinerUser_${username}`;
        localStorage.removeItem(userKey);
        
        // Если удаляем текущего пользователя, выходим в меню
        if (this.currentUser === username) {
            this.logout();
        }
        
        this.showNotification(`Пользователь ${username} удален`, 'success');
    }
    
    adminAddMillion() {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        this.state.credits += 1000000;
        this.state.totalEarned += 1000000;
        this.showNotification('+1,000,000 кредитов добавлено!', 'success');
        this.renderAll();
        this.saveGame();
    }
    
    adminMaxUpgrades() {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        // Максимально прокачиваем все обычные улучшения
        for (const upgrade of this.upgradesTree) {
            if (upgrade.id !== 'start') {
                this.state.upgrades[upgrade.id] = upgrade.maxLevel;
                // Применяем эффект всех уровней
                for (let i = 0; i < upgrade.maxLevel; i++) {
                    this.applyUpgradeEffect(upgrade);
                }
            }
        }
        
        // Разблокируем все улучшения
        for (const upgrade of this.upgradesTree) {
            upgrade.unlocked = true;
        }
        
        this.showNotification('Все улучшения прокачаны до максимума!', 'success');
        this.renderAll();
        this.saveGame();
    }
    
    adminUnlockAll() {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        // Разблокируем все достижения
        for (const achievement of this.achievements) {
            achievement.unlocked = true;
        }
        
        // Разблокируем все престижные улучшения
        for (const upgrade of this.prestigeUpgradesTree) {
            upgrade.unlocked = true;
        }
        
        // Даем максимальные характеристики
        this.state.clickPower = 1000;
        this.state.autoIncome = 1000;
        this.state.maxEnergy = 1000;
        this.state.energyRegen = 100;
        this.state.doubleClickChance = 0.025; // Максимальный шанс 2.5%
        this.state.energy = this.state.maxEnergy;
        
        this.showNotification('Все разблокировано!', 'success');
        this.renderAll();
        this.saveGame();
    }
    
    adminResetCurrent() {
        if (this.currentUser.toLowerCase() !== 'gihido') {
            this.showNotification('Доступно только администратору!', 'error');
            return;
        }
        
        if (!confirm('Вы уверены, что хотите сбросить текущего пользователя?')) {
            return;
        }
        
        this.state = this.getInitialState();
        this.initGameData();
        this.renderAll();
        this.showNotification('Текущий пользователь сброшен', 'info');
        this.saveGame();
    }
    
    // ===== ФУНКЦИИ ДЛЯ МОБИЛЬНОЙ ПАНЕЛИ УЛУЧШЕНИЙ =====
    
    showMobileUpgradePanel(upgradeId) {
        console.log('[showMobileUpgradePanel] Открытие мобильной панели для улучшения:', upgradeId);
        
        const upgrade = this.upgradesTree.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.error('[showMobileUpgradePanel] Улучшение не найдено:', upgradeId);
            return;
        }
        
        const currentLevel = this.state.upgrades[upgradeId] || 0;
        
        // Проверяем, достигнут ли максимальный уровень
        if (currentLevel >= upgrade.maxLevel) {
            this.showNotification('Максимальный уровень достигнут!', 'info');
            return;
        }
        
        // Обновляем информацию в панели
        const panel = document.getElementById('mobile-upgrade-panel');
        const overlay = document.getElementById('mobile-upgrade-overlay');
        const nameElement = document.getElementById('mobile-upgrade-name');
        const iconElement = document.getElementById('mobile-upgrade-icon');
        const descElement = document.getElementById('mobile-upgrade-description');
        const costElement = document.getElementById('mobile-upgrade-cost');
        const currentLevelElement = document.getElementById('mobile-upgrade-current-level');
        const effectElement = document.getElementById('mobile-upgrade-effect');
        
        // Обновляем содержимое
        nameElement.textContent = upgrade.name;
        descElement.textContent = upgrade.description;
        currentLevelElement.textContent = `${currentLevel}/${upgrade.maxLevel}`;
        
        // Обновляем иконку
        const iconClass = upgrade.icon || 'fas fa-gem';
        iconElement.innerHTML = `<i class="${iconClass}"></i>`;
        
        // Рассчитываем цену и отображаем её
        let price;
        let priceDisplay = '';
        
        if (upgrade.currency === 'mixed') {
            const upgradePrice = this.calculateUpgradePrice(upgrade, currentLevel);
            priceDisplay = `<i class="fas fa-coins"></i> ${this.formatNumber(upgradePrice.credits)} + <i class="fas fa-gem"></i> ${this.formatNumber(upgradePrice.minerals)}`;
        } else {
            const upgradePrice = this.calculateUpgradePrice(upgrade, currentLevel);
            const currencyIcon = upgrade.currency === 'minerals' ? 'fa-gem' : 'fa-coins';
            priceDisplay = `<i class="fas ${currencyIcon}"></i> ${this.formatNumber(upgradePrice)}`;
        }
        
        costElement.innerHTML = `Цена: ${priceDisplay}`;
        
        // Отображаем эффект улучшения
        let effectText = '';
        if (upgrade.effect) {
            for (const [key, value] of Object.entries(upgrade.effect)) {
                switch(key) {
                    case 'clickPower':
                        effectText = `+${value} к силе клика`;
                        break;
                    case 'clickPowerMultiplier':
                        effectText = `x${value} к силе клика`;
                        break;
                    case 'autoIncome':
                        effectText = `+${value} к автоматическому доходу`;
                        break;
                    case 'maxEnergy':
                        effectText = `+${value} к максимальной энергии`;
                        break;
                    case 'energyRegen':
                        effectText = `+${value} к регенерации энергии`;
                        break;
                    case 'mineralChance':
                        effectText = `+${(value * 100).toFixed(1)}% к шансу минералов`;
                        break;
                    default:
                        effectText = `${key}: ${value}`;
                        break;
                }
                break; // Показываем только первый эффект
            }
        }
        effectElement.textContent = effectText || 'Эффект не определён';
        
        // Показываем панель
        overlay.classList.add('active');
        panel.classList.add('active');
        
        // Сохраняем ID улучшения для последующей покупки
        this.state.currentMobileUpgradeId = upgradeId;
        this.state.mobileUpgradePanelOpen = true;
        
        // Добавляем обработчики событий
        this.setupMobileUpgradePanelEvents();
    }
    
    hideMobileUpgradePanel() {
        console.log('[hideMobileUpgradePanel] Закрытие мобильной панели');
        
        const panel = document.getElementById('mobile-upgrade-panel');
        const overlay = document.getElementById('mobile-upgrade-overlay');
        
        overlay.classList.remove('active');
        panel.classList.remove('active');
        
        this.state.mobileUpgradePanelOpen = false;
        this.state.currentMobileUpgradeId = null;
        
        // Удаляем обработчики событий
        this.cleanupMobileUpgradePanelEvents();
    }
    
    setupMobileUpgradePanelEvents() {
        // Обработчик кнопки покупки
        const buyBtn = document.getElementById('mobile-upgrade-buy');
        const cancelBtn = document.getElementById('mobile-upgrade-cancel');
        
        if (buyBtn) {
            buyBtn.onclick = () => {
                if (this.state.currentMobileUpgradeId) {
                    this.buyUpgrade(this.state.currentMobileUpgradeId);
                    this.hideMobileUpgradePanel();
                }
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.hideMobileUpgradePanel();
            };
        }
        
        // Обработчик для оверлея (закрытие при клике вне панели)
        const overlay = document.getElementById('mobile-upgrade-overlay');
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.hideMobileUpgradePanel();
                }
            };
        }
    }
    
    cleanupMobileUpgradePanelEvents() {
        const buyBtn = document.getElementById('mobile-upgrade-buy');
        const cancelBtn = document.getElementById('mobile-upgrade-cancel');
        const overlay = document.getElementById('mobile-upgrade-overlay');
        
        if (buyBtn) {
            buyBtn.onclick = null;
        }
        if (cancelBtn) {
            cancelBtn.onclick = null;
        }
        if (overlay) {
            overlay.onclick = null;
        }
    }
    
    // Модифицируем функцию покупки улучшения для мобильных устройств
    handleUpgradeClick(upgradeId) {
        // Проверяем, является ли устройство мобильным
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile && !this.state.mobileUpgradePanelOpen) {
            // На мобильных устройствах сначала показываем панель информации
            this.showMobileUpgradePanel(upgradeId);
        } else if (isMobile && this.state.mobileUpgradePanelOpen && this.state.currentMobileUpgradeId === upgradeId) {
            // Если панель уже открыта для этого улучшения, покупаем его
            this.buyUpgrade(upgradeId);
            this.hideMobileUpgradePanel();
        } else {
            // На ПК и других случаях покупаем сразу
            this.buyUpgrade(upgradeId);
        }
    }
    
    // ===== ФУНКЦИИ ДЛЯ ИНФОРМАЦИОННОГО РАЗДЕЛА =====
    
    updateInfoSection() {
        if (!this.state) return;
        
        // Обновляем значения в информационном разделе
        const creditsValue = document.getElementById('info-credits-value');
        const mineralsValue = document.getElementById('info-minerals-value');
        const energyValue = document.getElementById('info-energy-value');
        const prestigeValue = document.getElementById('info-prestige-value');
        const clickPowerValue = document.getElementById('info-click-power-value');
        const autoIncomeValue = document.getElementById('info-auto-income-value');
        const planetName = document.getElementById('info-planet-name');
        const planetDescription = document.getElementById('info-planet-description');
        const upgradesCount = document.getElementById('info-upgrades-count');
        
        if (creditsValue) creditsValue.textContent = this.formatNumber(this.state.credits);
        if (mineralsValue) mineralsValue.textContent = this.formatNumber(this.state.minerals);
        if (energyValue) energyValue.textContent = `${Math.floor(this.state.energy)}/${this.state.maxEnergy}`;
        if (prestigeValue) prestigeValue.textContent = this.state.prestige;
        if (clickPowerValue) clickPowerValue.textContent = this.formatNumber(this.getTotalClickPower());
        if (autoIncomeValue) autoIncomeValue.textContent = this.formatNumber(this.getTotalAutoIncome());
        
        // Обновляем информацию о планете
        const theme = this.planetThemes[this.currentPlanetTheme] || this.planetThemes.default;
        if (planetName) planetName.textContent = theme.name;
        if (planetDescription) planetDescription.textContent = theme.boostText;
        
        // Подсчитываем количество купленных улучшений
        const boughtUpgrades = Object.keys(this.state.upgrades).filter(id => this.state.upgrades[id] > 0).length;
        if (upgradesCount) upgradesCount.textContent = `${boughtUpgrades} улучшений куплено`;
    }
    
    // ===== УЛУЧШЕНИЯ ДЛЯ МАГАЗИНА (БУСТЫ ПЕРЕХОДЯТ В ИНВЕНТАРЬ) =====
    
    buyShopItem(itemId) {
        if (!this.currentUser) {
            this.showNotification('Сначала войдите в игру!', 'warning');
            return;
        }

        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) {
            this.showNotification('Товар не найден!', 'error');
            return;
        }

        // Проверяем кулдаун
        if (!this.checkPurchaseCooldown()) {
            return;
        }

        // Проверяем, есть ли уже активный кулдаун на этот товар
        const now = Date.now();
        const cooldownKey = `shop_${itemId}`;
        if (this.state.shopCooldowns[cooldownKey] && 
            this.state.shopCooldowns[cooldownKey] > now) {
            const remaining = Math.ceil((this.state.shopCooldowns[cooldownKey] - now) / 1000);
            this.showNotification(`Подождите ${remaining} сек. до следующей покупки!`, 'warning');
            return;
        }

        // Проверяем, достаточно ли ресурсов
        if (this.state.credits < item.price) {
            this.showNotification(`Недостаточно кредитов! Нужно: ${item.price}`, 'warning');
            return;
        }

        // Покупаем
        this.state.credits -= item.price;

        // Вместо активации буста сразу, добавляем его в инвентарь
        const inventoryItem = {
            id: `${itemId}_${Date.now()}`,
            originalId: itemId,
            name: item.name,
            description: item.description,
            icon: item.icon,
            effect: item.effect,
            duration: item.duration,
            type: 'boost',
            timestamp: Date.now()
        };

        this.state.inventory.push(inventoryItem);

        // Устанавливаем кулдаун
        this.state.shopCooldowns[cooldownKey] = now + item.cooldown;
        this.state.lastPurchaseTime = now;

        this.renderResources();
        this.renderShop();
        this.renderInventory(); // Обновляем инвентарь
        this.saveGame();

        this.showNotification(`Куплено: ${item.name}! Предмет добавлен в инвентарь.`, 'success');
    }
    
    // ===== УВЕЛИЧЕНИЕ СТОИМОСТИ БУСТОВ =====
    
    initShopItems() {
        console.log('[initShopItems] Инициализация магазина с увеличенными ценами');
        this.shopItems = [
            {
                id: 'double_click_x2',
                name: 'Удвоитель кликов x2',
                description: 'Удваивает силу всех кликов на 30 секунд',
                icon: 'fas fa-hand-point-up',
                price: 1000000, // Увеличена цена
                cooldown: 5 * 60 * 1000, // 5 минут
                duration: 30 * 1000, // 30 секунд
                effect: { multiplier: 2, type: 'click' }
            },
            {
                id: 'triple_click_x3',
                name: 'Утроитель кликов x3',
                description: 'Утраивает силу всех кликов на 30 секунд',
                icon: 'fas fa-hand-sparkles',
                price: 5000000, // Увеличена цена
                cooldown: 10 * 60 * 1000, // 10 минут
                duration: 30 * 1000, // 30 секунд
                effect: { multiplier: 3, type: 'click' }
            },
            {
                id: 'auto_miner_2x',
                name: 'Автомайнер x2',
                description: 'Удваивает автоматический доход на 60 секунд',
                icon: 'fas fa-robot',
                price: 2500000, // Увеличена цена
                cooldown: 8 * 60 * 1000, // 8 минут
                duration: 60 * 1000, // 60 секунд
                effect: { multiplier: 2, type: 'auto' }
            },
            {
                id: 'lucky_doubler',
                name: 'Везучий удвоитель',
                description: 'Удваивает шанс двойного клика на 60 секунд',
                icon: 'fas fa-dice',
                price: 1500000, // Увеличена цена
                cooldown: 6 * 60 * 1000, // 6 минут
                duration: 60 * 1000, // 60 секунд
                effect: { multiplier: 2, type: 'double' }
            },
            {
                id: 'energy_saver_50',
                name: 'Энергосберегатель',
                description: 'Сохраняет 50% энергии при использовании на 45 секунд',
                icon: 'fas fa-battery-full',
                price: 2000000, // Увеличена цена
                cooldown: 7 * 60 * 1000, // 7 минут
                duration: 45 * 1000, // 45 секунд
                effect: { multiplier: 0.5, type: 'energy_save' }
            },
            {
                id: 'mineral_booster',
                name: 'Минеральный усилитель',
                description: 'Удваивает шанс получения минералов на 60 секунд',
                icon: 'fas fa-gem',
                price: 3000000, // Увеличена цена
                cooldown: 9 * 60 * 1000, // 9 минут
                duration: 60 * 1000, // 60 секунд
                effect: { multiplier: 2, type: 'mineral' }
            }
        ];
    }
}

// Создаем глобальный объект игры
window.game = null;

// Запускаем игру после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM ЗАГРУЖЕН, ЗАПУСК ИГРЫ ===');
    
    try {
        // Создаем экземпляр игры
        window.game = new SpaceMinerGame();
        
        // Запускаем игру
        window.game.init();
        
        // Добавляем таймер кулдауна в интерфейс
        const timerDiv = document.createElement('div');
        timerDiv.id = 'purchase-timer';
        timerDiv.className = 'purchase-timer';
        timerDiv.style.display = 'none';
        document.body.appendChild(timerDiv);
        
        console.log('=== ИГРА УСПЕШНО ЗАПУЩЕНА ===');
    } catch (error) {
        console.error('ОШИБКА ПРИ ЗАПУСКЕ ИГРЫ:', error);
        alert('Произошла ошибка при запуске игры. Пожалуйста, обновите страницу.');
    }
});