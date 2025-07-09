/**
 * Request validation middleware
 */

import { validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }

  next();
};

// Custom validators
export const customValidators = {
  isValidDate: value => {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date > new Date();
  },

  isValidEmail: value => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isValidUrl: value => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
};
