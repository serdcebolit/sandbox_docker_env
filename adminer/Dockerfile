FROM adminer:latest

USER root
RUN apt-get update && apt-get -y install php-curl && apt-get clean
USER adminer

COPY ./plugins/login-servers-edited.php /var/www/html/plugins/login-servers.php
COPY ./plugins-enabled/login-servers.php /var/www/html/plugins-enabled/login-servers.php