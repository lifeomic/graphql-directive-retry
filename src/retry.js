const promiseRetry = require('promise-retry');

const { SchemaDirectiveVisitor } = require('graphql-tools');

class retryDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const retryDirectiveConfig = `${this.name}DirectiveConfig`;

    const originalResolver = field.resolve;
    field.resolve = (obj, args, context, info) => {
      const attempt = async (retry) => {
        try {
          return await originalResolver(obj, args, context, info);
        } catch (error) {
          retry(error);
        }
      };

      // The `retryDirectiveConfig` is based on the from the schema
      // directive name and that name is restricted to valid schema identifiers
      // eslint-disable-next-line security/detect-object-injection
      const retryConfig = Object.assign({}, this.args, context[retryDirectiveConfig]);
      return promiseRetry(attempt, retryConfig);
    };
  }
}

exports.retryDeclaration = (name) => `directive @${name}(retries: Int, minTimeout: Int, maxTimeout: Int, factor: Int) on FIELD_DEFINITION`;
exports.retryDirective = retryDirective;
