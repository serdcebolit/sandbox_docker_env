#!/bin/bash

if [ "$NEED_EXEC_MANAGER" -eq 0 ]; then
  echo "Not need exec manager"
  exit 0
fi

if [ -z "$DOC_ROOT" ]; then
  DOC_ROOT=$(dirname "$(realpath "$0")")
fi

BACKUP_TMP_DIR_NAME="backup_tmp"
BACKUP_TMP_DIR="$DOC_ROOT/$BACKUP_TMP_DIR_NAME"

DBCONN_FILE_PATH="$PROJECT_PATH/bitrix/php_interface/dbconn.php"
SETTINGS_FILE_PATH="$PROJECT_PATH/bitrix/.settings.php"

mkdir -p "$BACKUP_TMP_DIR"

print_ok() {
  echo -en "\033[37;1;42m[OK]\033[0m $1 \n"
}
print_err() {
  echo -en "\033[37;1;41m[ERROR]\033[0m $1 \n"
}
print_info() {
  echo -en "\033[37;1;44m[INFO]\033[0m $1 \n"
}

clean_up_backup_tmp_dir() {
  print_info "Start clean up backup tmp directory"
  rm -rf "$BACKUP_TMP_DIR/*"
  print_info "End clean up backup tmp directory"
}

download_backup() {
  print_info "Start downloading backup"
  clean_up_backup_tmp_dir

  if [ -z "$BACKUP_LINK" ]; then
    print_err "Empty backup link"
    exit 1
  fi

  wget --no-check-certificate "$BACKUP_LINK" -P $BACKUP_TMP_DIR

  #На всякий случай ограничим количество архивов
  for ((i = 1; i < 200 ; i++)); do
    print_info "$BACKUP_LINK.$i"
    if ! wget --no-check-certificate --spider "$BACKUP_LINK.$i"; then
      print_info "File $BACKUP_LINK.$i does not exist"
      break
    fi
    wget --no-check-certificate "$BACKUP_LINK.$i" -P $BACKUP_TMP_DIR
  done

  print_ok "Backup archives downloaded"
}

extract_archive_to_project_dir() {
  print_info "Start extract backup archives"
  CURRENT_PATH=$(dirname "$(realpath "$0")")
  cd $BACKUP_TMP_DIR
  if ! cat *$(ls -v *tar.gz*) | tar zvxf - -i -C "$PROJECT_PATH/"; then
    print_err "Can not extract backup archives"
    exit 1
  fi
  print_info "Start change doc root owner"
  chown -R bitrix:bitrix "$PROJECT_PATH/" || print_err "Error while trying to change owner"
  print_info "Finish change doc root owner"
  cd $CURRENT_PATH
  print_ok "Backup archives extracted"
  clean_up_backup_tmp_dir
}

move_sql_dump() {
  print_info "Start move sql dump to entrypoint dir"
  find "$PROJECT_PATH/bitrix/backup" -name '*.sql' -exec mv {} "$DB_ENTRYPOINT_PATH/" \;
  find "$PROJECT_PATH/bitrix/backup" -name '*.sql*' -exec mv {} "$DB_ENTRYPOINT_PATH/" \;
  echo "SET GLOBAL sql_mode = '';" > "$DB_ENTRYPOINT_PATH/0.sql"

  AFTER_CONNECT_FILE=$(find "$DB_ENTRYPOINT_PATH" -name '*_after_connect.sql' | head -n 1)
  if [ -n "$AFTER_CONNECT_FILE" ]; then
    sed -i "s/<DATABASE>/$DB_NAME/g" "$AFTER_CONNECT_FILE"
    cat "$AFTER_CONNECT_FILE" >> "$DB_ENTRYPOINT_PATH/0.sql"
    rm -rf "$AFTER_CONNECT_FILE"
    print_info "After connect file content modified"
  fi
  print_ok "SQL dump copied into $DB_ENTRYPOINT_PATH"
}

setup_shh_key() {
  print_info "Start setup ssh key"
  chmod 700 /root/.ssh && \
  chmod 644 /root/.ssh/id_rsa.pub && \
  chmod 600 /root/.ssh/id_rsa && \
    echo '    StrictHostKeyChecking no' >>/etc/ssh/ssh_config && \
    echo '    IdentityFile /root/.ssh/id_rsa' >>/etc/ssh/ssh_config
  print_ok "Ssh key setupped"
}

clone_repo() {
  print_info "Start cloning repo $REPO"
  if ! git clone $REPO $PROJECT_PATH; then
    print_err "Can not clone repo to $PROJECT_PATH"
    exit 1
  fi
  chown bitrix:bitrix -R $PROJECT_PATH
  print_ok "Repo successful cloned"
}

function update_site_settings() {
  file_path=$SETTINGS_FILE_PATH
  cp -f $file_path "$file_path.bak"
  chown bitrix:bitrix "$file_path.bak"

  tmp_path="$file_path.tmp"
  start_line=$(grep -n "MysqliConnection" $file_path | awk -F':' '{print $1}')

  {
    head -n $start_line $file_path
    echo "							'host' => '$DB_HOST',"
    echo "							'database' => '$DB_NAME',"
    echo "							'login' => '$DB_LOGIN',"
    echo "							'password' => '$DB_PASSWORD',"
    tail -n +$(($start_line + 5)) $file_path
  } >$tmp_path
  mv -f $tmp_path $file_path
  chown bitrix:bitrix "$file_path"
}

function update_site_dbconn() {
  file_path=$DBCONN_FILE_PATH
  cp -f $file_path "$file_path.bak"

  tmp_path="$file_path.tmp"
  start_line=$(grep -n "DBHost" $file_path | awk -F':' '{print $1}')

  {
    head -n $(($start_line - 1)) $file_path
    echo "\$DBHost = '$DB_HOST';"
    echo "\$DBLogin = '$DB_LOGIN';"
    echo "\$DBPassword = '$DB_PASSWORD';"
    echo "\$DBName = '$DB_NAME';"
    tail -n +$(($start_line + 4)) $file_path
  } >$tmp_path
  mv -f $tmp_path $file_path
}

print_info "MODE: $MODE"

case $MODE in

backup_restore)

  if [ -z "$BACKUP_LINK" ] && [ -n "$(find "$BACKUP_TMP_DIR" -name '*.tar.gz')" ]; then
    extract_archive_to_tmp_dir
  elif [ -n "$BACKUP_LINK" ]; then
    download_backup
    extract_archive_to_project_dir
  else
    print_err "Can not find any backups by link or in tmp directory"
    exit 1
  fi
  move_sql_dump

  print_info "Start changing db connection settings"

  update_site_settings
  update_site_dbconn

  print_ok "Db connection settings changed"
  ;;

repo_deploy)
  setup_shh_key
  clone_repo
  ;;

install_bx)
  print_info "install_bx"
  #TODO: set is need install bx
  ;;

*)
  print_err "Unknown mode"
  ;;
esac

print_ok "Done"

exit 0
