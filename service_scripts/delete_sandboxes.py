#!/usr/bin/python3

import os
import shutil
import pandas as pd

sandboxes_path = '/home/bitrix/ext_www'

sandbox_table_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sandboxes.csv')

def delete_by_csv(sandboxes_to_delete):
    for index, row in sandboxes_to_delete.iterrows():
        if pd.isna(row['Домен']):
            continue
        sandbox_path = os.path.join(os.path.abspath(sandboxes_path), row['Домен'])
        if os.path.exists(sandbox_path):
            shutil.rmtree(sandbox_path)
            print('[DELETED] Песочница {} удалена. Папка: {}'.format(row['Домен'], sandbox_path))
        else:
    #         os.mkdir(sandbox_path)
            print('[NOT_DELETED] Песочница {} уже удалена. Папка: {}'.format(row['Домен'], sandbox_path))

spd = pd.read_csv(sandbox_table_path)
sandboxes_to_delete = spd[spd['Судьба песочницы'] == 'Удалить с ivsand']
print(sandboxes_to_delete.head())
print(len(sandboxes_to_delete.index))
delete_by_csv(sandboxes_to_delete)