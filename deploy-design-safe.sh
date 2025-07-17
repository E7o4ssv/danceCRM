#!/bin/bash

# Безопасный деплой дизайна танцевальной школы
# Сохраняет функционал и добавляет новый дизайн

set -e  # Останавливаем выполнение при ошибке

echo "🎨 Начинаем безопасный деплой дизайна..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ]; then
    error "Не найдена корневая директория проекта"
fi

log "Проверяем текущее состояние..."

# Проверяем git статус
if [ -n "$(git status --porcelain)" ]; then
    warning "Есть незакоммиченные изменения"
    git status --short
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Деплой отменен"
    fi
fi

# Создаем резервную копию
log "Создаем резервную копию..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Копируем важные файлы
cp -r client/src "$BACKUP_DIR/"
cp -r server "$BACKUP_DIR/"
cp package.json "$BACKUP_DIR/"
cp client/package.json "$BACKUP_DIR/"

log "Резервная копия создана в $BACKUP_DIR"

# Проверяем зависимости
log "Проверяем зависимости..."

# Устанавливаем зависимости клиента
cd client
if [ ! -d "node_modules" ]; then
    log "Устанавливаем зависимости клиента..."
    npm install
fi

# Проверяем Tailwind CSS
if [ ! -f "tailwind.config.js" ]; then
    error "Tailwind CSS не настроен"
fi

cd ..

# Устанавливаем зависимости сервера
if [ ! -d "node_modules" ]; then
    log "Устанавливаем зависимости сервера..."
    npm install
fi

# Тестируем сборку клиента
log "Тестируем сборку клиента..."
cd client
npm run build
if [ $? -ne 0 ]; then
    error "Ошибка сборки клиента"
fi
cd ..

# Тестируем сервер локально
log "Тестируем сервер..."
timeout 10s npm run server > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3

# Проверяем, что сервер запустился
if ! kill -0 $SERVER_PID 2>/dev/null; then
    error "Сервер не запустился"
fi

# Тестируем API
log "Тестируем API..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    log "API работает корректно"
else
    warning "API не отвечает"
fi

# Останавливаем тестовый сервер
kill $SERVER_PID 2>/dev/null || true

# Подготовка к деплою
log "Подготовка к деплою..."

# Проверяем переменные окружения
if [ ! -f ".env" ]; then
    warning "Файл .env не найден"
    if [ -f "env.example" ]; then
        log "Копируем env.example в .env"
        cp env.example .env
    fi
fi

# Создаем production build
log "Создаем production build..."
cd client
npm run build
cd ..

# Проверяем, что build создался
if [ ! -d "client/build" ]; then
    error "Production build не создался"
fi

log "Production build создан успешно"

# Создаем архив для деплоя
log "Создаем архив для деплоя..."
DEPLOY_ARCHIVE="dance-school-design-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$DEPLOY_ARCHIVE" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=backup-* \
    --exclude=*.log \
    .

log "Архив создан: $DEPLOY_ARCHIVE"

# Инструкции для деплоя
echo ""
echo "🎯 ГОТОВО К ДЕПЛОЮ!"
echo ""
echo "📦 Архив: $DEPLOY_ARCHIVE"
echo "📁 Резервная копия: $BACKUP_DIR"
echo ""
echo "📋 Следующие шаги:"
echo "1. Загрузите архив на сервер"
echo "2. Распакуйте архив"
echo "3. Установите зависимости: npm install"
echo "4. Установите зависимости клиента: cd client && npm install"
echo "5. Создайте production build: cd client && npm run build"
echo "6. Запустите сервер: npm start"
echo ""
echo "🔧 Важные файлы:"
echo "- client/build/ (production build)"
echo "- server/ (backend код)"
echo "- .env (переменные окружения)"
echo ""
echo "⚠️  Не забудьте:"
echo "- Обновить переменные окружения на сервере"
echo "- Проверить подключение к базе данных"
echo "- Настроить CORS для домена сервера"
echo ""

log "Деплой подготовлен успешно! 🚀" 