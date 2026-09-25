import { query } from '../db/database.js';

/**
 * GET /api/vehicles
 * Retrieve all fleet transport vehicles with optional status or search filters
 */
export const getAllVehicles = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
      SELECT 
        id, 
        vehicle_number, 
        capacity, 
        current_latitude, 
        current_longitude, 
        status
      FROM vehicles
      WHERE 1=1
    `;

    // Filter by vehicle status (AVAILABLE, BUSY, MAINTENANCE)
    if (status && status !== 'ALL') {
      params.push(status.toUpperCase());
      conditions.push(`UPPER(status) = $${params.length}`);
    }

    // Filter by search string
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      conditions.push(`(vehicle_number ILIKE $${idx} OR status ILIKE $${idx})`);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY id ASC';

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles from database',
      error: error.message,
    });
  }
};

/**
 * GET /api/vehicles/:id
 * Retrieve a specific vehicle by primary key ID
 */
export const getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const sql = `
      SELECT 
        id, 
        vehicle_number, 
        capacity, 
        current_latitude, 
        current_longitude, 
        status
      FROM vehicles 
      WHERE id = $1
    `;

    const result = await query(sql, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${numId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error fetching vehicle ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message,
    });
  }
};

/**
 * POST /api/vehicles
 * Register a new logistics delivery vehicle
 */
export const createVehicle = async (req, res, next) => {
  try {
    const {
      vehicle_number,
      capacity,
      current_latitude,
      current_longitude,
      status,
    } = req.validatedBody;

    // Check unique vehicle_number
    const checkSql = 'SELECT id FROM vehicles WHERE UPPER(vehicle_number) = UPPER($1)';
    const checkResult = await query(checkSql, [vehicle_number]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with number "${vehicle_number}" already exists`,
      });
    }

    const insertSql = `
      INSERT INTO vehicles (vehicle_number, capacity, current_latitude, current_longitude, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, vehicle_number, capacity, current_latitude, current_longitude, status
    `;

    const result = await query(insertSql, [
      vehicle_number,
      capacity,
      current_latitude,
      current_longitude,
      status,
    ]);

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register vehicle',
      error: error.message,
    });
  }
};

/**
 * PUT /api/vehicles/:id
 * Update an existing vehicle's telemetry, capacity, or operational status
 */
export const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    // Verify existence
    const checkExists = await query('SELECT * FROM vehicles WHERE id = $1', [numId]);
    if (checkExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${numId} not found`,
      });
    }

    const currentVehicle = checkExists.rows[0];
    const validated = req.validatedBody || req.body;
    const finalNumber = validated.vehicle_number || currentVehicle.vehicle_number;
    const finalCapacity = validated.capacity !== undefined ? validated.capacity : currentVehicle.capacity;
    const finalLat = validated.current_latitude !== undefined ? validated.current_latitude : currentVehicle.current_latitude;
    const finalLng = validated.current_longitude !== undefined ? validated.current_longitude : currentVehicle.current_longitude;
    const finalStatus = validated.status || currentVehicle.status;

    // Check unique vehicle_number for other vehicles
    if (validated.vehicle_number) {
      const duplicateCheck = await query(
        'SELECT id FROM vehicles WHERE UPPER(vehicle_number) = UPPER($1) AND id <> $2',
        [finalNumber, numId]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Vehicle number "${finalNumber}" is already assigned to another vehicle`,
        });
      }
    }

    const updateSql = `
      UPDATE vehicles
      SET 
        vehicle_number = $1,
        capacity = $2,
        current_latitude = $3,
        current_longitude = $4,
        status = $5
      WHERE id = $6
      RETURNING id, vehicle_number, capacity, current_latitude, current_longitude, status
    `;

    const result = await query(updateSql, [
      finalNumber,
      finalCapacity,
      finalLat,
      finalLng,
      finalStatus,
      numId,
    ]);

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error updating vehicle ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/vehicles/:id
 * Remove a vehicle from the fleet
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID',
      });
    }

    const deleteSql = 'DELETE FROM vehicles WHERE id = $1 RETURNING id, vehicle_number';
    const result = await query(deleteSql, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Vehicle with ID ${numId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle removed successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error deleting vehicle ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message,
    });
  }
};

export default {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
