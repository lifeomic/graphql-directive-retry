# graphql-directive-retry

[![npm](https://img.shields.io/npm/v/@lifeomic/graphql-directive-retry.svg)](https://www.npmjs.com/package/@lifeomic/graphql-directive-retry)
[![Greenkeeper badge](https://badges.greenkeeper.io/lifeomic/graphql-directive-retry.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/lifeomic/graphql-directive-retry.svg?branch=master)](https://travis-ci.org/lifeomic/graphql-directive-retry)
[![Coverage Status](https://coveralls.io/repos/github/lifeomic/graphql-directive-retry/badge.svg?branch=master)](https://coveralls.io/github/lifeomic/graphql-directive-retry?branch=master)

Instead of adding retry logic inside the resolver implementation, use this
schema directive to add retry declaratively

## Usage

```js
const { retryDirective, retryDeclaration } = require('@lifeomic/graphql-directive-retry');
const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');

const typeDefs = `
  ${retryDeclaration('retry')}

  type Query {
    flakyFunction(arg: String!): String! @retry(maxTimeout: 100)
  }
`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,

  schemaDirectives: {
    retry: retryDirective
  }
});
```

### Customizing timeout behavior

This directive is based on [promise-retry](https://github.com/IndigoUnited/node-promise-retry#readme)
and you can use the same configuration options.

#### Field Config

You can configure retry behavior on a per-field basis like this:

```
type Query {
  flakyFunction(arg: String!): String!
    @retry(retries: 1, minTimeout: 100, maxTimeout: 200, factor: 1.1)
}
```

#### Global Config

You can configure the default retry behavior for all resovlers with a retry
directive by providing the configuration in the execution context. Here is
an example:

```js
const response = await graphql(
  yourSchema,
  yourQuery,
  rootObject,
  {
    ... yourContext
    retryDirectiveConfig: {
      retries: 0
    }
  },
  {}
);
```
