executePrestige(totalPrestigeGains, oldTheme) {
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

        // ✅ ИСПРАВЛЕНИЕ 1: Сохраняем ВСЕ данные достижений
        const oldAchievementsData = this.achievements ? [...this.achievements] : [];

        // Сохраняем дерево престижных улучшений
        const oldPrestigeTree = this.prestigeUpgradesTree ? [...this.prestigeUpgradesTree] : [];

        // Рассчитываем итоговый уровень престижа
        const newPrestige = oldPrestige + totalPrestigeGains;

        // Рассчитываем, сколько кредитов было потрачено на престижи
        let spentCredits = 0;
        let tempPrestige = oldPrestige;
        for (let i = 0; i < totalPrestigeGains; i++) {
            const baseRequiredCredits = 10000;
            const prestigeMultiplier = Math.pow(1.1, tempPrestige);
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
    }