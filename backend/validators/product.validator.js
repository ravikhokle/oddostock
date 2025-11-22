import Joi from 'joi';

// Product validation schemas
export const createProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name cannot exceed 100 characters'
    }),
  
  sku: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .required()
    .messages({
      'string.empty': 'SKU is required',
      'string.min': 'SKU must be at least 1 character',
      'string.max': 'SKU cannot exceed 50 characters'
    }),
  
  category: Joi.string()
    .required()
    .messages({
      'string.empty': 'Category is required'
    }),
  
  unitOfMeasure: Joi.string()
    .valid('pcs', 'box', 'kg', 'liter', 'meter')
    .default('pcs')
    .messages({
      'any.only': 'Unit of measure must be one of: pcs, box, kg, liter, meter'
    }),
  
  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price must be greater than or equal to 0',
      'any.required': 'Price is required'
    }),
  
  initialStock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Initial stock must be a number',
      'number.min': 'Initial stock must be greater than or equal to 0'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    })
});

export const updateProductSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.min': 'Product name must be at least 1 character',
      'string.max': 'Product name cannot exceed 100 characters'
    }),
  
  sku: Joi.string()
    .trim()
    .min(1)
    .max(50)
    .optional()
    .messages({
      'string.empty': 'SKU cannot be empty',
      'string.min': 'SKU must be at least 1 character',
      'string.max': 'SKU cannot exceed 50 characters'
    }),
  
  category: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Category cannot be empty'
    }),
  
  unitOfMeasure: Joi.string()
    .valid('pcs', 'box', 'kg', 'liter', 'meter')
    .optional()
    .messages({
      'any.only': 'Unit of measure must be one of: pcs, box, kg, liter, meter'
    }),
  
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price must be greater than or equal to 0'
    }),
  
  initialStock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Initial stock must be a number',
      'number.min': 'Initial stock must be greater than or equal to 0'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  isActive: Joi.boolean()
    .optional()
});

// Validation middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    req.body = value;
    next();
  };
};