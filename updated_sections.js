// Исправленная функция переключения секций
SpaceMinerGame.prototype.switchSection = function(section) {
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
                const transformMatch = computedStyle.transform.match(/translate\\(([-\\d.]+)px, ([-\\d.]+)px\\)/);
                if (transformMatch) {
                    this.state.treeOffsetX = parseFloat(transformMatch[1]);
                    this.state.treeOffsetY = parseFloat(transformMatch[2]);
                }
            }
        }
    }

    // Сначала убираем активные классы со всех кнопок
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.classList.remove('active');
    });

    // Затем добавляем активный класс только нужной кнопке
    const activeButton = document.querySelector(`.nav-btn[data-section="${section}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Сначала убираем активные классы со всех секций
    document.querySelectorAll('.content-section').forEach(sectionElement => {
        sectionElement.classList.remove('active');
    });

    // Затем добавляем активный класс только нужной секции
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Также обрабатываем специальные секции, которые могут быть вне основного контента
    if (section === 'prestige-functions') {
        // Закрываем все открытые специальные секции
        document.querySelectorAll('.special-section').forEach(el => {
            el.classList.remove('active');
        });
        
        // Открываем секцию престижных функций
        const specialSection = document.getElementById('prestige-functions-section');
        if (specialSection) {
            specialSection.classList.add('active');
        }
    } else if (section === 'info') {
        // Закрываем все открытые специальные секции
        document.querySelectorAll('.special-section').forEach(el => {
            el.classList.remove('active');
        });
        
        // Открываем информационную секцию
        const specialSection = document.getElementById('info-section');
        if (specialSection) {
            specialSection.classList.add('active');
        }
    }

    // Рендерим нужный контент в зависимости от секции
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
    } else if (section === 'prestige-functions') {
        console.log('[switchSection] Рендеринг престижных функций...');
        this.renderPrestigeFunctions();
    } else if (section === 'info') {
        console.log('[switchSection] Обновление информационной секции...');
        this.updateInfoSection();
    }
};

// Добавляем функцию закрытия всех секций
SpaceMinerGame.prototype.closeAllSections = function() {
    // Убираем активные классы со всех кнопок
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.classList.remove('active');
    });

    // Убираем активные классы со всех секций
    document.querySelectorAll('.content-section, .special-section').forEach(sectionElement => {
        sectionElement.classList.remove('active');
    });
};