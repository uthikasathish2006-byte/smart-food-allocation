const VALID_STATUSES = ['PENDING', 'MATCHED', 'IN_TRANSIT', 'FULFILLED', 'CANCELLED'];

export const validateDemand = (req, res, next) => {
  const {
    location_id,
    required_quantity,
    people_count,
    urgency,
    status = 'PENDING',
  } = req.body;

  const errors = [];

  // 1. location_id validation
  const locId = parseInt(location_id, 10);
  if (location_id === undefined || isNaN(locId) || locId <= 0) {
    errors.push('location_id is required and must be a valid positive integer');
  }

  // 2. required_quantity validation
  const reqQty = Number(required_quantity);
  if (
    required_quantity === undefined ||
    required_quantity === null ||
    isNaN(reqQty) ||
    reqQty <= 0
  ) {
    errors.push('required_quantity must be a valid positive number greater than 0');
  }

  // 3. people_count validation
  const count = Number(people_count);
  if (
    people_count === undefined ||
    people_count === null ||
    isNaN(count) ||
    count < 0 ||
    !Number.isInteger(count)
  ) {
    errors.push('people_count must be a non-negative integer (>= 0)');
  }

  // 4. urgency validation (MUST be between 1 and 5)
  const urg = parseInt(urgency, 10);
  if (urgency === undefined || isNaN(urg) || urg < 1 || urg > 5) {
    errors.push('urgency is required and must be an integer between 1 and 5 (1-2 = LOW, 3 = MEDIUM, 4 = HIGH, 5 = CRITICAL)');
  }

  // 5. status validation
  const normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : 'PENDING';
  if (status && !VALID_STATUSES.includes(normalizedStatus)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  req.validatedBody = {
    location_id: locId,
    required_quantity: reqQty,
    people_count: count,
    urgency: urg,
    status: normalizedStatus,
  };

  next();
};

export default validateDemand;
