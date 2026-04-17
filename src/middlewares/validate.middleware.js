const validateMiddleware = (schema = {}) => {
  return (req, res, next) => {
    try {
      if (typeof schema === 'function') {
        const maybeResult = schema(req);

        if (maybeResult && typeof maybeResult === 'object') {
          if (Object.prototype.hasOwnProperty.call(maybeResult, 'body')) req.body = maybeResult.body;
          if (Object.prototype.hasOwnProperty.call(maybeResult, 'query')) req.query = maybeResult.query;
          if (Object.prototype.hasOwnProperty.call(maybeResult, 'params')) req.params = maybeResult.params;
        }

        return next();
      }

      if (typeof schema.body === 'function') {
        const validatedBody = schema.body(req.body);
        if (validatedBody !== undefined) req.body = validatedBody;
      }

      if (typeof schema.query === 'function') {
        const validatedQuery = schema.query(req.query);
        if (validatedQuery !== undefined) req.query = validatedQuery;
      }

      if (typeof schema.params === 'function') {
        const validatedParams = schema.params(req.params);
        if (validatedParams !== undefined) req.params = validatedParams;
      }

      return next();
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || 'Dữ liệu yêu cầu không hợp lệ',
        details: error.details || undefined,
      });
    }
  };
};

module.exports = validateMiddleware;
