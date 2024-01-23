FROM node:20.6-alpine

ENV NODE_VERSION 20.6.0

RUN addgroup --gid "600" "bitrix" \
   && adduser \
    --disabled-password \
    --ingroup "bitrix" \
    --gecos "" \
    -u 600 \
    "bitrix"

ENV CHROME_BIN="/usr/bin/chromium-browser" \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD="true"
RUN set -x \
    && apk update \
    && apk upgrade \
    && apk add --no-cache \
    udev \
    ttf-freefont \
    chromium \
    mysql-client \
    su-exec

WORKDIR /usr/src/app

COPY --chown=bitrix:bitrix ./scripts/ /usr/src/app/

RUN chmod -R u+x ./start.sh ./entrypoint.sh \
    && mkdir -p /usr/src/app/bxsetup_lib/screenshots/  \
    && chown -R bitrix:bitrix /usr/src/app/bxsetup_lib/screenshots/

ENTRYPOINT ["/usr/src/app/entrypoint.sh"]
CMD ["/usr/src/app/start.sh"]