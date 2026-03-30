#!/bin/bash
set -e

if [ ! -f .env ]; then
    cp .env.example .env
fi

# Ghi tất cả env vars quan trọng vào .env
echo "APP_KEY=${APP_KEY}" >> .env
echo "DB_HOST=${DB_HOST}" >> .env
echo "DB_PORT=${DB_PORT}" >> .env
echo "DB_DATABASE=${DB_DATABASE}" >> .env
echo "DB_USERNAME=${DB_USERNAME}" >> .env
echo "DB_PASSWORD=${DB_PASSWORD}" >> .env
echo "CACHE_DRIVER=${CACHE_DRIVER:-file}" >> .env
echo "SESSION_DRIVER=${SESSION_DRIVER:-file}" >> .env

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

### Đảm bảo Railway Variables có đủ
```
APP_KEY=base64:Z3TTj4ezRrAmqzvt9M8uVodoEkCKAbRriIvnoQfKe4I=
CACHE_DRIVER=file
SESSION_DRIVER=file