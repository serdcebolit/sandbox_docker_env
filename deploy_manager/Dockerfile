FROM alpine

RUN apk add --no-cache bash git openssh curl tar
RUN addgroup --gid "600" "bitrix" \
   && adduser \
    --disabled-password \
    --ingroup "bitrix" \
    --gecos "" \
    -u 600 \
    "bitrix"

WORKDIR /usr/src/app

COPY --chown=bitrix:bitrix ./scripts/ /usr/src/app/

RUN chmod -R u+x ./start.sh

# Обертка нужна для возможности работы с healthcheck
ENTRYPOINT bash /usr/src/app/start_wrapper.sh