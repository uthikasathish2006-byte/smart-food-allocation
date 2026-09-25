import { query } from '../db/database.js';

/**
 * Normalizes allocation status to one of:
 * - CONFIRMED
 * - PENDING
 * - OVERRIDDEN
 */
function normalizeStatus(status, overrideReason) {
  const upper = String(status || '').toUpperCase();
  if (upper === 'OVERRIDDEN' || (overrideReason && overrideReason.trim())) {
    return 'OVERRIDDEN';
  }
  if (upper === 'CONFIRMED' || upper === 'APPROVED' || upper === 'COMPLETED') {
    return 'CONFIRMED';
  }
  return 'PENDING';
}

/**
 * GET /api/history
 * Returns historical allocation dispatches directly from PostgreSQL.
 * Supports filtering by status:
 * - ALL
 * - PENDING
 * - CONFIRMED
 * - OVERRIDDEN
 * 
 * Required fields per item:
 * - Allocation ID
 * - Food
 * - Location
 * - Quantity
 * - Distance
 * - Priority Score
 * - Status
 * - Override Reason
 * - Date
 */
export const getAllocationHistory = async (req, res) => {
  try {
    const { status: filterStatus, search } = req.query;

    // Fetch allocations from PostgreSQL
    const sql = `
      SELECT 
        a.id,
        a.food_stock_id,
        a.location_id,
        a.quantity,
        a.distance_km,
        a.priority_score,
        a.status,
        a.override_reason,
        a.allocated_at,
        l.name as location_name,
        l.type as location_type,
        fs.food_name
      FROM allocations a
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN food_stock fs ON a.food_stock_id = fs.id
      ORDER BY a.allocated_at DESC
    `;

    const result = await query(sql);
    const rawAllocations = result.rows || [];

    // Map each record to the required contract
    const allRecords = rawAllocations.map((a) => {
      const normalized = normalizeStatus(a.status, a.override_reason);
      return {
        id: a.id,
        allocation_id: `#${a.id}`,
        food: a.food_name || 'Emergency Food Supplies',
        location: a.location_name || `Location #${a.location_id}`,
        location_type: a.location_type || 'SHELTER',
        quantity: Number(a.quantity || 0),
        distance: `${Number(a.distance_km || 0).toFixed(1)} km`,
        distance_km: Number(a.distance_km || 0),
        priority_score: Number(a.priority_score || 0),
        status: normalized,
        override_reason: a.override_reason || null,
        date: a.allocated_at,
        created_at: a.allocated_at,
      };
    });

    // Compute summary breakdown before query filter
    const summary = {
      total: allRecords.length,
      pending: allRecords.filter((r) => r.status === 'PENDING').length,
      confirmed: allRecords.filter((r) => r.status === 'CONFIRMED').length,
      overridden: allRecords.filter((r) => r.status === 'OVERRIDDEN').length,
      total_quantity: allRecords.reduce((acc, r) => acc + r.quantity, 0),
    };

    // Apply Status Filter if provided
    let filtered = [...allRecords];
    if (filterStatus && filterStatus.toUpperCase() !== 'ALL') {
      const target = filterStatus.toUpperCase();
      filtered = filtered.filter((r) => r.status === target);
    }

    // Apply Search Filter if provided
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) =>
        r.food.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        (r.override_reason && r.override_reason.toLowerCase().includes(q)) ||
        String(r.id).includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching allocation history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve allocation history from database',
      error: error.message,
    });
  }
};
