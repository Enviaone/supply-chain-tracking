const Joi = require('joi');
const { apiResponse } = require('./response');

const validateRequest = (schema, source = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map((detail) => detail.message);
            return apiResponse(res, 400, 'Validation Error', errorMessages);
        }
        
        // Replace request object with validated values (strip unknown fields, type casting etc based on Joi configuration)
        req[source] = value;
        next();
    };
};

module.exports = validateRequest;
