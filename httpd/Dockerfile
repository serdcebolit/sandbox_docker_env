FROM centos:7

ENV TZ="Europe/Moscow"

RUN rpm --import /etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-7 && \
    rpm --import https://dl.fedoraproject.org/pub/epel/RPM-GPG-KEY-EPEL-7 && \
    rpm -Uvh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm && \
    rpm --import http://rpms.famillecollet.com/RPM-GPG-KEY-remi && \
    rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-7.rpm && \
    yum update -y && yum install -y vim iproute2 procps-ng net-tools cronie mc git nano htop wget iotop telnet

ARG PHP_VERSION
ARG XDEBUG

RUN yum-config-manager --enable "remi-php$PHP_VERSION" \
    && curl https://packages.microsoft.com/config/rhel/7/prod.repo > /etc/yum.repos.d/mssql-release.repo \
    && ACCEPT_EULA=Y yum install -y \
    httpd httpd-tools sendmail ssmtp mailutils libxml2-dev msmtp msodbcsql17 mysql \
    php php-cli php-common \
    php-gd php-imap php-json php-ldap \
    php-mbstring php-mysqlnd php-opcache \
    php-pdo php-pear php-pear-DB \
    php-pecl-apcu php-pecl-apcu-bc php-pecl-geoip \
    php-pecl-mcrypt php-pecl-memcache php-pecl-rrd \
    php-pecl-ssh2 $XDEBUG php-pecl-zip \
    php-process php-pspell php-xml php-zipstream php-soap php-amqp \
    php-pecl-imagick php-sqlsrv \
    openssh-server \
    && yum clean all


RUN groupadd -g 600 bitrix \
    && useradd -g 600 -u 600 -p bitrix bitrix \
    && mkdir -p /tmp/php_sessions/www && chown -R bitrix:bitrix /tmp/php_sessions/www \
    && mkdir -p /tmp/php_upload/www && chown -R bitrix:bitrix /tmp/php_upload/www \
    && echo "+:bitrix: cron crond crontab" >> /etc/security/access.conf \
    && mkdir -p /var/spool/cron/ \
    && chown bitrix:bitrix -R /var/spool/cron \
    && mkdir -p /docker-entrypoint.d/ \
    && chown bitrix:bitrix -R /docker-entrypoint.d/

RUN curl --silent --show-error https://getcomposer.org/installer | php && mv composer.phar /usr/local/bin/composer

COPY apache-conf/ /etc/httpd/
COPY php/ /etc/php.d/
COPY ./entrypoint.sh /root/
COPY ./crontab.cfg /root/
COPY ./.msmtprc /home/bitrix/

RUN chown bitrix:bitrix /home/bitrix/.msmtprc \
    && chmod 600 /home/bitrix/.msmtprc

RUN if [[ "$PHP_VERSION" -lt "74" ]] ; then \
    mv /etc/php.d/mbstring.ini.disabled /etc/php.d/mbstring.ini ; \
    fi

RUN ln -sf /dev/stdout /var/log/httpd/access_log && ln -sf /dev/stderr /var/log/httpd/error_log

VOLUME /var/spool/cron/

WORKDIR /home/bitrix/www

EXPOSE 8887
EXPOSE 22

ENV HOME=/home/bitrix

# https://httpd.apache.org/docs/2.4/stopping.html#gracefulstop
STOPSIGNAL SIGWINCH

CMD ["httpd", "-DFOREGROUND"]
ENTRYPOINT ["/usr/bin/bash", "/root/entrypoint.sh"]