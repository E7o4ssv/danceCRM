#!/bin/bash

# Автоматизированный деплой дизайна на сервер
# Запускать на сервере: bash server-deploy.sh

set -e

ARCHIVE_NAME="dance-deploy-20250717-090015.tar.gz"

echo "🚀 Начинаем автоматизированный деплой дизайна..."

# Проверяем архив
if [ ! -f "/root/$ARCHIVE_NAME" ]; then
  echo "❌ Файл /root/$ARCHIVE_NAME не найден"
  echo "Загрузите архив командой:"
  echo "scp $ARCHIVE_NAME root@89.104.71.170:/root/"
  exit 1
fi

# 1. Создаем резервную копию
if [ -d "/root/dance" ]; then
  BACKUP_DIR="/root/dance-backup-$(date +%Y%m%d-%H%M%S)"
  echo "📦 Создаю резервную копию в $BACKUP_DIR"
  cp -r /root/dance "$BACKUP_DIR"
  echo "✅ Резервная копия создана"
fi

# 2. Останавливаем сервер
echo "⏹️  Останавливаю сервер..."
pm2 stop dance-school 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true
echo "✅ Сервер остановлен"

# 3. Распаковываем новую версию
echo "📦 Распаковываю новую версию..."
rm -rf /root/dance-new
mkdir /root/dance-new
cd /root
tar -xzf "$ARCHIVE_NAME" -C dance-new
echo "✅ Архив распакован"

# 4. Копируем .env
if [ -f "/root/dance/.env" ]; then
  cp /root/dance/.env /root/dance-new/.env
  echo "✅ .env скопирован"
else
  echo "⚠️  .env не найден, используйте env.example"
  if [ -f "/root/dance-new/env.example" ]; then
    cp /root/dance-new/env.example /root/dance-new/.env
  fi
fi

# 5. Переносим старую версию
if [ -d "/root/dance" ]; then
  OLD_DIR="/root/dance-old-$(date +%Y%m%d-%H%M%S)"
  mv /root/dance "$OLD_DIR"
  echo "✅ Старая версия перенесена в $OLD_DIR"
fi

# 6. Устанавливаем новую версию
mv /root/dance-new /root/dance
cd /root/dance

# 7. Проверяем production build
if [ -d "client/build" ]; then
  echo "✅ Production build найден"
else
  echo "❌ Production build не найден, создаю..."
  cd client
  npm install
  npm run build
  cd ..
fi

# 8. Устанавливаем серверные зависимости
echo "📦 Устанавливаю серверные зависимости..."
npm install

# 9. Запускаем сервер
echo "🚀 Запускаю сервер..."
pm2 start server/index.js --name "dance-school"

# 10. Проверяем статус
sleep 3
if pm2 list | grep -q "dance-school.*online"; then
  echo "✅ Сервер запущен успешно!"
else
  echo "❌ Проблема с запуском сервера"
  pm2 logs dance-school --lines 10
fi

echo ""
echo "🎯 ДЕПЛОЙ ЗАВЕРШЕН!"
echo ""
echo "Проверьте:"
echo "- Сайт: http://89.104.71.170:3001"
echo "- API: curl http://89.104.71.170:3001/api/health"
echo "- Логи: pm2 logs dance-school"
echo ""
echo "При проблемах восстановите из:"
echo "- $BACKUP_DIR"
echo "" 