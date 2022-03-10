FROM node:erbium

LABEL maintainer="Enki Corbin <enki.corbin@epitech.eu>"

RUN mkdir -p /app && mkdir -p /apidoc
ADD package.json /app
WORKDIR /app
RUN npm install
ENV NODE_PATH=/app/node_modules

COPY . /app/

CMD npx mock -p 5000 -w ./src/
