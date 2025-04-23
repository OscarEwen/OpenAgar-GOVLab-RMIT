FROM node:14-alpine

# install python, pip and dependencies for bots
RUN apk add --no-cache python3 py3-pip
RUN pip3 install --no-cache-dir python-socketio requests websocket-client

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install && npm cache clean --force

COPY . /usr/src/app

CMD [ "npm", "start" ]

HEALTHCHECK --interval=5m --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

EXPOSE 3000