# EaseMedic Server

[![pipeline status](https://gitlab.com/easemedic/easemedic-server/badges/master/pipeline.svg)](https://gitlab.com/easemedic/easemedic-server/-/commits/master)
[![coverage report](https://gitlab.com/easemedic/easemedic-server/badges/master/coverage.svg)](https://gitlab.com/easemedic/easemedic-server/-/commits/master)

Easemedic est une solution de stockage d'ordonnance et de rappel de celles-ci.

## Project structure

Each subfolder contains its own README.md

```console
.
├── server - Back-end server with business logic of EaseMedic Server
└── docs   - OpenAPI 3.0.2 specification of EaseMedic Server API
```

## Development workflow

If you want to develop on the server, here is how to get started.

### 1. Prepare your environment

Here comes a little surprise: You need [Node.JS](http://nodejs.org) and [docker-compose](https://docs.docker.com/compose/).

### 2. Install the dependencies

```sh
$ npm install
$ cd server && npm install
$ cd docs && npm install
```

### 3. Expose the default database port

In the [docker-compose.yml](./docker-compose.yml), in the `db` service, add a field `ports` to expose the default database port.

> Attention, DON'T expose the database port in the production environment, so DON'T commit and push this.

The default PostgreSQL port is 5432.

```yml
ports:
    - '8081:5432'
```

### 4. Run database service

```sh
$ docker-compose up --build db
```

### 5. Running server for development

```sh
$ cd server
$ npm run dev
```

### 6. Generate the documentation.
When you have setup the controllers header you can run this command:
```sh
$ docker-compose up --build docs
```
The documentation will be available at http://localhost:8082/docs/

## Run EaseMedic Server for production

> Attention, check that the database port is not exposed.

```sh
ENV=prod docker-compose up --build
```

Based on [docker-compose.yml](./docker-compose.yml) :

- Server is running on [localhost:8080](localhost:8080)
- API documention is running on [localhost:8082](localhost:8082)

## Migrations

Migrations are generated with sequilize-cli.
In order to run the following commands you have to install npx by running
```sh
npm i -g npx
```

When updating a model you need to generate a new migration with the command
```sh
npx sequelize migration:create --name [name-of-the-migration]
```
.

It will generate a new file under the directory [migrations](./server/src/migrations). You then need to update it accordingly with the updates made to the model.

Finaly you need to run the command
```sh
npx sequelize db:migrate
```
to execute the new migration
.


## Contributing rules

### [Commitizen](github.com/commitizen/cz-cli)

-   `npm run commit`, prompt you to fill out any required commit fields at commit time, to format your commits messages. With [husky](github.com/typicode/husky) and [lint-staged](github.com/okonet/lint-staged), it also run linters on git staged files.

### [Prettier](github.com/prettier/prettier)

-   `npm run prettify`, lint all files following rules wrote in [.prettierrc](./.prettierrc).

### [Conventional-changelog / standard-version](https://github.com/conventional-changelog/standard-version)

-   `npm run release`, automate versioning and [CHANGELOG](./CHANGELOG.md) generation, with semver.org and conventionalcommits.org.
