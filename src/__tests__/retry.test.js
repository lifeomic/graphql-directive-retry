const { retryDirective, retryDeclaration } = require('../..');
const { makeExecutableSchema } = require('graphql-tools');
const { graphql } = require('graphql');

const typeDefs = `
  ${retryDeclaration('retry')}

  type Query {
    flakyConstant: String! @retry
    impatientConstant: String! @retry(retries: 0)
    flakyFunction(arg: String!): String! @retry
    pickyConstant: String! @retry(retries: 1, factor: 1, minTimeout: 1, maxTimeout: 1)
  }
`;

const DEFAULT_CONTEXT = {
  retryDirectiveConfig: {
    minTimeout: 1,
    maxTimeout: 2
  }
};

function buildSchema () {
  const resolvers = {
    Query: {
      flakyConstant: jest.fn()
        .mockRejectedValueOnce(new Error('The first time always fails'))
        .mockResolvedValue('Persistence pays off'),
      impatientConstant: jest.fn()
        .mockRejectedValueOnce(new Error('The first time always fails'))
        .mockResolvedValue('Persistence pays off'),
      flakyFunction: jest.fn()
        .mockRejectedValueOnce(new Error('The first time always fails'))
        .mockResolvedValue('Persistence pays off')
    }
  };

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,

    schemaDirectives: {
      retry: retryDirective
    }
  });

  return {resolvers, schema};
}

const QUERY_CONSTANT = `
  query {
    flakyConstant
  }
`;

test('resolvers will be retried', async () => {
  const { schema, resolvers } = buildSchema();
  const response = await graphql(
    schema,
    QUERY_CONSTANT,
    {},
    DEFAULT_CONTEXT,
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.flakyConstant;
  expect(resolverFunc).toHaveBeenCalledTimes(2);
});

test('arguments are passed to the resolver', async () => {
  const { schema, resolvers } = buildSchema();
  const response = await graphql(
    schema,
    `
      query {
        flakyFunction(arg: "hi")
      }
    `,
    {},
    DEFAULT_CONTEXT,
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.flakyFunction;
  expect(resolverFunc).toHaveBeenCalledTimes(2);
  expect(resolverFunc).toHaveBeenCalledWith({}, {arg: 'hi'}, expect.any(Object), expect.any(Object));
});

test('context is provided to the resolver', async () => {
  const { schema, resolvers } = buildSchema();
  const context = Object.assign({some: 'value'}, DEFAULT_CONTEXT);
  const response = await graphql(
    schema,
    QUERY_CONSTANT,
    {},
    context,
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.flakyConstant;
  expect(resolverFunc).toHaveBeenCalledTimes(2);
  expect(resolverFunc).toHaveBeenCalledWith({}, {}, context, expect.any(Object));
});

test('object is provided to the resolver', async () => {
  const { schema, resolvers } = buildSchema();
  const rootObject = {some: 'value'};
  const response = await graphql(
    schema,
    QUERY_CONSTANT,
    rootObject,
    DEFAULT_CONTEXT,
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.flakyConstant;
  expect(resolverFunc).toHaveBeenCalledTimes(2);
  expect(resolverFunc).toHaveBeenCalledWith(rootObject, {}, expect.any(Object), expect.any(Object));
});

test('info is provided to the resolver', async () => {
  const { schema, resolvers } = buildSchema();
  const response = await graphql(
    schema,
    QUERY_CONSTANT,
    {},
    DEFAULT_CONTEXT,
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.flakyConstant;
  expect(resolverFunc).toHaveBeenCalledTimes(2);
  expect(resolverFunc).toHaveBeenCalledWith({}, {}, expect.any(Object), expect.objectContaining({
    fieldName: 'flakyConstant',
    operation: expect.any(Object)
  }));
});

test('respects retry config in context', async () => {
  const { schema, resolvers } = buildSchema();
  const response = await graphql(
    schema,
    QUERY_CONSTANT,
    {},
    {retryDirectiveConfig: {
      retries: 0
    }},
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.flakyConstant;
  expect(resolverFunc).toHaveBeenCalledTimes(1);
});

test('respects retry config on the field', async () => {
  const { schema, resolvers } = buildSchema();
  const response = await graphql(
    schema,
    `
      query {
        impatientConstant
      }
    `,
    {},
    DEFAULT_CONTEXT,
    {}
  );

  expect(response).toMatchSnapshot();
  const resolverFunc = resolvers.Query.impatientConstant;
  expect(resolverFunc).toHaveBeenCalledTimes(1);
});
