#!/bin/sh
# Exit immediately if any command fails
set -e

echo "Starting PHP-FPM..."
php-fpm -D

echo "Starting Nginx..."
nginx -g "daemon off;"
