import { query } from '../db/database.js';

/**
 * GET /api/locations
 * Fetch all locations with optional search and type filtering
 */
export const getAllLocations = async (req, res, next) => {
  try {
    const { type, search } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
      SELECT 
        id, 
        name, 
        type, 
        latitude, 
        longitude, 
        capacity, 
        population, 
        contact_person, 
        contact_phone, 
        created_at 
      FROM locations
      WHERE 1=1
    `;

    // Filter by location type
    if (type && type !== 'ALL') {
      params.push(type.toUpperCase());
      conditions.push(`UPPER(type) = $${params.length}`);
    }

    // Filter by search query
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      conditions.push(`(name ILIKE $${idx} OR type ILIKE $${idx} OR contact_person ILIKE $${idx} OR contact_phone ILIKE $${idx})`);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY name ASC';

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
      error: error.message,
    });
  }
};

/**
 * GET /api/locations/:id
 * Retrieve a specific location by primary key ID
 */
export const getLocationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID. Must be a positive integer.',
      });
    }

    const sql = `
      SELECT 
        id, 
        name, 
        type, 
        latitude, 
        longitude, 
        capacity, 
        population, 
        contact_person, 
        contact_phone, 
        created_at 
      FROM locations 
      WHERE id = $1
    `;

    const result = await query(sql, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Location with ID ${numId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error fetching location ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location',
      error: error.message,
    });
  }
};

/**
 * POST /api/locations
 * Add a new location with validated fields
 */
export const createLocation = async (req, res, next) => {
  try {
    const {
      name,
      type,
      population,
      capacity,
      latitude,
      longitude,
      contact_person,
      contact_phone,
    } = req.validatedBody;

    const sql = `
      INSERT INTO locations (name, type, population, capacity, latitude, longitude, contact_person, contact_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, type, latitude, longitude, capacity, population, contact_person, contact_phone, created_at
    `;

    const result = await query(sql, [
      name,
      type,
      population,
      capacity,
      latitude,
      longitude,
      contact_person,
      contact_phone,
    ]);

    const createdLocation = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: createdLocation,
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create location',
      error: error.message,
    });
  }
};

/**
 * PUT /api/locations/:id
 * Update an existing location with validated fields
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID. Must be a positive integer.',
      });
    }

    // Verify location exists
    const checkSql = 'SELECT id FROM locations WHERE id = $1';
    const checkResult = await query(checkSql, [numId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Location with ID ${numId} not found`,
      });
    }

    const {
      name,
      type,
      population,
      capacity,
      latitude,
      longitude,
      contact_person,
      contact_phone,
    } = req.validatedBody;

    const updateSql = `
      UPDATE locations
      SET 
        name = $1,
        type = $2,
        population = $3,
        capacity = $4,
        latitude = $5,
        longitude = $6,
        contact_person = $7,
        contact_phone = $8
      WHERE id = $9
      RETURNING id, name, type, latitude, longitude, capacity, population, contact_person, contact_phone, created_at
    `;

    const result = await query(updateSql, [
      name,
      type,
      population,
      capacity,
      latitude,
      longitude,
      contact_person,
      contact_phone,
      numId,
    ]);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error updating location ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/locations/:id
 * Remove a location from the system
 */
export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID. Must be a positive integer.',
      });
    }

    const deleteSql = 'DELETE FROM locations WHERE id = $1 RETURNING id, name';
    const result = await query(deleteSql, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Location with ID ${numId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error deleting location ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete location',
      error: error.message,
    });
  }
};

export default {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};
