#!/bin/sh

if [ -n "$(pgrep -f  "/usr/src/app/start.sh")" ]
then
  exit 1
else
  exit 0
fi
