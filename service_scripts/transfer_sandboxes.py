#!/usr/bin/python3

import os
import sys
import shutil
import logging
import subprocess
import pandas as pd


# create logger
logger = logging.getLogger("ivsand_to_ivdev")
logger.setLevel(logging.DEBUG)

# create console handler and set level to debug
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter("[%(asctime)s]\t%(message)s")

# add formatter to ch
ch.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)

sandboxes_path = '/home/bitrix/ext_www'
# sandboxes_path = '../ext_www'

sandbox_table_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sandboxes.csv')


spd = pd.read_csv(sandbox_table_path)
sandboxes_to_process = spd[spd['Судьба песочницы'] == 'Перенести на ivdev за меня']
print(sandboxes_to_process.head())
print(len(sandboxes_to_process.index))


def transfer(domain):
    sandbox_path = os.path.join(os.path.abspath(sandboxes_path), domain)
    sandbox_new_path = sandbox_path.replace('.ivsand.ru', '.ivdev.ru')
    domain_part = domain.split('.')[0]
    old_volume_name = domain_part + 'ivandru_mysql_data'
    new_volume_name = domain_part + 'ivdevru_mysql_data'
    volume_tar_path = '/root/ivdev_transfer_mysql_volumes/{}_mysql_backup.tar.gz'.format(domain_part)

    logger.info("Начало создания архива для {}".format(domain_part))
    subprocess.Popen("docker run --rm --volumes-from {}_mysql -v /root/ivdev_transfer_mysql_volumes:/backup-dir -w /var/lib/mysql ubuntu tar zcvf /backup-dir/{}_mysql_backup.tar.gz .".format(domain_part, domain_part), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    if not os.path.exists(volume_tar_path):
        raise RuntimeError('Файл {} не найден'.format(volume_tar_path))
    logger.info("Конец создания архива для {}".format(domain_part))

    logger.info("Начало передачи архива для {}".format(domain_part))
    subprocess.Popen("rsync --progress --recursive -pgte ssh {} root@ivdev.ru:{}".format(volume_tar_path, volume_tar_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    check_external_file_result, err = subprocess.Popen("ssh root@ivdev.ru ls {} || exit 1".format(volume_tar_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    if len(err.decode('utf-8')) > 0:
        raise RuntimeError('Удаленный файл {} не найден'.format(volume_tar_path))
    logger.info("Конец передачи архива для {}".format(domain_part))

    logger.info("Начало распаковки архива для {}".format(domain_part))
    subprocess.Popen("ssh root@ivdev.ru mkdir -p '/var/lib/docker/volumes/{}/_data/'".format(new_volume_name), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    out, err= subprocess.Popen("ssh root@ivdev.ru tar -C '/var/lib/docker/volumes/{}/_data/' -xzvf {}".format(new_volume_name, volume_tar_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    if len(err.decode('utf-8')) > 0:
        raise RuntimeError('Не удалось распаковать архив {} на удаленном сервере: {}'.format(volume_tar_path, err.decode('utf-8')))
    logger.info("Конец распаковки архива для {}".format(domain_part))

    logger.info("Начало удаления архива для {}".format(domain_part))
    subprocess.Popen("rm -rf {}".format(volume_tar_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    subprocess.Popen("ssh root@ivdev.ru rm -rf {}".format(volume_tar_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    check_external_file_result, err = subprocess.Popen("ssh root@ivdev.ru ls {} && exit 1".format(volume_tar_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    if len(err.decode('utf-8')) == 0:
        raise RuntimeError('Удаленный файл {} не удалился'.format(volume_tar_path))
    logger.info("Конец удаления архива для {}".format(domain_part))

    logger.info("Фикс прав доступа и удаление лишних файлов {}".format(domain_part))
    subprocess.Popen("chown -R bitrix:bitrix {} {} {}".format(os.path.join(sandbox_path, 'backup_tmp'), os.path.join(sandbox_path, 'backend_cron'), os.path.join(sandbox_path, 'mysql_db_dump')), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    subprocess.Popen("rm -rf  {} {}".format(os.path.join(sandbox_path, 'backup_tmp/*'), os.path.join(sandbox_path, 'mysql_db_dump')), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    logger.info("Начало передачи файлов для {}".format(domain_part))
    subprocess.Popen("rsync --progress --recursive -pgte ssh {}/ bitrix@ivdev.ru:{}".format(sandbox_path, sandbox_new_path), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    logger.info("Конец передачи файлов для {}".format(domain_part))

    logger.info("Начало обновления окружения для {}".format(domain_part))
    subprocess.Popen("ssh bitrix@ivdev.ru cp /home/bitrix/docker_main_env/docker-compose.yml {}".format(os.path.join(sandbox_new_path, 'docker-compose.yml')), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    subprocess.Popen("ssh bitrix@ivdev.ru cp /home/bitrix/docker_main_env/.env.example {}".format(os.path.join(sandbox_new_path, '.env.example')), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
    logger.info("Конец обновления окружения для {}".format(domain_part))

    logger.info("------------------------------------------\n\n")

for index, row in sandboxes_to_process.iterrows():
    if pd.isna(row['Домен']):
        continue
    sandbox_path = os.path.join(os.path.abspath(sandboxes_path), row['Домен'])
    if os.path.exists(sandbox_path):
        transfer(row['Домен'])
    else:
        logger.info('Песочница {} уже удалена. Папка: {}'.format(row['Домен'], sandbox_path))
