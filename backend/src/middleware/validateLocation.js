const VALID_LOCATION_TYPES = [
  'COMMUNITY_KITCHEN',
  'SCHOOL',
  'SHELTER',
  'RELIEF_CENTER',
  'HOSPITAL',
];

export const validateLocation = (req, res, next) => {
  const {
    name,
    type,
    population = 0,
    capacity = 0,
    latitude,
    longitude,
    contact_person = '',
    contact_phone = '',
  } = req.body;

  const errors = [];

  // 1. Name validation
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }

  // 2. Type validation
  const normalizedType = typeof type === 'string' ? type.trim().toUpperCase() : '';
  if (!normalizedType || !VALID_LOCATION_TYPES.includes(normalizedType)) {
    errors.push(`Type must be one of: ${VALID_LOCATION_TYPES.join(', ')}`);
  }

  // 3. Population validation
  const numPopulation = Number(population);
  if (isNaN(numPopulation) || numPopulation < 0 || !Number.isInteger(numPopulation)) {
    errors.push('Population must be a non-negative integer (>= 0)');
  }

  // 4. Capacity validation
  const numCapacity = Number(capacity);
  if (isNaN(numCapacity) || numCapacity < 0) {
    errors.push('Capacity must be a non-negative number (>= 0)');
  }

  // 5. Latitude validation
  const numLat = Number(latitude);
  if (latitude === undefined || latitude === null || isNaN(numLat) || numLat < -90 || numLat > 90) {
    errors.push('Latitude is required and must be a valid coordinate between -90.0 and 90.0');
  }

  // 6. Longitude validation
  const numLng = Number(longitude);
  if (longitude === undefined || longitude === null || isNaN(numLng) || numLng < -180 || numLng > 180) {
    errors.push('Longitude is required and must be a valid coordinate between -180.0 and 180.0');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors,
    });
  }

  // Attach sanitized fields to req.validatedBody
  req.validatedBody = {
    name: name.trim(),
    type: normalizedType,
    population: numPopulation,
    capacity: numCapacity,
    latitude: numLat,
    longitude: numLng,
    contact_person: typeof contact_person === 'string' ? contact_person.trim() : '',
    contact_phone: typeof contact_phone === 'string' ? contact_phone.trim() : '',
  };

  next();
};

export default validateLocation;
