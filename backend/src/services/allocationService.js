import { query } from '../db/database.js';

/**
 * Calculates the great-circle distance between two points on Earth using the Haversine formula (km).
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 3.5;
  }
  const numLat1 = parseFloat(lat1);
  const numLon1 = parseFloat(lon1);
  const numLat2 = parseFloat(lat2);
  const numLon2 = parseFloat(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return 3.5;
  }

  const R = 6371; // Earth radius in km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.max(0.5, Math.round(d * 10) / 10);
}

/**
 * Constructs a deterministic, explainable rationale for the recommendation.
 */
function buildExplanationReason({
  priorityScore,
  urgency,
  requestedQuantity,
  distanceKm,
  hoursUntilExpiry,
  peopleCount,
}) {
  const urgencyLabel =
    urgency >= 5
      ? 'critical urgency (Level 5)'
      : urgency >= 4
      ? 'high urgency (Level 4)'
      : urgency >= 3
      ? 'moderate urgency (Level 3)'
      : 'low urgency (Level 1-2)';

  const distanceDesc =
    distanceKm <= 3.0
      ? `short transportation distance (${distanceKm} km)`
      : distanceKm <= 8.0
      ? `moderate transit distance (${distanceKm} km)`
      : `longer transportation distance (${distanceKm} km)`;

  const demandDesc =
    requestedQuantity >= 300
      ? `high demand (${requestedQuantity} units for ${peopleCount} people)`
      : `demand of ${requestedQuantity} units for ${peopleCount} people`;

  const expiryDesc =
    hoursUntilExpiry !== null && hoursUntilExpiry <= 12
      ? `, and utilizes urgent perishable food expiring in ${hoursUntilExpiry} hours`
      : '';

  const priorityDescriptor =
    priorityScore >= 75
      ? 'High priority'
      : priorityScore >= 50
      ? 'Medium priority'
      : 'Standard priority';

  return `${priorityDescriptor} because the location has ${urgencyLabel}, ${demandDesc}, and ${distanceDesc}${expiryDesc}.`;
}

/**
 * Runs the deterministic Smart Food Allocation Optimization Engine.
 *
 * Algorithm constraints & inputs:
 * 1. Available food quantity
 * 2. Food demand
 * 3. Urgency (1-5)
 * 4. Population / people_count
 * 5. Food expiry
 * 6. Distance
 * 7. Vehicle capacity
 *
 * Formula:
 * priorityScore = (demandScore * 0.35) + (urgencyScore * 0.30) + (expiryRisk * 0.15) + (populationScore * 0.10) - (distancePenalty * 0.10)
 *
 * Allocates food greedily starting with the highest priority location.
 * Never allocates more than available food, requested quantity, or vehicle capacity.
 * Returns recommendations without immediately committing them to the database.
 */
export async function runAllocationOptimization() {
  const now = new Date();

  // 1. Fetch live non-expired food stock from PostgreSQL
  const foodSql = `
    SELECT 
      fs.id,
      fs.food_name,
      fs.category,
      fs.quantity,
      fs.unit,
      fs.expiry_date,
      fs.location_id,
      l.name AS location_name,
      l.latitude,
      l.longitude
    FROM food_stock fs
    LEFT JOIN locations l ON fs.location_id = l.id
    WHERE fs.expiry_date > NOW() AND fs.quantity > 0
    ORDER BY fs.expiry_date ASC
  `;
  const foodRes = await query(foodSql);
  const foodStockList = foodRes.rows.map((f) => ({
    ...f,
    quantity: Number(f.quantity),
    remainingQuantity: Number(f.quantity),
    hoursUntilExpiry: Math.max(
      0.1,
      Number(((new Date(f.expiry_date) - now) / 3600000).toFixed(1))
    ),
  }));

  // 2. Fetch active demand requests from PostgreSQL
  const demandSql = `
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
    WHERE UPPER(COALESCE(d.status, 'PENDING')) IN ('PENDING')
    ORDER BY d.urgency DESC, d.requested_at ASC
  `;
  const demandRes = await query(demandSql);
  const demandList = demandRes.rows.map((d) => ({
    ...d,
    required_quantity: Number(d.required_quantity),
    people_count: Number(d.people_count),
    urgency: Number(d.urgency) || 3,
  }));

  // 3. Fetch logistics transport fleet from PostgreSQL
  const vehicleSql = `
    SELECT 
      id,
      vehicle_number,
      capacity,
      current_latitude,
      current_longitude,
      status
    FROM vehicles
    ORDER BY capacity DESC
  `;
  const vehicleRes = await query(vehicleSql);
  const allVehicles = vehicleRes.rows.map((v) => ({
    ...v,
    capacity: Number(v.capacity),
  }));

  const availableVehicles = allVehicles.filter(
    (v) => String(v.status).toUpperCase() === 'AVAILABLE'
  );

  // Maximum single-vehicle transport ceiling
  const fleetMaxVehicleCapacity =
    availableVehicles.length > 0
      ? Math.max(...availableVehicles.map((v) => v.capacity))
      : allVehicles.length > 0
      ? Math.max(...allVehicles.map((v) => v.capacity))
      : 1000.0;

  if (demandList.length === 0) {
    return {
      success: true,
      timestamp: now.toISOString(),
      summary: {
        total_demands_evaluated: 0,
        total_recommended_allocations: 0,
        total_quantity_allocated: 0,
        available_food_stock_batches: foodStockList.length,
        available_vehicles: availableVehicles.length,
      },
      recommendations: [],
      unfulfilled_demands: [],
      message: 'No pending food demand requests found in database to allocate.',
    };
  }

  // Compute normalization factors across candidate demand set
  const maxRequestedQty = Math.max(...demandList.map((d) => d.required_quantity), 1);
  const maxPopulation = Math.max(
    ...demandList.map((d) => Math.max(d.people_count || 0, d.population || 0, 1)),
    1
  );

  // 4. Score each demand location against best available surplus candidate
  const evaluatedCandidates = demandList.map((demand) => {
    // Find candidate food batch minimizing distance and maximizing expiry urgency
    let bestFoodBatch = null;
    let minDistance = 9999;

    for (const food of foodStockList) {
      if (food.remainingQuantity > 0) {
        const dist = calculateDistanceKm(
          food.latitude,
          food.longitude,
          demand.latitude,
          demand.longitude
        );
        if (dist < minDistance || !bestFoodBatch) {
          minDistance = dist;
          bestFoodBatch = food;
        }
      }
    }

    const distanceKm = minDistance === 9999 ? 3.5 : minDistance;
    const hoursUntilExpiry = bestFoodBatch ? bestFoodBatch.hoursUntilExpiry : 24;

    // Normalizations to scale [0, 100]
    // 1. Demand Score: higher requested food quantity gives higher relative score
    const demandScore = Math.min(
      100,
      Math.max(10, Math.round((demand.required_quantity / maxRequestedQty) * 100))
    );

    // 2. Urgency Score: 1-5 scale normalized to [20, 100]
    const urgencyScore = Math.min(
      100,
      Math.max(20, Math.round((demand.urgency / 5) * 100))
    );

    // 3. Expiry Risk: shorter shelf life left gives higher urgency to avoid waste
    let expiryRisk = 25;
    if (hoursUntilExpiry <= 4) expiryRisk = 100;
    else if (hoursUntilExpiry <= 12) expiryRisk = 85;
    else if (hoursUntilExpiry <= 24) expiryRisk = 70;
    else if (hoursUntilExpiry <= 48) expiryRisk = 50;

    // 4. Population Score: number of persons impacted normalized to [10, 100]
    const effectivePop = Math.max(demand.people_count || 0, demand.population || 0);
    const populationScore = Math.min(
      100,
      Math.max(10, Math.round((effectivePop / maxPopulation) * 100))
    );

    // 5. Distance Penalty: longer transit distance imposes higher penalty (0 to 100)
    const distancePenalty = Math.min(100, Math.max(0, Math.round((distanceKm / 25.0) * 100)));

    // Calculate priorityScore using exact formula:
    // priorityScore = (demandScore * 0.35) + (urgencyScore * 0.30) + (expiryRisk * 0.15) + (populationScore * 0.10) - (distancePenalty * 0.10)
    const rawPriority =
      demandScore * 0.35 +
      urgencyScore * 0.30 +
      expiryRisk * 0.15 +
      populationScore * 0.10 -
      distancePenalty * 0.10;

    const priorityScore = Math.max(0, Math.min(100, Number(rawPriority.toFixed(2))));

    return {
      demand,
      bestFoodBatch,
      distanceKm,
      hoursUntilExpiry,
      demandScore,
      urgencyScore,
      expiryRisk,
      populationScore,
      distancePenalty,
      priorityScore,
    };
  });

  // 5. Sort candidate locations by priority score (descending)
  evaluatedCandidates.sort((a, b) => b.priorityScore - a.priorityScore);

  // 6. Greedy Multi-Constraint Allocation (Never allocate more than available food, requested quantity, or vehicle capacity)
  const recommendations = [];
  const unfulfilledDemands = [];
  let totalAllocatedQuantity = 0;

  // Track vehicles used in this simulated recommendation
  const vehiclePool = availableVehicles.map((v) => ({ ...v, remainingCapacity: v.capacity }));

  for (const item of evaluatedCandidates) {
    const { demand, distanceKm, priorityScore, hoursUntilExpiry } = item;
    const requestedQty = demand.required_quantity;

    // Locate a food batch with remaining surplus
    let allocatedBatch = null;
    let availableBatchQty = 0;

    // First try the candidate batch, otherwise find any non-empty food batch
    if (item.bestFoodBatch && item.bestFoodBatch.remainingQuantity > 0) {
      allocatedBatch = item.bestFoodBatch;
      availableBatchQty = allocatedBatch.remainingQuantity;
    } else {
      allocatedBatch = foodStockList.find((f) => f.remainingQuantity > 0);
      availableBatchQty = allocatedBatch ? allocatedBatch.remainingQuantity : 0;
    }

    // Determine available vehicle capacity constraint
    // Try to find an available vehicle that can carry this load
    let assignedVehicle = vehiclePool.find((v) => v.remainingCapacity >= Math.min(requestedQty, availableBatchQty));
    if (!assignedVehicle) {
      assignedVehicle = vehiclePool.find((v) => v.remainingCapacity > 0);
    }

    const effectiveVehicleCap = assignedVehicle
      ? assignedVehicle.remainingCapacity
      : fleetMaxVehicleCapacity;

    // NEVER allocate more than:
    // 1. available food
    // 2. requested quantity
    // 3. vehicle capacity
    const recommendedQty = Math.max(
      0,
      Math.min(availableBatchQty, requestedQty, effectiveVehicleCap)
    );

    const explanationReason = buildExplanationReason({
      priorityScore,
      urgency: demand.urgency,
      requestedQuantity: requestedQty,
      distanceKm,
      hoursUntilExpiry,
      peopleCount: demand.people_count,
    });

    if (recommendedQty > 0 && allocatedBatch) {
      // Deduct from in-memory simulation pool
      allocatedBatch.remainingQuantity -= recommendedQty;
      if (assignedVehicle) {
        assignedVehicle.remainingCapacity -= recommendedQty;
      }
      totalAllocatedQuantity += recommendedQty;

      recommendations.push({
        location: demand.location_name || `Location #${demand.location_id}`,
        location_id: demand.location_id,
        location_type: demand.location_type || 'COMMUNITY_KITCHEN',
        requested_quantity: requestedQty,
        recommended_quantity: Number(recommendedQty.toFixed(2)),
        distance: `${distanceKm} km`,
        distance_km: distanceKm,
        priority_score: priorityScore,
        urgency: demand.urgency,
        urgency_label:
          demand.urgency >= 5
            ? 'CRITICAL'
            : demand.urgency >= 4
            ? 'HIGH'
            : demand.urgency >= 3
            ? 'MEDIUM'
            : 'LOW',
        source_donor: allocatedBatch.location_name || 'Central Donor Hub',
        allocated_food_batch: {
          id: allocatedBatch.id,
          food_name: allocatedBatch.food_name,
          category: allocatedBatch.category,
          unit: allocatedBatch.unit,
          hours_until_expiry: allocatedBatch.hoursUntilExpiry,
        },
        assigned_vehicle: assignedVehicle
          ? {
              id: assignedVehicle.id,
              vehicle_number: assignedVehicle.vehicle_number,
              capacity: assignedVehicle.capacity,
            }
          : {
              id: null,
              vehicle_number: 'FLEET-DISPATCH',
              capacity: fleetMaxVehicleCapacity,
            },
        reason: explanationReason,
        metrics_breakdown: {
          demand_score: item.demandScore,
          urgency_score: item.urgencyScore,
          expiry_risk: item.expiryRisk,
          population_score: item.populationScore,
          distance_penalty: item.distancePenalty,
        },
      });
    } else {
      unfulfilledDemands.push({
        location: demand.location_name || `Location #${demand.location_id}`,
        requested_quantity: requestedQty,
        recommended_quantity: 0,
        distance: `${distanceKm} km`,
        priority_score: priorityScore,
        urgency: demand.urgency,
        reason: `Unable to allocate at this run: insufficient available non-expired surplus food stock in active inventory.`,
      });
    }
  }

  return {
    success: true,
    timestamp: now.toISOString(),
    summary: {
      total_demands_evaluated: demandList.length,
      total_recommended_allocations: recommendations.length,
      total_unfulfilled: unfulfilledDemands.length,
      total_quantity_allocated: Number(totalAllocatedQuantity.toFixed(2)),
      active_food_batches_evaluated: foodStockList.length,
      available_fleet_vehicles: availableVehicles.length,
    },
    recommendations,
    unfulfilled_demands: unfulfilledDemands,
  };
}

export default {
  calculateDistanceKm,
  runAllocationOptimization,
};
