const VALID_VEHICLE_STATUSES = ['AVAILABLE', 'BUSY', 'MAINTENANCE'];

export const validateVehicle = (req, res, next) => {
  const {
    vehicle_number,
    capacity,
    current_latitude,
    current_longitude,
    status = 'AVAILABLE',
  } = req.body;

  const errors = [];
  const isPut = req.method === 'PUT';

  // 1. vehicle_number validation
  if (!isPut || vehicle_number !== undefined) {
    if (!vehicle_number || typeof vehicle_number !== 'string' || vehicle_number.trim().length < 2) {
      errors.push('vehicle_number is required and must be at least 2 characters');
    }
  }

  // 2. capacity validation
  if (!isPut || capacity !== undefined) {
    const numCap = Number(capacity);
    if (capacity === undefined || capacity === null || isNaN(numCap) || numCap <= 0) {
      errors.push('capacity must be a valid positive number greater than 0');
    }
  }

  // 3. current_latitude validation
  const numLat = Number(current_latitude);
  if (
    current_latitude !== undefined &&
    current_latitude !== null &&
    (isNaN(numLat) || numLat < -90 || numLat > 90)
  ) {
    errors.push('current_latitude must be a valid coordinate between -90.0 and 90.0');
  }

  // 4. current_longitude validation
  const numLng = Number(current_longitude);
  if (
    current_longitude !== undefined &&
    current_longitude !== null &&
    (isNaN(numLng) || numLng < -180 || numLng > 180)
  ) {
    errors.push('current_longitude must be a valid coordinate between -180.0 and 180.0');
  }

  // 5. status validation
  let normalizedStatus = undefined;
  if (!isPut || status !== undefined) {
    normalizedStatus = typeof status === 'string' ? status.trim().toUpperCase() : 'AVAILABLE';
    if (!VALID_VEHICLE_STATUSES.includes(normalizedStatus)) {
      errors.push(`status must be one of: ${VALID_VEHICLE_STATUSES.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  req.validatedBody = {
    vehicle_number: vehicle_number ? vehicle_number.trim().toUpperCase() : undefined,
    capacity: capacity !== undefined ? Number(capacity) : undefined,
    current_latitude: current_latitude !== undefined ? numLat : undefined,
    current_longitude: current_longitude !== undefined ? numLng : undefined,
    status: normalizedStatus,
  };

  next();
};

export default validateVehicle;
