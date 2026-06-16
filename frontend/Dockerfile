FROM nginx:alpine

# Copy custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy static frontend assets
COPY . /usr/share/nginx/html

# Remove the configuration file from the public directory so Nginx doesn't try to serve it
RUN rm -f /usr/share/nginx/html/default.conf /usr/share/nginx/html/Dockerfile

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
