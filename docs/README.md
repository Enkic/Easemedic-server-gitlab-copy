# EaseMedic Server API

OpenAPI 3.0.2 specification of EaseMedic Server API.

## OpenAPI

We have written [OpenAPI.json](OpenAPI.json) file which fully defines how EaseMedic Server API work.
It respects the OpenAPI Specification v3.0.2 (formerly Swagger Specification).

If you want to read some documentation on OpenAPI :

-   https://swagger.io/docs/specification/about
-   https://en.wikipedia.org/wiki/OpenAPI_Specification
-   https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md
-   https://github.com/Redocly/redoc

## Start the server

```console
$ npm i
# replace <port> by a port, default 8080
$ npx redoc-cli serve --port <port> ./OpenAPI.json
```

## Bundle spec into zero-dependency HTML-file

```console
$ npm i
# replace <outputFile> by a filename, default redoc-static.html
$ npx redoc-cli bundle --output <outputFile> ./OpenAPI.json
```
