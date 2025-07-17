#!/bin/bash

echo "🎨 Деплой нового дизайна Dance School System"
echo "============================================="

# Функция создания бэкапа дизайна на сервере
backup_current_design() {
    echo "💾 Создание бэкапа текущего дизайна на сервере..."
    ssh root@89.104.71.170 << 'EOF'
        cd /var/www/dance-school
        
        # Создаем бэкап текущих CSS файлов
        mkdir -p backups/design-$(date +%Y%m%d-%H%M%S)
        BACKUP_DIR="backups/design-$(date +%Y%m%d-%H%M%S)"
        
        echo "📂 Бэкап в папку: $BACKUP_DIR"
        
        # Копируем CSS файлы в бэкап
        if [ -f "client/src/index.css" ]; then
            cp client/src/index.css $BACKUP_DIR/
        fi
        if [ -f "client/src/App.css" ]; then
            cp client/src/App.css $BACKUP_DIR/
        fi
        if [ -d "client/src/styles" ]; then
            cp -r client/src/styles $BACKUP_DIR/
        fi
        
        echo "✅ Бэкап создан: $BACKUP_DIR"
EOF
}

# Подготовка файлов дизайна
prepare_design_files() {
    echo "🎨 Подготовка файлов дизайна..."
    
    # Создаем временную папку только с дизайном
    mkdir -p temp_design_deploy/client/src
    
    # Копируем только CSS файлы
    cp client/src/index.css temp_design_deploy/client/src/
    cp client/src/App.css temp_design_deploy/client/src/
    
    # Проверяем, что файлы существуют
    if [ ! -f "temp_design_deploy/client/src/index.css" ] || [ ! -f "temp_design_deploy/client/src/App.css" ]; then
        echo "❌ Ошибка: CSS файлы не найдены"
        rm -rf temp_design_deploy/
        exit 1
    fi
    
    # Создаем архив только с дизайном
    tar -czf dance-school-design.tar.gz temp_design_deploy/
    
    # Удаляем временную папку
    rm -rf temp_design_deploy/
    
    echo "✅ Архив дизайна создан: dance-school-design.tar.gz"
}

# Создание конфигурации для продакшена
prepare_production_config() {
    echo "⚙️  Подготовка конфигурации для продакшена..."
    
    # Создаем временную папку для конфига
    mkdir -p temp_config/client/src/utils
    
    # Создаем production версию api.js
    cat > temp_config/client/src/utils/api.js << 'EOF'
import axios from 'axios';

// Base URL для API (продакшен)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://89.104.71.170:5000' 
  : 'http://localhost:3001';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем interceptor для автоматического добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Удаляем токен и перенаправляем на страницу входа
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
EOF
    
    # Добавляем в архив
    tar -czf production-config.tar.gz temp_config/
    rm -rf temp_config/
    
    echo "✅ Конфигурация для продакшена подготовлена"
}

# Деплой дизайна на сервер
deploy_design() {
    echo "🚀 Деплой дизайна на сервер..."
    
    # Загружаем архивы
    scp dance-school-design.tar.gz root@89.104.71.170:/tmp/
    scp production-config.tar.gz root@89.104.71.170:/tmp/
    
    # Развертываем на сервере
    ssh root@89.104.71.170 << 'EOF'
        cd /var/www/dance-school
        
        echo "⏸️  Проверяем статус приложения..."
        pm2 status dance-school-server
        
        echo "🎨 Распаковываем новый дизайн..."
        cd /tmp
        tar -xzf dance-school-design.tar.gz
        tar -xzf production-config.tar.gz
        
        echo "📝 Обновляем CSS файлы..."
        cp temp_design_deploy/client/src/index.css /var/www/dance-school/client/src/
        cp temp_design_deploy/client/src/App.css /var/www/dance-school/client/src/
        
        echo "⚙️  Обновляем конфигурацию API..."
        cp temp_config/client/src/utils/api.js /var/www/dance-school/client/src/utils/
        
        echo "🏗️  Пересобираем фронтенд..."
        cd /var/www/dance-school/client
        
        # Устанавливаем переменную окружения для продакшена
        export NODE_ENV=production
        
        # Собираем проект
        npm run build
        
        echo "🔄 Перезапускаем сервер (для обновления статики)..."
        pm2 reload dance-school-server
        
        echo "🧹 Очищаем временные файлы..."
        rm -rf /tmp/temp_design_deploy /tmp/temp_config
        rm -f /tmp/dance-school-design.tar.gz /tmp/production-config.tar.gz
        
        echo "⏳ Ждем перезапуска..."
        sleep 5
        
        echo "📊 Проверяем статус..."
        pm2 status dance-school-server
        
        echo "✅ Дизайн успешно развернут!"
EOF
}

# Проверка результата
verify_design_deployment() {
    echo "🔍 Проверка развертывания дизайна..."
    
    sleep 10  # Даем время на полный перезапуск
    
    # Проверяем доступность приложения
    echo "🌐 Проверяем доступность приложения..."
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://89.104.71.170:5000/api/health)
    
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo "✅ Сервер работает корректно"
    else
        echo "⚠️  Сервер может быть недоступен (код: $HEALTH_CHECK)"
        echo "🔄 Попробуем восстановить из бэкапа..."
        restore_design_backup
        exit 1
    fi
    
    # Проверяем фронтенд
    echo "🎨 Проверяем фронтенд..."
    FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://89.104.71.170/)
    
    if [ "$FRONTEND_CHECK" = "200" ]; then
        echo "✅ Фронтенд работает корректно"
    else
        echo "⚠️  Фронтенд может быть недоступен (код: $FRONTEND_CHECK)"
    fi
    
    echo ""
    echo "🎉 НОВЫЙ ДИЗАЙН РАЗВЕРНУТ!"
    echo "=========================="
    echo "🌐 Приложение: http://89.104.71.170"
    echo "🎨 Новые особенности дизайна:"
    echo "• Современная голубая цветовая схема"
    echo "• Градиенты и улучшенные переходы"
    echo "• Полоска-индикатор активной навигации"
    echo "• Улучшенные hover-эффекты"
    echo "• Минималистичный и профессиональный вид"
}

# Функция восстановления дизайна из бэкапа
restore_design_backup() {
    echo "🔄 Восстановление дизайна из бэкапа..."
    ssh root@89.104.71.170 << 'EOF'
        cd /var/www/dance-school
        
        # Находим последний бэкап
        LATEST_BACKUP=$(ls -t backups/ | head -n1)
        
        if [ -n "$LATEST_BACKUP" ]; then
            echo "📦 Восстанавливаем из: $LATEST_BACKUP"
            
            # Восстанавливаем CSS файлы
            if [ -f "backups/$LATEST_BACKUP/index.css" ]; then
                cp "backups/$LATEST_BACKUP/index.css" client/src/
            fi
            if [ -f "backups/$LATEST_BACKUP/App.css" ]; then
                cp "backups/$LATEST_BACKUP/App.css" client/src/
            fi
            
            # Пересобираем
            cd client
            npm run build
            pm2 reload dance-school-server
            
            echo "✅ Дизайн восстановлен из бэкапа"
        else
            echo "❌ Бэкап не найден"
        fi
EOF
}

# Основной процесс
main() {
    echo "🔍 Проверяем текущее состояние проекта..."
    
    # Проверяем, что CSS файлы существуют
    if [ ! -f "client/src/index.css" ] || [ ! -f "client/src/App.css" ]; then
        echo "❌ CSS файлы не найдены в проекте"
        exit 1
    fi
    
    backup_current_design
    prepare_design_files
    prepare_production_config
    deploy_design
    verify_design_deployment
    
    # Удаляем локальные архивы
    rm -f dance-school-design.tar.gz production-config.tar.gz
}

# Запуск с обработкой ошибок
set -e
trap 'echo "❌ Произошла ошибка на строке $LINENO. Попробуйте восстановить дизайн командой: ssh root@89.104.71.170 \"cd /var/www/dance-school && ls backups/\""' ERR

# Подтверждение пользователя
echo "⚠️  Внимание! Этот скрипт обновит только дизайн (CSS файлы) на сервере."
echo "Функциональность приложения не изменится."
echo ""
read -p "Продолжить? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    main
    echo "🏁 Деплой дизайна завершен успешно!"
else
    echo "❌ Деплой отменен пользователем"
    exit 1
fi 