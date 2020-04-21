ARG PHP_IMAGE_TAG=7.2-fpm-stretch
FROM php:${PHP_IMAGE_TAG}

LABEL maintainer="GHIFARI160 <ghifari@ghifari160.com>"

ENV BUILD_DEPS \
        zlib1g-dev \
        git \
        libgmp-dev \
        unzip \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        build-essential \
        chrpath \
        libssl-dev \
        libxft-dev \
        libfreetype6 \
        libfontconfig1 \
        libfontconfig1-dev

RUN apt update \
    && apt install -y --no-install-recommends ${BUILD_DEPS} \
    && ln -s /usr/include/x86_64-linux-gnu/gmp.h /usr/local/include/ \
    && docker-php-ext-configure gd --with-freetype-dir=/usr/include --with-jpeg-dir=/usr/include/ \
    && docker-php-ext-configure gmp \
    && docker-php-ext-install iconv mbstring pdo pdo_mysql zip gd gmp opcache \
    && pecl install xdebug-2.8.1 \
    && docker-php-ext-enable xdebug \
    && rm -rf /var/lib/apt/lists/*

RUN { \
        echo "opcache.memory_consumption=128"; \
        echo "opcache.interned_strings_buffer=8"; \
        echo "opcache.max_accelerated_files=4000"; \
        echo "opcache.revalidate_freq=60"; \
        echo "opcache.fast_shutdown=1"; \
        echo "opcache.enable_cli=1"; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

EXPOSE 9000
CMD [ "php-fpm" ]