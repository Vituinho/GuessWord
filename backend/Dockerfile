# Use php:8.3-fpm-alpine as the base image
FROM php:8.3-fpm-alpine

# Install system dependencies and tools needed for PHP extensions and Composer
RUN apk add --no-cache \
    curl \
    git \
    unzip \
    libxml2-dev \
    postgresql-dev \
    oniguruma-dev \
    bash

# Install required PHP extensions
# Note: openssl, tokenizer, ctype, and json are already compiled into PHP by default.
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    xml \
    bcmath

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory inside the container
WORKDIR /var/www/html

# Copy backend files to the container
COPY . .

# Run composer install optimized for production
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Set proper permissions for Laravel directories
RUN chown -R www-data:www-data storage bootstrap/cache

# Expose port 10000 (Render.com standard)
EXPOSE 10000

# Start command using artisan serve on the specified host and port
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=10000"]
