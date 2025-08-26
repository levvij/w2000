FROM node:18-slim

# install git to run rev-parse
RUN apt-get update && apt-get install -y git

WORKDIR /usr/src/app
COPY . .

# build application
RUN npm ci
RUN cd server ; npm ci ; cd ..
RUN cd page ; npm ci ; cd ..
RUN npm run build

WORKDIR /usr/src/app/server
CMD [ "node", ".built/index.js" ]
