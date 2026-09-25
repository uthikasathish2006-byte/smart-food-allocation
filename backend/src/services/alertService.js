import { query } from '../db/database.js';

/**
 * Alert Automation Service
 * Automatically analyzes live system data and generates real-time alerts for:
 * 1. Critical demand (urgency >= 4)
 * 2. Food expiring within 2 days (48 hours)
 * 3. Food stock shortage (net deficit or critically low batch buffer)
 * 4. Allocation completed
 * 5. Vehicle unavailable (maintenance or offline)
 */
export const checkAndGenerateAlerts = async () => {
  const generatedAlerts = [];

  try {
    // 1. Critical Demand (Urgency 4 or 5)
    const demandRes = await query('SELECT d.*, l.name as location_name FROM demand d LEFT JOIN locations l ON d.location_id = l.id WHERE d.urgency >= 4');
    const criticalDemands = demandRes.rows.filter(
      (d) => Number(d.urgency) >= 4 && d.status !== 'FULFILLED' && d.status !== 'CANCELLED'
    );

    // Fetch existing unread alerts to avoid spamming exact duplicate messages
    const existingAlertsRes = await query('SELECT * FROM alerts WHERE is_read = false');
    const existingUnread = existingAlertsRes.rows || [];

    for (const d of criticalDemands) {
      const locName = d.location_name || `Location #${d.location_id}`;
      const msg = `Critical Demand: ${locName} urgently requires ${d.required_quantity} units of food relief for ${d.people_count} individuals (Urgency: ${d.urgency}/5).`;
      
      const alreadyExists = existingUnread.some(
        (a) => a.location_id === d.location_id && a.type === 'CRITICAL_DEMAND'
      );

      if (!alreadyExists) {
        const severity = Number(d.urgency) >= 5 ? 'critical' : 'high';
        const ins = await query(
          `INSERT INTO alerts (location_id, type, message, severity, is_read)
           VALUES ($1, $2, $3, $4, FALSE)
           RETURNING *`,
          [d.location_id, 'CRITICAL_DEMAND', msg, severity]
        );
        if (ins.rows.length > 0) generatedAlerts.push(ins.rows[0]);
      }
    }

    // 2. Food Expiring within 2 days (48 hours)
    const foodRes = await query('SELECT fs.*, l.name as location_name FROM food_stock fs LEFT JOIN locations l ON fs.location_id = l.id');
    const foodItems = foodRes.rows || [];
    const now = Date.now();
    const in48Hours = now + 48 * 3600 * 1000;

    for (const fs of foodItems) {
      const expTime = new Date(fs.expiry_date).getTime();
      const qty = Number(fs.quantity);

      if (expTime > now && expTime <= in48Hours && qty > 0) {
        const hours = Math.max(1, Math.round((expTime - now) / (3600 * 1000)));
        const locName = fs.location_name || `Location #${fs.location_id}`;
        const msg = `Food Expiring Soon: "${fs.food_name}" (${qty} ${fs.unit || 'units'}) at ${locName} expires in ${hours} hours. Immediate dispatch required to avoid spoilage.`;

        const alreadyExists = existingUnread.some(
          (a) => a.type === 'FOOD_EXPIRING_SOON' && a.message.includes(fs.food_name)
        );

        if (!alreadyExists) {
          const severity = hours <= 24 ? 'critical' : 'high';
          const ins = await query(
            `INSERT INTO alerts (location_id, type, message, severity, is_read)
             VALUES ($1, $2, $3, $4, FALSE)
             RETURNING *`,
            [fs.location_id, 'FOOD_EXPIRING_SOON', msg, severity]
          );
          if (ins.rows.length > 0) generatedAlerts.push(ins.rows[0]);
        }
      }
    }

    // 3. Food Stock Shortage
    // Calculate total non-expired stock vs total pending demand
    const validStock = foodItems.filter((f) => new Date(f.expiry_date).getTime() > now);
    const totalAvailStock = validStock.reduce((sum, f) => sum + Number(f.quantity), 0);
    const pendingDemands = (await query("SELECT * FROM demand WHERE status = 'PENDING'")).rows || [];
    const totalPendingDemand = pendingDemands.reduce((sum, d) => sum + Number(d.required_quantity), 0);

    if (totalPendingDemand > totalAvailStock) {
      const deficit = totalPendingDemand - totalAvailStock;
      const msg = `Food Stock Shortage: Network demand (${totalPendingDemand} units) exceeds available non-expired stock (${totalAvailStock} units) by ${deficit} units. Additional donor procurement needed.`;

      const alreadyExists = existingUnread.some((a) => a.type === 'STOCK_SHORTAGE');
      if (!alreadyExists) {
        const ins = await query(
          `INSERT INTO alerts (location_id, type, message, severity, is_read)
           VALUES ($1, $2, $3, $4, FALSE)
           RETURNING *`,
          [null, 'STOCK_SHORTAGE', msg, 'high']
        );
        if (ins.rows.length > 0) generatedAlerts.push(ins.rows[0]);
      }
    }

    // 4. Allocation Completed
    const allocRes = await query(
      "SELECT a.*, l.name as location_name, fs.food_name FROM allocations a LEFT JOIN locations l ON a.location_id = l.id LEFT JOIN food_stock fs ON a.food_stock_id = fs.id WHERE a.status IN ('CONFIRMED', 'approved') ORDER BY a.allocated_at DESC"
    );
    const completedAllocs = allocRes.rows || [];

    for (const alloc of completedAllocs.slice(0, 3)) {
      const locName = alloc.location_name || `Location #${alloc.location_id}`;
      const foodTitle = alloc.food_name || 'Food Supplies';
      const msg = `Allocation Completed: ${alloc.quantity} units of "${foodTitle}" successfully assigned to ${locName}. Priority Score: ${alloc.priority_score}.`;

      const alreadyExists = existingUnread.some(
        (a) => a.type === 'ALLOCATION_COMPLETED' && a.message.includes(`Allocation Completed: ${alloc.quantity}`)
      );

      if (!alreadyExists) {
        const ins = await query(
          `INSERT INTO alerts (location_id, type, message, severity, is_read)
           VALUES ($1, $2, $3, $4, FALSE)
           RETURNING *`,
          [alloc.location_id, 'ALLOCATION_COMPLETED', msg, 'info']
        );
        if (ins.rows.length > 0) generatedAlerts.push(ins.rows[0]);
      }
    }

    // 5. Vehicle Unavailable (Status: MAINTENANCE or OFFLINE)
    const vehicleRes = await query('SELECT * FROM vehicles');
    const vehicles = vehicleRes.rows || [];
    const unavailableVehicles = vehicles.filter(
      (v) => ['MAINTENANCE', 'OFFLINE'].includes(String(v.status).toUpperCase())
    );

    for (const v of unavailableVehicles) {
      const msg = `Vehicle Unavailable: Logistics transport ${v.vehicle_number} (${v.capacity}kg payload capacity) is currently in ${String(v.status).toUpperCase()}. Delivery throughput restricted.`;

      const alreadyExists = existingUnread.some(
        (a) => a.type === 'VEHICLE_UNAVAILABLE' && a.message.includes(v.vehicle_number)
      );

      if (!alreadyExists) {
        const ins = await query(
          `INSERT INTO alerts (location_id, type, message, severity, is_read)
           VALUES ($1, $2, $3, $4, FALSE)
           RETURNING *`,
          [null, 'VEHICLE_UNAVAILABLE', msg, 'medium']
        );
        if (ins.rows.length > 0) generatedAlerts.push(ins.rows[0]);
      }
    }
  } catch (error) {
    console.error('Error generating automated alerts:', error);
  }

  return generatedAlerts;
};

export default {
  checkAndGenerateAlerts,
};
