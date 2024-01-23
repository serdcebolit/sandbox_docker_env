FROM centos:7

WORKDIR /usr/src/app

RUN yum update -y \
    && yum install -y wget python python-pip python-dev bash \
    && yum clean all

RUN wget https://github.com/nginx-proxy/docker-gen/releases/download/0.8.1/docker-gen-alpine-linux-amd64-0.8.1.tar.gz \
    && tar xvzf docker-gen-alpine-linux-amd64-0.8.1.tar.gz -C /usr/local/bin \
    && mkdir -p /usr/src/app/sshpiper_config \
    && chmod -R 700 /usr/src/app/sshpiper_config

RUN groupadd -g 600 bitrix \
    && useradd -g 600 -u 600 -p bitrix bitrix \
    && mkdir -p /tmp/ && chown -R bitrix:bitrix /tmp \
    && mkdir -p /etc/ssh \
    && touch /etc/ssh/ssh_host_rsa_key \
    && chown bitrix:bitrix /etc/ssh/ssh_host_rsa_key

ADD . /usr/src/app

ENV DOCKER_HOST unix:///var/run/docker.sock

CMD docker-gen -interval 10 -watch -notify "su -c 'python /tmp/register.py' bitrix" ssproxy.tmpl /tmp/register.py