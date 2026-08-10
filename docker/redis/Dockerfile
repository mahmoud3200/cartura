FROM redis:8-alpine

COPY redis.conf /usr/local/etc/redis/redis.conf

EXPOSE 6379

HEALTHCHECK --interval=5s --timeout=3s --retries=10 \
  CMD redis-cli ping | grep PONG || exit 1

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
