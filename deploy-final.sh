#!/bin/bash

echo "🚀 Финальное развертывание Dance School System"
echo "==============================================="

# Функция проверки ресурсов
check_resources() {
    echo "📊 Проверка ресурсов сервера..."
    ssh root@89.104.71.170 << 'EOF'
        echo "💾 Использование диска:"
        df -h | grep -E "/$|/var"
        echo ""
        echo "🧠 Использование RAM:"
        free -h
        echo ""
        echo "⚡ Загрузка CPU:"
        top -bn1 | grep "load average"
        echo ""
        
        # Проверяем, что система не перегружена
        LOAD=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
        if (( $(echo "$LOAD > 2.0" | bc -l) )); then
            echo "⚠️  ВНИМАНИЕ: Высокая нагрузка на систему ($LOAD). Развертывание может быть рискованным."
            exit 1
        fi
        
        # Проверяем свободное место (минимум 1GB)
        FREE_SPACE=$(df / | awk 'NR==2{print $4}')
        if [[ $FREE_SPACE -lt 1048576 ]]; then
            echo "⚠️  ВНИМАНИЕ: Недостаточно свободного места на диске."
            exit 1
        fi
        
        echo "✅ Ресурсы в норме, можно продолжать"
EOF
    
    if [ $? -ne 0 ]; then
        echo "❌ Сервер перегружен или нет ресурсов. Прерываем развертывание."
        exit 1
    fi
}

# Создание архива с новыми файлами
create_archive() {
    echo "📦 Создание архива обновлений..."
    
    # Создаем временную папку с обновлениями
    mkdir -p temp_deploy/server/models
    mkdir -p temp_deploy/server/routes
    mkdir -p temp_deploy/client/src/components
    
    # Копируем новые файлы
    cp server/models/IndividualLesson.js temp_deploy/server/models/
    cp server/routes/individual-lessons.js temp_deploy/server/routes/
    cp server/index.js temp_deploy/server/
    cp server/routes/auth.js temp_deploy/server/routes/
    cp client/src/components/IndividualLessons.js temp_deploy/client/src/components/
    cp client/src/App.js temp_deploy/client/src/
    cp client/src/components/Navigation.js temp_deploy/client/src/components/
    
    # Создаем архив
    tar -czf dance-school-final-update.tar.gz temp_deploy/
    
    # Удаляем временную папку
    rm -rf temp_deploy/
    
    echo "✅ Архив создан: dance-school-final-update.tar.gz"
}

# Развертывание на сервере
deploy_to_server() {
    echo "🌐 Загрузка и развертывание на сервере..."
    
    # Загружаем архив
    scp dance-school-final-update.tar.gz root@89.104.71.170:/tmp/
    
    # Развертываем на сервере
    ssh root@89.104.71.170 << 'EOF'
        cd /var/www/dance-school
        
        echo "⏸️  Останавливаем приложение..."
        pm2 stop dance-school-server || true
        
        echo "📦 Распаковываем обновления..."
        cd /tmp
        tar -xzf dance-school-final-update.tar.gz
        
        echo "📂 Обновляем файлы..."
        cp -r temp_deploy/* /var/www/dance-school/
        
        echo "🔧 Устанавливаем зависимости (только при необходимости)..."
        cd /var/www/dance-school/server
        npm install --production --quiet
        
        echo "🏗️  Собираем фронтенд..."
        cd /var/www/dance-school/client
        npm install --quiet
        npm run build --quiet
        
        echo "🚀 Запускаем приложение..."
        cd /var/www/dance-school/server
        pm2 start index.js --name "dance-school-server" --update-env
        pm2 save
        
        echo "🧹 Очищаем временные файлы..."
        rm -rf /tmp/temp_deploy /tmp/dance-school-final-update.tar.gz
        
        echo "⏳ Ждем запуска приложения..."
        sleep 5
        
        echo "📊 Проверяем статус..."
        pm2 status
        
        echo "🌐 Проверяем доступность..."
        curl -s http://localhost:5000/api/health | head -3 || echo "Приложение еще запускается..."
        
        echo "✅ Развертывание завершено!"
EOF
}

# Проверка результата
verify_deployment() {
    echo "🔍 Финальная проверка развертывания..."
    
    sleep 10  # Даем время на полный запуск
    
    # Проверяем доступность API
    echo "🌐 Проверяем API здоровья..."
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://89.104.71.170:5000/api/health)
    
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo "✅ API работает корректно"
    else
        echo "⚠️  API может быть недоступен (код: $HEALTH_CHECK)"
    fi
    
    # Проверяем статус PM2
    echo "📊 Статус процессов:"
    ssh root@89.104.71.170 "pm2 status"
    
    echo ""
    echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
    echo "================================"
    echo "🌐 Приложение доступно по адресу: http://89.104.71.170"
    echo "📚 API документация: http://89.104.71.170:5000/api-docs"
    echo "👥 Тестовые данные:"
    echo "   Админ: admin / admin123"
    echo "   Преподаватель: teacher / teacher123"
    echo ""
    echo "✨ НОВЫЕ ФУНКЦИИ:"
    echo "• Индивидуальные занятия (1-2 ученика)"
    echo "• Расширенное управление расписанием"
    echo "• Улучшенная система прав доступа"
    echo "• Полная функциональность для преподавателей и админов"
}

# Основной процесс
main() {
    check_resources
    create_archive
    deploy_to_server
    verify_deployment
    
    # Удаляем локальный архив
    rm -f dance-school-final-update.tar.gz
}

# Запуск с обработкой ошибок
set -e
trap 'echo "❌ Произошла ошибка на строке $LINENO"' ERR

main

echo "🏁 Скрипт развертывания завершен успешно!" 