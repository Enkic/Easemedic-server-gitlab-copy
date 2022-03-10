FROM node:erbium

LABEL maintainer="Pacôme Françon <pacome.francon@epitech.eu>"

RUN mkdir -p /app
ADD package.json /app
WORKDIR /app
RUN npm install
ENV NODE_PATH=/app/node_modules

COPY . /app/

CMD npx redoc-cli serve --port 8080 ./OpenAPI.json
