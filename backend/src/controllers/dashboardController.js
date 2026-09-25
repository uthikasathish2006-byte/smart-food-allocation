import { query } from '../db/database.js';

/**
 * GET /api/dashboard
 * Aggregates real-time operational statistics directly from PostgreSQL tables:
 * - totalFood: Sum of available non-expired food stock (kg / units)
 * - distributedFood: Sum of quantity from confirmed/completed allocations
 * - criticalLocations: Count of locations with critical demand (urgency 5 or >= 4)
 * - totalLocations: Total count of locations in the network
 * - availableVehicles: Count of fleet vehicles currently AVAILABLE
 * - expiringFood: Count of food stock batches expiring within 48 hours
 * - activeAlerts: Count of unread/active alerts requiring attention
 */
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 3600 * 1000);

    // 1. Food Stock
    const foodStockRes = await query(
      'SELECT fs.*, l.name as location_name FROM food_stock fs LEFT JOIN locations l ON fs.location_id = l.id ORDER BY fs.expiry_date ASC'
    );
    const allStock = foodStockRes.rows || [];
    const validStock = allStock.filter(
      (item) => new Date(item.expiry_date) > now && Number(item.quantity) > 0
    );

    // totalFood: sum of valid non-expired quantity
    const totalFood = Math.round(
      validStock.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0)
    );

    // expiringFood: count of food items expiring within 48 hours
    const expiringFoodBatches = allStock.filter((item) => {
      const exp = new Date(item.expiry_date);
      return exp > now && exp <= in48Hours && Number(item.quantity) > 0;
    });
    const expiringFood = expiringFoodBatches.length;

    // Category breakdown from real stock
    const categoryTotals = {};
    validStock.forEach((item) => {
      const cat = item.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.quantity || 0);
    });
    const categories = Object.entries(categoryTotals).map(([category, count]) => ({
      category,
      count: Math.round(count),
      percentage: totalFood > 0 ? Math.round((count / totalFood) * 100) : 0,
    }));

    // 2. Allocations
    const allocRes = await query(
      `SELECT a.*, l.name as location_name, fs.food_name, v.vehicle_number 
       FROM allocations a 
       LEFT JOIN locations l ON a.location_id = l.id 
       LEFT JOIN food_stock fs ON a.food_stock_id = fs.id 
       LEFT JOIN vehicles v ON a.vehicle_id = v.id 
       ORDER BY a.allocated_at DESC`
    );
    const allAllocations = allocRes.rows || [];
    const confirmedAllocations = allAllocations.filter((a) =>
      ['CONFIRMED', 'APPROVED', 'COMPLETED'].includes(String(a.status || '').toUpperCase())
    );

    // distributedFood: sum of quantity from confirmed/approved allocations
    const distributedFood = Math.round(
      confirmedAllocations.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0)
    );

    // 3. Locations
    const locRes = await query('SELECT * FROM locations ORDER BY id ASC');
    const allLocations = locRes.rows || [];
    const totalLocations = allLocations.length;

    // 4. Demand & Critical Locations
    const demandRes = await query(
      `SELECT d.*, l.name as location_name, l.type as location_type, l.population, l.capacity 
       FROM demand d 
       LEFT JOIN locations l ON d.location_id = l.id 
       WHERE d.status NOT IN ('FULFILLED', 'CANCELLED') 
       ORDER BY d.urgency DESC`
    );
    const activeDemands = demandRes.rows || [];

    // criticalLocations: locations with urgency >= 5 (or highest urgency >= 4)
    const criticalDemands = activeDemands.filter((d) => Number(d.urgency) >= 5);
    const uniqueCriticalLocIds = new Set(criticalDemands.map((d) => d.location_id));
    const criticalLocations = uniqueCriticalLocIds.size > 0 ? uniqueCriticalLocIds.size : activeDemands.filter((d) => Number(d.urgency) >= 4).length;

    // List of critical locations for display
    const criticalLocationsList = criticalDemands.map((d) => ({
      id: d.location_id,
      name: d.location_name || `Location #${d.location_id}`,
      type: d.location_type || 'SHELTER',
      urgency: Number(d.urgency),
      requiredQuantity: Number(d.required_quantity),
      peopleCount: Number(d.people_count),
      population: Number(d.population || d.people_count || 0),
      capacity: Number(d.capacity || 0),
    }));

    // 5. Vehicles
    const vehRes = await query('SELECT * FROM vehicles ORDER BY id ASC');
    const allVehicles = vehRes.rows || [];
    const availableVehicles = allVehicles.filter(
      (v) => String(v.status).toUpperCase() === 'AVAILABLE'
    ).length;

    // 6. Alerts
    const alertRes = await query('SELECT * FROM alerts ORDER BY created_at DESC');
    const allAlerts = alertRes.rows || [];
    const unreadAlerts = allAlerts.filter((a) => !a.is_read);
    const activeAlerts = unreadAlerts.length;

    // Prepare response payload containing required keys directly AND in data object
    const responsePayload = {
      success: true,
      totalFood,
      distributedFood,
      criticalLocations,
      totalLocations,
      availableVehicles,
      expiringFood,
      activeAlerts,
      data: {
        totalFood,
        distributedFood,
        criticalLocations,
        totalLocations,
        availableVehicles,
        expiringFood,
        activeAlerts,
        categories,
        criticalLocationsList,
        recentAllocations: allAllocations.slice(0, 5).map((a) => ({
          id: a.id,
          foodName: a.food_name || 'Emergency Ration Batch',
          locationName: a.location_name || `Location #${a.location_id}`,
          vehicleNumber: a.vehicle_number || 'EV-FOOD-901',
          quantity: Number(a.quantity),
          status: a.status || 'CONFIRMED',
          priorityScore: a.priority_score ? Number(a.priority_score) : null,
          allocatedAt: a.allocated_at,
        })),
        vehiclesList: allVehicles.slice(0, 4).map((v) => ({
          id: v.id,
          vehicleNumber: v.vehicle_number,
          capacity: Number(v.capacity),
          status: v.status,
          latitude: Number(v.current_latitude),
          longitude: Number(v.current_longitude),
        })),
        alertsList: unreadAlerts.slice(0, 3).map((a) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          severity: a.severity,
          createdAt: a.created_at,
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard metrics from database',
      error: error.message,
    });
  }
};
