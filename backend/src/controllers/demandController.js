import { query } from '../db/database.js';

export const getAllDemands = async (req, res, next) => {
  try {
    const { urgency, status } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
      SELECT 
        d.id,
        d.location_id,
        d.required_quantity,
        d.people_count,
        d.urgency,
        d.status,
        d.requested_at,
        l.name AS location_name,
        l.type AS location_type,
        l.latitude,
        l.longitude,
        l.population,
        l.capacity,
        l.contact_person,
        l.contact_phone
      FROM demand d
      LEFT JOIN locations l ON d.location_id = l.id
      WHERE 1=1
    `;

    if (urgency) {
      params.push(parseInt(urgency, 10));
      conditions.push(`d.urgency = $${params.length}`);
    }

    if (status) {
      params.push(status.toUpperCase());
      conditions.push(`UPPER(d.status) = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY d.urgency DESC, d.requested_at ASC';

    const result = await query(sql, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching demand:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demand records',
      error: error.message,
    });
  }
};

export const getDemandById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = parseInt(id, 10);
    const sql = `
      SELECT 
        d.id,
        d.location_id,
        d.required_quantity,
        d.people_count,
        d.urgency,
        d.status,
        d.requested_at,
        l.name AS location_name,
        l.type AS location_type,
        l.latitude,
        l.longitude,
        l.population,
        l.capacity,
        l.contact_person,
        l.contact_phone
      FROM demand d
      LEFT JOIN locations l ON d.location_id = l.id
      WHERE d.id = $1
    `;
    const result = await query(sql, [numId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demand record not found' });
    }
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching demand', error: error.message });
  }
};

export const createDemand = async (req, res, next) => {
  try {
    const { location_id, required_quantity, people_count, urgency, status } = req.validatedBody;
    const sql = `
      INSERT INTO demand (location_id, required_quantity, people_count, urgency, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await query(sql, [location_id, required_quantity, people_count, urgency, status]);
    res.status(201).json({ success: true, message: 'Demand created successfully', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create demand', error: error.message });
  }
};

export const updateDemand = async (req, res, next) => {
  try {
    const numId = parseInt(req.params.id, 10);
    const { location_id, required_quantity, people_count, urgency, status } = req.validatedBody;
    const sql = `
      UPDATE demand
      SET location_id = $1, required_quantity = $2, people_count = $3, urgency = $4, status = $5
      WHERE id = $6
      RETURNING *
    `;
    const result = await query(sql, [location_id, required_quantity, people_count, urgency, status, numId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demand not found' });
    }
    res.status(200).json({ success: true, message: 'Demand updated successfully', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update demand', error: error.message });
  }
};

export const deleteDemand = async (req, res, next) => {
  try {
    const numId = parseInt(req.params.id, 10);
    const result = await query('DELETE FROM demand WHERE id = $1 RETURNING id', [numId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demand not found' });
    }
    res.status(200).json({ success: true, message: 'Demand deleted successfully', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete demand', error: error.message });
  }
};

export default {
  getAllDemands,
  getDemandById,
  createDemand,
  updateDemand,
  deleteDemand,
};
