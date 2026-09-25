import { query } from '../db/database.js';

/**
 * GET /api/food
 * Retrieve all food stock items with location join and computed expiry status
 */
export const getAllFood = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
      SELECT 
        fs.id,
        fs.food_name,
        fs.category,
        fs.quantity,
        fs.unit,
        fs.expiry_date,
        fs.location_id,
        fs.created_at,
        l.name AS location_name,
        l.type AS location_type,
        l.contact_person,
        l.contact_phone,
        CASE 
          WHEN fs.expiry_date < NOW() THEN 'EXPIRED'
          WHEN fs.expiry_date <= NOW() + INTERVAL '24 hours' THEN 'EXPIRING_SOON'
          ELSE 'GOOD'
        END AS expiry_status,
        ROUND(EXTRACT(EPOCH FROM (fs.expiry_date - NOW())) / 3600.0, 1) AS hours_until_expiry
      FROM food_stock fs
      LEFT JOIN locations l ON fs.location_id = l.id
      WHERE 1=1
    `;

    // Filter by category
    if (category && category !== 'ALL') {
      params.push(category);
      conditions.push(`fs.category = $${params.length}`);
    }

    // Filter by search query (food_name, location name, or category)
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const idx = params.length;
      conditions.push(`(fs.food_name ILIKE $${idx} OR l.name ILIKE $${idx} OR fs.category ILIKE $${idx})`);
    }

    // Filter by expiry status
    if (status && status !== 'ALL') {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'EXPIRED') {
        conditions.push(`fs.expiry_date < NOW()`);
      } else if (upperStatus === 'EXPIRING_SOON') {
        conditions.push(`fs.expiry_date >= NOW() AND fs.expiry_date <= NOW() + INTERVAL '24 hours'`);
      } else if (upperStatus === 'GOOD') {
        conditions.push(`fs.expiry_date > NOW() + INTERVAL '24 hours'`);
      }
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY fs.expiry_date ASC`;

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching food stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food stock from database',
      error: error.message,
    });
  }
};

/**
 * GET /api/food/:id
 * Retrieve a single food stock item by primary key ID
 */
export const getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food stock ID',
      });
    }

    const sql = `
      SELECT 
        fs.id,
        fs.food_name,
        fs.category,
        fs.quantity,
        fs.unit,
        fs.expiry_date,
        fs.location_id,
        fs.created_at,
        l.name AS location_name,
        l.type AS location_type,
        l.contact_person,
        l.contact_phone,
        CASE 
          WHEN fs.expiry_date < NOW() THEN 'EXPIRED'
          WHEN fs.expiry_date <= NOW() + INTERVAL '24 hours' THEN 'EXPIRING_SOON'
          ELSE 'GOOD'
        END AS expiry_status,
        ROUND(EXTRACT(EPOCH FROM (fs.expiry_date - NOW())) / 3600.0, 1) AS hours_until_expiry
      FROM food_stock fs
      LEFT JOIN locations l ON fs.location_id = l.id
      WHERE fs.id = $1
    `;

    const result = await query(sql, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Food stock item with ID ${numId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error fetching food item ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch food item',
      error: error.message,
    });
  }
};

/**
 * POST /api/food
 * Create a new food stock item
 */
export const createFood = async (req, res, next) => {
  try {
    const { food_name, category, quantity, unit, expiry_date, location_id } = req.validatedBody;

    // Verify location exists
    const locationCheck = await query('SELECT id, name FROM locations WHERE id = $1', [location_id]);
    if (locationCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Location with ID ${location_id} does not exist. Please provide a valid location_id.`,
      });
    }

    const insertSql = `
      INSERT INTO food_stock (food_name, category, quantity, unit, expiry_date, location_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const insertResult = await query(insertSql, [
      food_name,
      category,
      quantity,
      unit,
      expiry_date,
      location_id,
    ]);

    const createdItem = insertResult.rows[0];

    // Compute status and attach location name
    const fullItem = {
      ...createdItem,
      location_name: locationCheck.rows[0].name,
      expiry_status:
        new Date(createdItem.expiry_date) < new Date()
          ? 'EXPIRED'
          : new Date(createdItem.expiry_date) <= new Date(Date.now() + 24 * 3600 * 1000)
          ? 'EXPIRING_SOON'
          : 'GOOD',
    };

    res.status(201).json({
      success: true,
      message: 'Food stock item created successfully',
      data: fullItem,
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create food stock item',
      error: error.message,
    });
  }
};

/**
 * PUT /api/food/:id
 * Update an existing food stock item
 */
export const updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food stock ID',
      });
    }

    // Verify item exists
    const existingCheck = await query('SELECT id FROM food_stock WHERE id = $1', [numId]);
    if (existingCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Food stock item with ID ${numId} not found`,
      });
    }

    const { food_name, category, quantity, unit, expiry_date, location_id } = req.validatedBody;

    // Verify location exists
    const locationCheck = await query('SELECT id, name FROM locations WHERE id = $1', [location_id]);
    if (locationCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Location with ID ${location_id} does not exist`,
      });
    }

    const updateSql = `
      UPDATE food_stock
      SET 
        food_name = $1,
        category = $2,
        quantity = $3,
        unit = $4,
        expiry_date = $5,
        location_id = $6
      WHERE id = $7
      RETURNING *
    `;

    const updateResult = await query(updateSql, [
      food_name,
      category,
      quantity,
      unit,
      expiry_date,
      location_id,
      numId,
    ]);

    const updatedItem = updateResult.rows[0];

    const fullItem = {
      ...updatedItem,
      location_name: locationCheck.rows[0].name,
      expiry_status:
        new Date(updatedItem.expiry_date) < new Date()
          ? 'EXPIRED'
          : new Date(updatedItem.expiry_date) <= new Date(Date.now() + 24 * 3600 * 1000)
          ? 'EXPIRING_SOON'
          : 'GOOD',
    };

    res.status(200).json({
      success: true,
      message: 'Food stock item updated successfully',
      data: fullItem,
    });
  } catch (error) {
    console.error(`Error updating food item ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update food stock item',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/food/:id
 * Delete a food stock item
 */
export const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId) || numId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food stock ID',
      });
    }

    const deleteSql = 'DELETE FROM food_stock WHERE id = $1 RETURNING id, food_name';
    const result = await query(deleteSql, [numId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Food stock item with ID ${numId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Food stock item deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error(`Error deleting food item ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food stock item',
      error: error.message,
    });
  }
};

export default {
  getAllFood,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
};
