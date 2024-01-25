FROM percona:5.6

ENV TZ="Europe/Moscow"

COPY ./conf.d/ /etc/mysql/conf.d/
COPY ./my.cnf /etc/my.cnf


USER root
RUN mkdir -p /var/log/mysql \
    && chown mysql:root -R /var/log/mysql \
    && chmod 0444 /etc/my.cnf \
    && chmod 775 -R /etc/mysql/conf.d/

USER mysql