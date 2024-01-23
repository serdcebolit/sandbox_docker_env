FROM centos:7

ENV TZ="Europe/Moscow"

ENV REPOF=/etc/yum.repos.d/bitrix.repo
ENV REPONAME=bitrix
ENV REPO=yum
ENV RELEASE_FILE=/etc/redhat-release

RUN rpm --import http://repos.1c-bitrix.ru/yum/RPM-GPG-KEY-BitrixEnv \
    && echo "[$REPONAME]" > $REPOF \
    && echo "name=\$OS \$releasever - \$basearch" >> $REPOF \
    && echo "failovermethod=priority" >> $REPOF \
    && echo "baseurl=https://repos.1c-bitrix.ru/$REPO/el/$(awk '{print $4}' $RELEASE_FILE | awk -F'.' '{print $1}')/\$basearch" >> $REPOF \
    && echo "enabled=1" >> $REPOF \
    && echo "gpgcheck=1" >> $REPOF \
    && echo "gpgkey=$GPGK" >> $REPOF

RUN groupadd -g 600 bitrix \
    && useradd -g 600 -u 600 --no-create-home -p bitrix bitrix \
    && chage -d 0 bitrix \
    && yum -y update  \
    && yum -y install initscripts bx-nginx gettext \
    && yum clean all

RUN mkdir -p /var/log/nginx && chown -R bitrix:bitrix /var/log/nginx && mkdir -p /etc/nginx/certs/ \
    && mkdir -p /docker-entrypoint.d/ \
    && chown bitrix:bitrix -R /docker-entrypoint.d/

RUN ln -sf /dev/stdout /var/log/nginx/access.log && ln -sf /dev/stderr /var/log/nginx/error.log

COPY ./conf/ /etc/nginx
COPY ./entrypoint.sh /root/
COPY ./bitrixenv_error /var/www/bitrixenv_error
COPY ./site.tmpl /etc/nginx/site.tmpl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
ENTRYPOINT ["/usr/bin/bash", "/root/entrypoint.sh"]