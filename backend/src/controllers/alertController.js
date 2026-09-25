import { query } from '../db/database.js';
import { checkAndGenerateAlerts } from '../services/alertService.js';

/**
 * GET /api/alerts
 * Retrieve all real-time incident, urgency, and spoilage alerts.
 * Automatically checks and generates alerts for:
 * 1. Critical demand
 * 2. Food expiring within 2 days
 * 3. Food stock shortage
 * 4. Allocation completed
 * 5. Vehicle unavailable
 */
export const getAlerts = async (req, res, next) => {
  try {
    // 1. Run automatic alert check based on live system state
    await checkAndGenerateAlerts();

    // 2. Fetch all alerts from database
    const sql = `
      SELECT a.*, l.name as location_name, l.type as location_type
      FROM alerts a
      LEFT JOIN locations l ON a.location_id = l.id
      ORDER BY a.created_at DESC
    `;
    const result = await query(sql);
    const alerts = result.rows || [];

    // 3. Compute statistics and unread counter
    const unreadCount = alerts.filter((a) => !a.is_read).length;
    const summary = {
      total: alerts.length,
      unread: unreadCount,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      medium: alerts.filter((a) => a.severity === 'medium').length,
      info: alerts.filter((a) => a.severity === 'info' || a.severity === 'low').length,
    };

    res.status(200).json({
      success: true,
      data: alerts,
      unread_count: unreadCount,
      summary,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve alerts',
      error: error.message,
    });
  }
};

/**
 * PUT /api/alerts/:id/read
 * Mark a specific alert as read.
 */
export const markAlertAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alertId = parseInt(id, 10);

    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID',
      });
    }

    const sql = `
      UPDATE alerts
      SET is_read = TRUE
      WHERE id = $1
      RETURNING *
    `;
    const result = await query(sql, [alertId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Alert #${alertId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert marked as read successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alert status',
      error: error.message,
    });
  }
};

/**
 * PUT /api/alerts/read-all
 * Mark all unread alerts as read.
 */
export const markAllAlertsAsRead = async (req, res, next) => {
  try {
    const sql = `
      UPDATE alerts
      SET is_read = TRUE
      WHERE is_read = FALSE
      RETURNING *
    `;
    const result = await query(sql);

    res.status(200).json({
      success: true,
      message: `Marked ${result.rowCount || 0} alerts as read`,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alerts',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/alerts/:id
 * Dismiss or delete an alert.
 */
export const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alertId = parseInt(id, 10);

    if (isNaN(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID',
      });
    }

    const sql = 'DELETE FROM alerts WHERE id = $1 RETURNING *';
    const result = await query(sql, [alertId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Alert #${alertId} not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Alert dismissed successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss alert',
      error: error.message,
    });
  }
};

export default {
  getAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  deleteAlert,
};
