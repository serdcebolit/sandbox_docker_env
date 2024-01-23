#!/usr/bin/env bash

set -e

# переносим значения переменных из текущего окружения
env | while read -r LINE; do  # читаем результат команды 'env' построчно
    # делим строку на две части, используя в качестве разделителя "=" (см. IFS)
    IFS="=" read VAR VAL <<< ${LINE}
    # удаляем все предыдущие упоминания о переменной, игнорируя код возврата
    sed --in-place "/^${VAR}/d" /etc/security/pam_env.conf || true
    # добавляем определение новой переменной в конец файла
    echo "${VAR} DEFAULT=\"${VAL}\"" >> /etc/security/pam_env.conf
done

# Пытаемся удалить pid-файл, если он есть
rm -rf /run/httpd/httpd.pid || true

#Запуск демона крона и установка дефолтного кронтаба
if [[ $(pgrep crond | wc -l) = 0 ]]; then
  crond -s -n &
fi
#Выдаем права на папку кроном
chown bitrix:bitrix -R /var/spool/cron
if [ ! -f /var/spool/cron/bitrix ]; then
    crontab -u bitrix /root/crontab.cfg
fi

#Выдаем права на папку с кастомными entrypoint-скриптами
chown bitrix:bitrix -R /docker-entrypoint.d/

#Перегенерация ssh-ключа и смена пароля, чтобы паролем можно было управлять через переменные окружения
cd /etc/ssh && ssh-keygen -A
cd /home/bitrix/www

if [[ -n $SSH_PASSWORD ]]; then
  echo "$SSH_PASSWORD" | passwd bitrix --stdin
fi

/usr/sbin/sshd -D &


if [ -d /home/bitrix/.ssh ]; then
  chown -R bitrix:bitrix /home/bitrix/.ssh
  chmod 700 /home/bitrix/.ssh
  if [[ $(ls /home/bitrix/.ssh | wc -l) -gt 0 ]]; then
    chmod -R 600 /home/bitrix/.ssh/*
  fi
fi

#Выдаем права на папку с логами
chown bitrix:bitrix -R /var/log/httpd

# Проверка владельца папки /home/bitrix/www
if [[ $(stat --format '%U:%G' /home/bitrix/www) != "bitrix:bitrix" ]]; then
  chown bitrix:bitrix /home/bitrix/www
fi

if [ -z "${ENTRYPOINT_QUIET_LOGS:-}" ]; then
    exec 3>&1
else
    exec 3>/dev/null
fi

if [ "$1" = "httpd" ]; then
    if /usr/bin/find "/docker-entrypoint.d/" -mindepth 1 -maxdepth 1 -type f -print -quit 2>/dev/null | read v; then
        echo >&3 "$0: /docker-entrypoint.d/ is not empty, will attempt to perform configuration"

        echo >&3 "$0: Looking for shell scripts in /docker-entrypoint.d/"
        find "/docker-entrypoint.d/" -follow -type f -print | sort -V | while read -r f; do
            case "$f" in
                *.sh)
                    if [ -x "$f" ]; then
                        echo >&3 "$0: Launching $f";
                        "$f"
                    else
                        # warn on shell scripts without exec bit
                        echo >&3 "$0: Ignoring $f, not executable";
                    fi
                    ;;
                *) echo >&3 "$0: Ignoring $f";;
            esac
        done

        echo >&3 "$0: Configuration complete; ready for start up"
    else
        echo >&3 "$0: No files found in /docker-entrypoint.d/, skipping configuration"
    fi
fi

exec "$@"