#!/bin/bash

# Скрипт для развертывания исправлений на продакшен

echo "🚀 Развертывание исправлений для dance school..."

# Проверяем наличие архива
ARCHIVE=$(ls dance-fixes-*.tar.gz | head -1)
if [ -z "$ARCHIVE" ]; then
    echo "❌ Архив с исправлениями не найден!"
    echo "Создайте архив командой:"
    echo "tar -czf dance-fixes-\$(date +%Y%m%d-%H%M%S).tar.gz server/routes/auth.js server/index.js DEPLOY_FIXES.md"
    exit 1
fi

echo "📦 Найден архив: $ARCHIVE"

# Копируем архив на сервер
echo "📤 Копирование архива на сервер..."
scp "$ARCHIVE" root@89.104.71.170:/tmp/

if [ $? -eq 0 ]; then
    echo "✅ Архив скопирован успешно"
else
    echo "❌ Ошибка при копировании архива"
    exit 1
fi

# Выполняем команды на сервере
echo "🔧 Применение исправлений на сервере..."
ssh root@89.104.71.170 << 'EOF'
    echo "📁 Переходим в директорию проекта..."
    cd /root/dance || cd /var/www/dance || cd /opt/dance
    
    echo "🛑 Останавливаем сервер..."
    pm2 stop dance-server 2>/dev/null || systemctl stop dance-server 2>/dev/null || echo "Сервер не запущен"
    
    echo "📦 Распаковываем исправления..."
    tar -xzf /tmp/dance-fixes-*.tar.gz
    
    echo "🗑️ Удаляем файлы чата (если есть)..."
    rm -f server/routes/chat.js
    rm -f server/routes/private-chat.js
    rm -f server/models/Chat.js
    rm -f server/models/PrivateChat.js
    
    echo "🚀 Запускаем сервер..."
    pm2 start dance-server 2>/dev/null || systemctl start dance-server 2>/dev/null || echo "Не удалось запустить сервер"
    
    echo "⏳ Ждем 5 секунд для запуска..."
    sleep 5
    
    echo "🔍 Проверяем статус сервера..."
    pm2 status dance-server 2>/dev/null || systemctl status dance-server 2>/dev/null || echo "Не удалось проверить статус"
    
    echo "🧹 Очищаем временные файлы..."
    rm -f /tmp/dance-fixes-*.tar.gz
    
    echo "✅ Развертывание завершено!"
EOF

echo ""
echo "🎉 Исправления развернуты!"
echo ""
echo "📋 Что было исправлено:"
echo "✅ Добавлен роут для изменения статуса пользователей"
echo "✅ Удалена функциональность чата"
echo "✅ Исправлены проблемы с добавлением студентов в группы"
echo ""
echo "🧪 Для проверки запустите:"
echo "node test-group-operations.js"
echo "node test-user-status.js" 