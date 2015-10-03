# Official node base image
FROM node:slim

# Maintainer
MAINTAINER Ritesh Sangwan <sangwan.ritesh@yahoo.in>

# install supervisor
RUN apt-get update && apt-get install -y supervisor

# copy the supervisor conf file
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Bundle app source
COPY . /rate-my-ride-users-api

# configure the npmrc file
RUN echo "//registry.npmjs.org/:_authToken=NPM_TOKEN" > ~/.npmrc

# Install app dependencies
RUN cd /rate-my-ride-users-api; npm install

# expose environment variable
EXPOSE 3300

# create log mount point
VOLUME /var/log /var/log

# start supervisor
CMD ["/usr/bin/supervisord"]