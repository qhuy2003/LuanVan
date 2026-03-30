#!/bin/bash
set -e

cat > .env << EOF
APP_NAME=Laravel
APP_ENV=production
APP_KEY=${APP_KEY}
APP_DEBUG=true
APP_URL=${APP_URL}
AUTH_GUARD=api

DB_CONNECTION=mysql
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

LOG_CHANNEL=stderr
LOG_LEVEL=debug
EOF

php artisan config:clear

echo "=== DB CONFIG ==="
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo "DB_DATABASE=$DB_DATABASE"
echo "DB_USERNAME=$DB_USERNAME"
echo "================="

echo "Waiting for database..."
until php -r "
    \$conn = @mysqli_connect(
        getenv('DB_HOST'),
        getenv('DB_USERNAME'),
        getenv('DB_PASSWORD'),
        getenv('DB_DATABASE'),
        (int)getenv('DB_PORT') ?: 3306
    );
    if (\$conn) { mysqli_close(\$conn); exit(0); }
    echo mysqli_connect_error() . PHP_EOL;
    exit(1);
"; do
    echo "DB not ready, retrying in 3s..."
    sleep 3
done

echo "DB connected!"
php artisan serve --host=0.0.0.0 --port=${PORT}