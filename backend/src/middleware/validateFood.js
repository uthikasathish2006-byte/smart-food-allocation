const VALID_CATEGORIES = [
  'Prepared Meals',
  'Fresh Produce',
  'Baked Goods',
  'Dairy',
  'Grains',
  'Canned Goods',
  'Beverages',
  'Other',
];

export const validateFood = (req, res, next) => {
  const { food_name, category, quantity, unit, expiry_date, location_id } = req.body;
  const errors = [];

  // 1. food_name validation
  if (!food_name || typeof food_name !== 'string' || food_name.trim().length < 2) {
    errors.push('food_name is required and must be at least 2 characters');
  }

  // 2. category validation
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  // 3. quantity validation
  const numQty = Number(quantity);
  if (quantity === undefined || quantity === null || isNaN(numQty) || numQty <= 0) {
    errors.push('quantity must be a valid positive number greater than 0');
  }

  // 4. unit validation
  if (!unit || typeof unit !== 'string' || unit.trim().length === 0) {
    errors.push('unit is required (e.g. kg, meals, loaves, liters, packs, crates)');
  }

  // 5. expiry_date validation
  if (!expiry_date) {
    errors.push('expiry_date is required');
  } else {
    const parsedDate = new Date(expiry_date);
    if (isNaN(parsedDate.getTime())) {
      errors.push('expiry_date must be a valid ISO date/time string');
    }
  }

  // 6. location_id validation
  const locId = parseInt(location_id, 10);
  if (location_id === undefined || isNaN(locId) || locId <= 0) {
    errors.push('location_id is required and must be a valid positive integer');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  // Sanitize and attach validated data
  req.validatedBody = {
    food_name: food_name.trim(),
    category,
    quantity: numQty,
    unit: unit.trim(),
    expiry_date: new Date(expiry_date).toISOString(),
    location_id: locId,
  };

  next();
};

export default validateFood;
