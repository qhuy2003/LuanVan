#!/bin/bash
set -e

# Tạo .env từ example
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Ghi đè toàn bộ config cần thiết
cat > .env << EOF
APP_NAME=Laravel
APP_ENV=production
APP_KEY=${APP_KEY:-base64:Z3TTj4ezRrAmqzvt9M8uVodoEkCKAbRriIvnoQfKe4I=}
APP_DEBUG=false
APP_URL=${APP_URL:-http://localhost}

DB_CONNECTION=mysql
DB_HOST=${DB_HOST:-mysql.railway.internal}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-railway}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-${MYSQL_ROOT_PASSWORD}}

SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

LOG_CHANNEL=stderr
LOG_LEVEL=debug
PORT=${PORT:-8000}
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
echo "Starting server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
```

---

### Railway Variables cần có
```
APP_KEY=base64:Z3TTj4ezRrAmqzvt9M8uVodoEkCKAbRriIvnoQfKe4I=
APP_URL=https://luanvan-production-4c74.up.railway.app
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=azmECjBBVgkeXPCDEsavsxKUTvIBfXuq