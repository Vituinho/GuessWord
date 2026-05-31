# Use php:8.3-fpm-alpine as the base image
FROM php:8.3-fpm-alpine

# Install system dependencies, Nginx, and build tools
RUN apk add --no-cache \
    curl \
    git \
    unzip \
    libxml2-dev \
    postgresql-dev \
    oniguruma-dev \
    bash \
    nginx

# Install required PHP extensions
# Note: openssl, tokenizer, ctype, and json are already compiled into PHP by default.
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    xml \
    bcmath

# Configure Nginx to run as www-data instead of nginx user
RUN sed -i 's/user nginx;/user www-data;/g' /etc/nginx/nginx.conf

# Copy Nginx server configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

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

# Copy startup script and ensure it has Unix LF line endings and is executable
COPY start.sh /usr/local/bin/start.sh
RUN tr -d '\r' < /usr/local/bin/start.sh > /usr/local/bin/start_lf.sh && \
    mv /usr/local/bin/start_lf.sh /usr/local/bin/start.sh && \
    chmod +x /usr/local/bin/start.sh

# Expose port 10000 (Render.com standard)
EXPOSE 10000

# Start PHP-FPM and Nginx using our startup script
CMD ["/usr/local/bin/start.sh"]
