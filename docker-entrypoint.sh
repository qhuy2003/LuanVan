#!/bin/bash
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

php artisan key:generate --force
php artisan config:clear   # ✅ chỉ clear file config, an toàn

echo "Waiting for database..."
until php artisan db:show > /dev/null 2>&1; do
    echo "DB not ready, retrying in 3s..."
    sleep 3
done

echo "DB connected! Running migrations..."
php artisan migrate --force

# ✅ clear cache SAU khi migrate xong
php artisan cache:clear

echo "Starting server..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}