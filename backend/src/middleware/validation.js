const { BadRequestError } = require('./errorHandler');

// Middleware to validate UUID params
const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const value = req.params[paramName];
    
    if (value && !uuidRegex.test(value)) {
      return next(new BadRequestError(`Invalid format for parameter: ${paramName}`));
    }
    
    next();
  };
};

module.exports = {
  validateUUID
};
