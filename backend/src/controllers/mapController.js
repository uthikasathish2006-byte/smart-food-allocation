import { query } from '../db/database.js';
import { runAllocationOptimization } from '../services/allocationService.js';

/**
 * Controller for Geospatial Map API
 * Aggregates live locations, demand, vehicle telematics, and recommended allocations.
 * Computes marker types:
 * - RED = Critical demand (urgency 5)
 * - YELLOW = High demand (urgency 4)
 * - GREEN = Normal (urgency <= 3 or surplus donor/kitchen)
 * - BLUE = Vehicle (fleet transport unit)
 */
export const getMapData = async (req, res) => {
  try {
    // 1. Fetch all locations from PostgreSQL
    const locRes = await query('SELECT * FROM locations ORDER BY id ASC');
    const rawLocations = locRes.rows || [];

    // 2. Fetch active demand records
    const demRes = await query(
      "SELECT * FROM demand WHERE status NOT IN ('FULFILLED', 'CANCELLED') ORDER BY urgency DESC"
    );
    const rawDemands = demRes.rows || [];

    // 3. Fetch all fleet vehicles
    const vehRes = await query('SELECT * FROM vehicles ORDER BY id ASC');
    const rawVehicles = vehRes.rows || [];

    // 4. Run optimization engine to get current recommended allocations
    let recommendations = [];
    try {
      const optimizationResult = await runAllocationOptimization();
      recommendations = optimizationResult.recommendations || [];
    } catch (allocErr) {
      console.warn('Warning: Could not run allocation optimization for map:', allocErr.message);
    }

    // 5. Aggregate location nodes with demand & recommended allocations
    const locations = rawLocations.map((loc) => {
      // Find matching demand record
      const dem = rawDemands.find((d) => d.location_id === loc.id);
      const rec = recommendations.find((r) => r.location_id === loc.id);

      const requiredFood = dem ? Number(dem.required_quantity) : 0;
      const urgency = dem ? Number(dem.urgency) : 1;
      const population = loc.population ? Number(loc.population) : (dem ? Number(dem.people_count) : 0);

      // Determine recommended allocation
      let recommendedAllocation = 0;
      if (rec && rec.recommended_quantity !== undefined) {
        recommendedAllocation = rec.recommended_quantity;
      } else if (requiredFood > 0) {
        // Fallback to requested quantity or capacity cap
        recommendedAllocation = Math.min(requiredFood, loc.capacity || requiredFood);
      }

      // Marker type logic:
      // RED: Critical demand (Urgency 5)
      // YELLOW: High demand (Urgency 4)
      // GREEN: Normal (Urgency 1-3 or standard facility)
      let markerType = 'GREEN';
      let urgencyLabel = 'NORMAL';

      if (urgency >= 5) {
        markerType = 'RED';
        urgencyLabel = 'CRITICAL';
      } else if (urgency >= 4) {
        markerType = 'YELLOW';
        urgencyLabel = 'HIGH';
      } else if (urgency >= 3) {
        urgencyLabel = 'MEDIUM';
        markerType = 'GREEN';
      } else {
        urgencyLabel = 'LOW';
        markerType = 'GREEN';
      }

      return {
        id: loc.id,
        name: loc.name,
        type: loc.type,
        latitude: parseFloat(loc.latitude),
        longitude: parseFloat(loc.longitude),
        population: population,
        capacity: loc.capacity ? Number(loc.capacity) : 0,
        required_food: requiredFood,
        urgency: urgency,
        urgency_label: urgencyLabel,
        recommended_allocation: recommendedAllocation,
        marker_type: markerType,
        contact_person: loc.contact_person || 'Facility Coordinator',
        contact_phone: loc.contact_phone || 'N/A',
        demand_status: dem ? dem.status : 'NONE',
        allocation_reason: rec ? rec.reason : (requiredFood > 0 ? 'Standard delivery recommendation' : 'Adequate supply on site'),
        priority_score: rec ? rec.priority_score : null,
      };
    });

    // 6. Aggregate vehicle nodes
    const vehicles = rawVehicles.map((v) => ({
      id: v.id,
      vehicle_number: v.vehicle_number,
      capacity: Number(v.capacity),
      latitude: parseFloat(v.current_latitude),
      longitude: parseFloat(v.current_longitude),
      status: v.status || 'AVAILABLE',
      marker_type: 'BLUE',
      assigned_to: v.assigned_to || null,
    }));

    // 7. Calculate summary metrics
    const summary = {
      total_locations: locations.length,
      critical_demand: locations.filter((l) => l.marker_type === 'RED').length,
      high_demand: locations.filter((l) => l.marker_type === 'YELLOW').length,
      normal: locations.filter((l) => l.marker_type === 'GREEN').length,
      vehicles: vehicles.length,
      total_required_food: locations.reduce((acc, l) => acc + l.required_food, 0),
      total_recommended_allocation: locations.reduce((acc, l) => acc + l.recommended_allocation, 0),
    };

    return res.status(200).json({
      success: true,
      data: {
        locations,
        vehicles,
      },
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve geospatial map data',
      error: error.message,
    });
  }
};
