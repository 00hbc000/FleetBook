# Nginx écoute sur 8080 et s'exécute sans privilèges.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=101:101 index.html style.css app.js /usr/share/nginx/html/
USER 101
EXPOSE 8080
