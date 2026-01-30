// Улучшенная система перетаскивания для дерева улучшений на мобильных устройствах

// Расширяем прототип игры, чтобы улучшить перетаскивание дерева улучшений
SpaceMinerGame.prototype.setupEnhancedTreeControls = function() {
    console.log('[setupEnhancedTreeControls] Настройка улучшенного управления деревом...');
    const treeContainer = document.getElementById('tree-container');

    if (!treeContainer) {
        console.error('[setupEnhancedTreeControls] Контейнер дерева не найден');
        return;
    }

    // Удаляем предыдущие обработчики, если они есть
    this.cleanupTreeEventListeners();

    // Переменные для отслеживания состояния перетаскивания
    this.treeDragState = {
        isDragging: false,
        isPinching: false,
        lastTouchX: 0,
        lastTouchY: 0,
        initialDistance: 0,
        initialScale: 1,
        pinchStartX: 0,
        pinchStartY: 0,
        startX: 0,
        startY: 0,
        lastMoveTime: 0,
        velocityX: 0,
        velocityY: 0,
        lastPosition: { x: 0, y: 0 }
    };

    // Добавляем обработчики для мыши
    this.mouseDownHandler = (event) => {
        if (event.button !== 0) return; // Только левая кнопка мыши
        
        event.preventDefault();
        
        this.treeDragState.isDragging = true;
        this.treeDragState.startX = event.clientX;
        this.treeDragState.startY = event.clientY;
        this.treeDragState.lastTouchX = event.clientX;
        this.treeDragState.lastTouchY = event.clientY;
        
        treeContainer.style.cursor = 'grabbing';
        treeContainer.setPointerCapture(event.pointerId);
    };

    this.mouseMoveHandler = (event) => {
        if (!this.treeDragState.isDragging) return;
        
        event.preventDefault();
        
        const deltaX = event.clientX - this.treeDragState.lastTouchX;
        const deltaY = event.clientY - this.treeDragState.lastTouchY;
        
        this.state.treeOffsetX += deltaX;
        this.state.treeOffsetY += deltaY;
        
        this.treeDragState.lastTouchX = event.clientX;
        this.treeDragState.lastTouchY = event.clientY;
        
        // Сохраняем скорость для инерции
        const now = Date.now();
        if (now - this.treeDragState.lastMoveTime < 100) {
            this.treeDragState.velocityX = deltaX / (now - this.treeDragState.lastMoveTime) * 16;
            this.treeDragState.velocityY = deltaY / (now - this.treeDragState.lastMoveTime) * 16;
        }
        this.treeDragState.lastMoveTime = now;
        
        this.renderUpgrades();
    };

    this.mouseUpHandler = (event) => {
        if (!this.treeDragState.isDragging) return;
        
        this.treeDragState.isDragging = false;
        this.treeDragState.velocityX = 0;
        this.treeDragState.velocityY = 0;
        
        if (treeContainer) {
            treeContainer.style.cursor = 'grab';
        }
        
        try {
            treeContainer.releasePointerCapture(event.pointerId);
        } catch (e) {
            // Игнорируем ошибку, если захват уже был освобожден
        }
    };

    // Добавляем обработчики для сенсорных устройств
    this.touchStartHandler = (event) => {
        event.preventDefault();
        
        if (event.touches.length === 1) {
            // Одиночное касание - перетаскивание
            this.treeDragState.isDragging = true;
            this.treeDragState.lastTouchX = event.touches[0].clientX;
            this.treeDragState.lastTouchY = event.touches[0].clientY;
            this.treeDragState.startX = event.touches[0].clientX;
            this.treeDragState.startY = event.touches[0].clientY;
            
            treeContainer.style.cursor = 'grabbing';
        } else if (event.touches.length === 2) {
            // Два касания - зум
            this.treeDragState.isPinching = true;
            this.treeDragState.isDragging = false;
            
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            
            this.treeDragState.initialDistance = Math.hypot(
                touch2.clientX - touch1.clientX, 
                touch2.clientY - touch1.clientY
            );
            this.treeDragState.initialScale = this.state.treeZoom || 1;
            
            // Вычисляем центр между двумя касаниями
            this.treeDragState.pinchStartX = (touch1.clientX + touch2.clientX) / 2;
            this.treeDragState.pinchStartY = (touch1.clientY + touch2.clientY) / 2;
        }
    };

    this.touchMoveHandler = (event) => {
        event.preventDefault();
        
        if (event.touches.length === 1 && this.treeDragState.isDragging) {
            // Перетаскивание одним пальцем
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.treeDragState.lastTouchX;
            const deltaY = touch.clientY - this.treeDragState.lastTouchY;
            
            this.state.treeOffsetX += deltaX;
            this.state.treeOffsetY += deltaY;
            
            this.treeDragState.lastTouchX = touch.clientX;
            this.treeDragState.lastTouchY = touch.clientY;
            
            // Сохраняем скорость для инерции
            const now = Date.now();
            if (now - this.treeDragState.lastMoveTime < 100) {
                this.treeDragState.velocityX = deltaX / (now - this.treeDragState.lastMoveTime) * 16;
                this.treeDragState.velocityY = deltaY / (now - this.treeDragState.lastMoveTime) * 16;
            }
            this.treeDragState.lastMoveTime = now;
            
            this.renderUpgrades();
        } else if (event.touches.length === 2 && this.treeDragState.isPinching) {
            // Масштабирование двумя пальцами
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];
            
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX, 
                touch2.clientY - touch1.clientY
            );
            
            if (this.treeDragState.initialDistance > 0) {
                const scale = currentDistance / this.treeDragState.initialDistance;
                const newScale = Math.max(0.3, Math.min(3, this.treeDragState.initialScale * scale));
                
                this.state.treeZoom = newScale;
                
                // Обновляем позицию с учетом масштабирования относительно центра жеста
                const tree = document.querySelector('.upgrade-tree');
                if (tree) {
                    tree.style.transform = `translate(${this.state.treeOffsetX}px, ${this.state.treeOffsetY}px) scale(${newScale})`;
                }
            }
        }
    };

    this.touchEndHandler = (event) => {
        this.treeDragState.isDragging = false;
        this.treeDragState.isPinching = false;
        this.treeDragState.velocityX = 0;
        this.treeDragState.velocityY = 0;
        
        if (treeContainer && event.touches.length === 0) {
            treeContainer.style.cursor = 'grab';
        }
    };

    this.touchCancelHandler = () => {
        this.treeDragState.isDragging = false;
        this.treeDragState.isPinching = false;
        this.treeDragState.velocityX = 0;
        this.treeDragState.velocityY = 0;
        
        if (treeContainer) {
            treeContainer.style.cursor = 'grab';
        }
    };

    // Добавляем обработчики событий
    treeContainer.addEventListener('pointerdown', this.mouseDownHandler);
    document.addEventListener('pointermove', this.mouseMoveHandler);
    document.addEventListener('pointerup', this.mouseUpHandler);
    
    treeContainer.addEventListener('touchstart', this.touchStartHandler, { passive: false });
    treeContainer.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
    treeContainer.addEventListener('touchend', this.touchEndHandler);
    treeContainer.addEventListener('touchcancel', this.touchCancelHandler);

    // Обработчик колеса мыши для зума
    this.wheelHandler = (event) => {
        event.preventDefault();
        
        const rect = treeContainer.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        const currentScale = this.state.treeZoom || 1;
        const newScale = Math.max(0.3, Math.min(3, currentScale * zoomFactor));
        
        // Корректируем смещение при масштабировании, чтобы зум был относительно позиции курсора
        const tree = document.querySelector('.upgrade-tree');
        if (tree) {
            // Вычисляем смещение, которое нужно компенсировать при масштабировании
            const oldScale = currentScale;
            const scaleDiff = newScale - oldScale;
            
            // Вычисляем центр масштабирования в системе координат дерева
            const centerX = (mouseX - this.state.treeOffsetX) / oldScale;
            const centerY = (mouseY - this.state.treeOffsetY) / oldScale;
            
            // Корректируем смещение
            this.state.treeOffsetX -= centerX * scaleDiff;
            this.state.treeOffsetY -= centerY * scaleDiff;
            
            this.state.treeZoom = newScale;
            tree.style.transform = `translate(${this.state.treeOffsetX}px, ${this.state.treeOffsetY}px) scale(${newScale})`;
        }
    };
    
    treeContainer.addEventListener('wheel', this.wheelHandler, { passive: false });

    // Обработчик двойного клика для сброса масштаба и позиции
    this.doubleClickHandler = () => {
        const tree = document.querySelector('.upgrade-tree');
        if (tree) {
            tree.style.transform = 'translate(0px, 0px) scale(1)';
            this.state.treeOffsetX = 0;
            this.state.treeOffsetY = 0;
            this.state.treeZoom = 1;
            this.renderUpgrades();
        }
    };
    
    treeContainer.addEventListener('dblclick', this.doubleClickHandler);

    treeContainer.style.cursor = 'grab';
    console.log('[setupEnhancedTreeControls] Улучшенное управление деревом настроено');
};

// Функция для очистки обработчиков событий
SpaceMinerGame.prototype.cleanupTreeEventListeners = function() {
    const treeContainer = document.getElementById('tree-container');
    
    if (treeContainer && this.mouseDownHandler) {
        treeContainer.removeEventListener('pointerdown', this.mouseDownHandler);
    }
    
    if (this.mouseMoveHandler) {
        document.removeEventListener('pointermove', this.mouseMoveHandler);
    }
    
    if (this.mouseUpHandler) {
        document.removeEventListener('pointerup', this.mouseUpHandler);
    }
    
    if (treeContainer && this.touchStartHandler) {
        treeContainer.removeEventListener('touchstart', this.touchStartHandler);
    }
    
    if (treeContainer && this.touchMoveHandler) {
        treeContainer.removeEventListener('touchmove', this.touchMoveHandler);
    }
    
    if (treeContainer && this.touchEndHandler) {
        treeContainer.removeEventListener('touchend', this.touchEndHandler);
    }
    
    if (treeContainer && this.touchCancelHandler) {
        treeContainer.removeEventListener('touchcancel', this.touchCancelHandler);
    }
    
    if (treeContainer && this.wheelHandler) {
        treeContainer.removeEventListener('wheel', this.wheelHandler);
    }
    
    if (treeContainer && this.doubleClickHandler) {
        treeContainer.removeEventListener('dblclick', this.doubleClickHandler);
    }
};

// Заменяем оригинальную функцию setupTreeControls улучшенной версией
SpaceMinerGame.prototype.originalSetupTreeControls = SpaceMinerGame.prototype.setupTreeControls;
SpaceMinerGame.prototype.setupTreeControls = function() {
    // Используем улучшенную версию
    this.setupEnhancedTreeControls();
};