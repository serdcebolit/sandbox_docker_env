#!/usr/bin/python3

import os
import sys
import shutil
import pandas as pd

sandboxes_path = '/home/bitrix/ext_www'

sandbox_table_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'sandboxes.csv')

spd = pd.read_csv(sandbox_table_path)
sandboxes_to_process = spd
print(sandboxes_to_process.head())
print(len(sandboxes_to_process.index))

def get_dict_from_env_file(path):
    with open(path) as f:
        return {k.split('=')[0]: k.split('=')[1] for k in f.read().split('\n')}

example_env_path = '/home/bitrix/docker_main_env/.env.example'
env_example = get_dict_from_env_file('/home/bitrix/docker_main_env/.env.example')
for index, row in sandboxes_to_process.iterrows():
    if pd.isna(row['Домен']):
        continue
    print(row['Домен'])
    sandbox_path = os.path.join(os.path.abspath(sandboxes_path), row['Домен'])
    sandbox_env_path = os.path.join(sandbox_path, '.env')

    sandbox_env = get_dict_from_env_file(os.path.join(sandbox_path, '.env'))
    for k in env_example:
        sandbox_env[k] = sandbox_env.get(k) if sandbox_env.get(k) else env_example[k]
    
    shutil.copy(example_env_path, sandbox_env_path + '.example')
    shutil.copy(sandbox_env_path, '/home/bitrix/env_backups/' + row['Домен'])
    with open(sandbox_env_path, 'w') as f:
        f.write('\n'.join('{}={}'.format(key, value) for key, value in sandbox_env.items()))
    
    print('--------------------------------------------------')
