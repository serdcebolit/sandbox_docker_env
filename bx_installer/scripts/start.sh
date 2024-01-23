#!/bin/sh

print_ok() {
  echo -en "\033[37;1;42m[OK]\033[0m $1 \n"
}
print_err() {
  echo -en "\033[37;1;41m[ERROR]\033[0m $1 \n"
}
print_info() {
  echo -en "\033[37;1;44m[INFO]\033[0m $1 \n"
}

clean_up_bitrixsetup_file() {
  print_info "Start clean up bitrixsetup file"
  rm -f "$PROJECT_PATH/bitrixsetup.php"
  print_info "End clean up bitrixsetup file"
}

download_bitrixsetup() {
  BITRIXSETUP_LINK="https://www.1c-bitrix.ru/download/scripts/bitrixsetup.php"

  print_info "Start downloading bitrixsetup.php"
  wget --no-check-certificate "$BITRIXSETUP_LINK" -P $PROJECT_PATH
  print_ok "bitrixsetup.php downloaded"
}

print_info "ready to start"
if [ -d "$PROJECT_PATH/bitrix/" ]; then
  echo "bitrix does exist. Exit!"
  exit 0
fi
clean_up_bitrixsetup_file
download_bitrixsetup
cd "$DOC_ROOT/bxsetup_lib"
npm install puppeteer
print_info "npm: puppeteer installed"
node $DOC_ROOT/bxsetup_lib/index.js -d=nginx:80 -ed=$BX_REDACTION -em=$OWNER_EMAIL -p=$BX_ADMIN_PASSWORD -dbl=$DB_LOGIN -dbn=$DB_NAME -dbp=$DB_PASSWORD && print_ok "bitrix installed" || print_err "bitrix not installed"
