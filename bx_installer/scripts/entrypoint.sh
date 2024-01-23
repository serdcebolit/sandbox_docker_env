#!/bin/sh

if [ "$NEED_EXEC_MANAGER" -eq 0 ]; then
  echo "Not need exec manager"
  exit 0
fi

if [ "$MODE" != "install_bx" ]; then
  echo "Not need to install bitrix"
  exit 0
fi

chown -R bitrix:bitrix /usr/src/app/bxsetup_lib/screenshots/

exec su-exec bitrix:bitrix "$@"