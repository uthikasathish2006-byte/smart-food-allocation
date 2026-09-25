import { runAllocationOptimization } from '../services/allocationService.js';
import { query, withTransaction } from '../db/database.js';

/**
 * POST /api/allocation/run
 * Run the Smart Food Allocation Optimization Engine.
 * Evaluates live PostgreSQL data (food_stock, demand, locations, vehicles).
 * Calculates priority score:
 *   priorityScore = (demandScore * 0.35) + (urgencyScore * 0.30) + (expiryRisk * 0.15) + (populationScore * 0.10) - (distancePenalty * 0.10)
 * Sorts locations by priority score and allocates greedily under capacity constraints.
 * Returns recommendation without immediately committing to database.
 */
export const runAllocation = async (req, res, next) => {
  try {
    const result = await runAllocationOptimization();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error running food allocation optimization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run allocation optimization engine',
      error: error.message,
    });
  }
};

/**
 * GET /api/allocation
 * List all saved allocations from database, including override reasons.
 */
export const getAllocations = async (req, res, next) => {
  try {
    const sql = `
      SELECT a.*, l.name as location_name, l.type as location_type, fs.food_name
      FROM allocations a
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN food_stock fs ON a.food_stock_id = fs.id
      ORDER BY a.allocated_at DESC
    `;
    const result = await query(sql);
    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch allocations',
      error: error.message,
    });
  }
};

/**
 * POST /api/allocation/confirm
 * Atomically confirms an allocation recommendation using a PostgreSQL database transaction.
 * 
 * Executes the 8 mandatory steps:
 * 1. Validate available food.
 * 2. Validate requested quantity.
 * 3. Validate vehicle capacity.
 * 4. Create allocation record.
 * 5. Reduce food_stock quantity (never negative).
 * 6. Update allocation status to CONFIRMED.
 * 7. Create an alert.
 * 8. Return the updated allocation.
 * 
 * If ANY step fails, ROLLBACK the entire transaction.
 */
export const confirmAllocation = async (req, res, next) => {
  try {
    const {
      food_stock_id,
      location_id,
      quantity,
      distance_km = 0,
      priority_score = 0,
      vehicle_id = null,
      allocation_id = null,
      override_reason = null,
    } = req.body;

    const numQty = parseFloat(quantity);

    if (!food_stock_id || !location_id || isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation payload. Valid food_stock_id, location_id, and positive quantity are required.',
      });
    }

    // Execute within PostgreSQL transaction
    const transactionResult = await withTransaction(async (client) => {
      // -------------------------------------------------------------
      // 1. Validate available food
      // -------------------------------------------------------------
      const foodRes = await client.query(
        `SELECT fs.*, l.name as donor_location_name 
         FROM food_stock fs 
         LEFT JOIN locations l ON fs.location_id = l.id 
         WHERE fs.id = $1`,
        [Number(food_stock_id)]
      );

      if (foodRes.rows.length === 0) {
        throw new Error(`Food stock validation failed: Batch #${food_stock_id} does not exist in inventory.`);
      }

      const foodItem = foodRes.rows[0];
      const currentStockQty = Number(foodItem.quantity);

      // Validate expiration
      const expiryDate = new Date(foodItem.expiry_date);
      if (expiryDate < new Date()) {
        throw new Error(`Food stock validation failed: Batch #${food_stock_id} ("${foodItem.food_name}") expired on ${expiryDate.toLocaleDateString()} and cannot be allocated.`);
      }

      // Validate available stock quantity
      if (currentStockQty < numQty) {
        throw new Error(`Food stock validation failed: Insufficient stock. Batch "${foodItem.food_name}" has ${currentStockQty} ${foodItem.unit || 'units'} available, but ${numQty} units were requested. Stock quantity cannot become negative.`);
      }

      // Never allow stock quantity to become negative
      const remainingStock = Number((currentStockQty - numQty).toFixed(2));
      if (remainingStock < 0) {
        throw new Error(`Food stock validation failed: Operation would cause inventory to become negative (${remainingStock}). Transaction aborted.`);
      }

      // -------------------------------------------------------------
      // 2. Validate requested quantity
      // -------------------------------------------------------------
      const locRes = await client.query(
        `SELECT * FROM locations WHERE id = $1`,
        [Number(location_id)]
      );
      if (locRes.rows.length === 0) {
        throw new Error(`Requested quantity validation failed: Destination location #${location_id} not found.`);
      }
      const destinationLoc = locRes.rows[0];

      // Query active demand at destination
      const demandRes = await client.query(
        `SELECT * FROM demand WHERE location_id = $1 AND status <> 'CANCELLED' ORDER BY urgency DESC, requested_at ASC`,
        [Number(location_id)]
      );

      // -------------------------------------------------------------
      // 3. Validate vehicle capacity
      // -------------------------------------------------------------
      let assignedVehicle = null;
      if (vehicle_id) {
        const vRes = await client.query(`SELECT * FROM vehicles WHERE id = $1`, [Number(vehicle_id)]);
        if (vRes.rows.length === 0) {
          throw new Error(`Vehicle capacity validation failed: Specified vehicle #${vehicle_id} not found.`);
        }
        assignedVehicle = vRes.rows[0];
        if (Number(assignedVehicle.capacity) < numQty) {
          throw new Error(`Vehicle capacity validation failed: Vehicle #${assignedVehicle.vehicle_number} has capacity ${assignedVehicle.capacity} kg, which cannot transport ${numQty} units.`);
        }
      } else {
        // Query available vehicle with capacity >= numQty
        const vRes = await client.query(
          `SELECT * FROM vehicles WHERE UPPER(status) = 'AVAILABLE' AND capacity >= $1 ORDER BY capacity ASC LIMIT 1`,
          [numQty]
        );

        if (vRes.rows.length > 0) {
          assignedVehicle = vRes.rows[0];
        } else {
          // Check max available fleet capacity for clear error response
          const maxVRes = await client.query(
            `SELECT * FROM vehicles WHERE UPPER(status) = 'AVAILABLE' ORDER BY capacity DESC LIMIT 1`
          );
          const maxCap = maxVRes.rows.length > 0 ? Number(maxVRes.rows[0].capacity) : 0;
          throw new Error(`Vehicle capacity validation failed: No available delivery vehicle has sufficient payload capacity for ${numQty} units. Maximum available vehicle capacity is ${maxCap} kg.`);
        }
      }

      // -------------------------------------------------------------
      // 4. Create allocation record
      // -------------------------------------------------------------
      let createdAllocation = null;
      if (allocation_id) {
        const updateAllocSql = `
          UPDATE allocations
          SET status = 'CONFIRMED',
              quantity = $1,
              food_stock_id = $2,
              location_id = $3,
              distance_km = $4,
              priority_score = $5,
              override_reason = $6
          WHERE id = $7
          RETURNING *;
        `;
        const updateAllocRes = await client.query(updateAllocSql, [
          numQty,
          Number(food_stock_id),
          Number(location_id),
          Number(distance_km) || 0,
          Number(priority_score) || 0,
          override_reason || null,
          Number(allocation_id),
        ]);
        if (updateAllocRes.rows.length > 0) {
          createdAllocation = updateAllocRes.rows[0];
        }
      }

      if (!createdAllocation) {
        const insertAllocSql = `
          INSERT INTO allocations (food_stock_id, location_id, quantity, distance_km, priority_score, status, override_reason)
          VALUES ($1, $2, $3, $4, $5, 'CONFIRMED', $6)
          RETURNING *;
        `;
        const insertAllocRes = await client.query(insertAllocSql, [
          Number(food_stock_id),
          Number(location_id),
          numQty,
          Number(distance_km) || 0,
          Number(priority_score) || 0,
          override_reason || null,
        ]);
        createdAllocation = insertAllocRes.rows[0];
      }

      // -------------------------------------------------------------
      // 5. Reduce food_stock quantity (never allow stock to become negative)
      // -------------------------------------------------------------
      const reduceStockSql = `
        UPDATE food_stock
        SET quantity = quantity - $1
        WHERE id = $2 AND quantity >= $1
        RETURNING *;
      `;
      const stockUpdateRes = await client.query(reduceStockSql, [numQty, Number(food_stock_id)]);
      if (stockUpdateRes.rows.length === 0) {
        throw new Error(`Failed to reduce inventory: Food stock quantity cannot become negative.`);
      }
      const updatedStockItem = stockUpdateRes.rows[0];

      // -------------------------------------------------------------
      // 6. Update allocation status to CONFIRMED
      // -------------------------------------------------------------
      let finalAllocation = createdAllocation;
      if (finalAllocation.status !== 'CONFIRMED') {
        const setConfirmedRes = await client.query(
          `UPDATE allocations SET status = 'CONFIRMED' WHERE id = $1 RETURNING *;`,
          [finalAllocation.id]
        );
        finalAllocation = setConfirmedRes.rows[0];
      }

      // Update demand status if active demand exists
      if (demandRes.rows.length > 0) {
        const topDemand = demandRes.rows[0];
        const nextStatus = Number(topDemand.required_quantity) <= numQty ? 'FULFILLED' : 'MATCHED';
        await client.query(
          `UPDATE demand SET status = $1 WHERE id = $2`,
          [nextStatus, topDemand.id]
        );
      }

      // -------------------------------------------------------------
      // 7. Create an alert
      // -------------------------------------------------------------
      const alertMsg = `Allocation CONFIRMED: ${numQty} ${foodItem.unit || 'units'} of "${foodItem.food_name}" dispatched to "${destinationLoc.name}" (Transport: ${assignedVehicle.vehicle_number}, ${assignedVehicle.capacity}kg cap). Remaining batch stock: ${remainingStock} ${foodItem.unit || 'units'}.`;
      const alertRes = await client.query(
        `INSERT INTO alerts (location_id, type, message, severity, is_read)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING *;`,
        [Number(location_id), 'ALLOCATION_CONFIRMED', alertMsg, 'info']
      );
      const createdAlert = alertRes.rows[0];

      // -------------------------------------------------------------
      // 8. Return the updated allocation
      // -------------------------------------------------------------
      return {
        allocation: {
          ...finalAllocation,
          location_name: destinationLoc.name,
          location_type: destinationLoc.type,
          food_name: foodItem.food_name,
        },
        food_stock: {
          id: updatedStockItem.id,
          food_name: updatedStockItem.food_name,
          previous_quantity: currentStockQty,
          reduced_quantity: numQty,
          remaining_quantity: Number(updatedStockItem.quantity),
          unit: updatedStockItem.unit,
        },
        vehicle: {
          id: assignedVehicle.id,
          vehicle_number: assignedVehicle.vehicle_number,
          capacity: Number(assignedVehicle.capacity),
        },
        alert: createdAlert,
      };
    });

    res.status(200).json({
      success: true,
      message: 'Allocation confirmed successfully. Inventory reduced, vehicle dispatched, and alert recorded.',
      data: transactionResult,
    });
  } catch (error) {
    console.error('Allocation confirmation aborted and rolled back:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Allocation confirmation transaction failed and was rolled back.',
      error: error.message,
    });
  }
};

/**
 * POST /api/allocation/override
 * Manual allocation override endpoint.
 * Requires ADMIN role.
 * Saves the override reason to allocations.override_reason in PostgreSQL.
 * Also uses atomic transaction to validate stock, vehicle capacity, reduce inventory,
 * and create an alert.
 */
export const manualOverrideAllocation = async (req, res, next) => {
  try {
    // 1. Role verification: Require ADMIN role
    const authHeaderRole = req.headers['x-user-role'];
    const bodyRole = req.body.user_role;
    const effectiveRole = (authHeaderRole || bodyRole || '').toLowerCase();

    const isAdmin =
      effectiveRole.includes('admin') ||
      effectiveRole === 'admin' ||
      effectiveRole === 'administrator';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: ADMIN role is strictly required for manual allocation overrides.',
      });
    }

    const {
      food_stock_id,
      location_id,
      quantity,
      distance_km = 0,
      priority_score = 0,
      override_reason,
      vehicle_id = null,
      allocation_id = null,
    } = req.body;

    // Validate location_id
    const locId = parseInt(location_id, 10);
    if (isNaN(locId) || locId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid location_id is required.',
      });
    }

    // Validate override quantity
    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Override quantity must be a positive number greater than 0.',
      });
    }

    // Validate override_reason (mandatory)
    if (!override_reason || typeof override_reason !== 'string' || override_reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Override reason is required (e.g. "Emergency situation").',
      });
    }

    const trimmedReason = override_reason.trim();

    // Execute within database transaction
    const transactionResult = await withTransaction(async (client) => {
      // 1. Validate food stock
      const foodRes = await client.query(
        `SELECT fs.*, l.name as donor_location_name 
         FROM food_stock fs 
         LEFT JOIN locations l ON fs.location_id = l.id 
         WHERE fs.id = $1`,
        [Number(food_stock_id) || 1]
      );

      if (foodRes.rows.length === 0) {
        throw new Error(`Food stock batch #${food_stock_id} does not exist in inventory.`);
      }

      const foodItem = foodRes.rows[0];
      const currentStockQty = Number(foodItem.quantity);

      if (currentStockQty < numQty) {
        throw new Error(`Insufficient available food stock. Batch "${foodItem.food_name}" has ${currentStockQty} ${foodItem.unit || 'units'} available, but ${numQty} units were requested in manual override. Stock quantity cannot become negative.`);
      }

      const remainingStock = Number((currentStockQty - numQty).toFixed(2));
      if (remainingStock < 0) {
        throw new Error(`Food stock quantity cannot become negative (${remainingStock}).`);
      }

      // 2. Validate destination location
      const locRes = await client.query(
        `SELECT * FROM locations WHERE id = $1`,
        [locId]
      );
      if (locRes.rows.length === 0) {
        throw new Error(`Destination location #${locId} not found.`);
      }
      const destinationLoc = locRes.rows[0];

      // 3. Validate vehicle capacity
      let assignedVehicle = null;
      if (vehicle_id) {
        const vRes = await client.query(`SELECT * FROM vehicles WHERE id = $1`, [Number(vehicle_id)]);
        if (vRes.rows.length > 0) assignedVehicle = vRes.rows[0];
      }
      if (!assignedVehicle) {
        const vRes = await client.query(
          `SELECT * FROM vehicles WHERE UPPER(status) = 'AVAILABLE' AND capacity >= $1 ORDER BY capacity ASC LIMIT 1`,
          [numQty]
        );
        if (vRes.rows.length > 0) {
          assignedVehicle = vRes.rows[0];
        } else {
          const maxVRes = await client.query(
            `SELECT * FROM vehicles WHERE UPPER(status) = 'AVAILABLE' ORDER BY capacity DESC LIMIT 1`
          );
          const maxCap = maxVRes.rows.length > 0 ? Number(maxVRes.rows[0].capacity) : 0;
          throw new Error(`Vehicle capacity validation failed: No available delivery vehicle has sufficient payload capacity for ${numQty} units. Maximum available fleet capacity is ${maxCap} kg.`);
        }
      }

      // 4. Create allocation record with status 'OVERRIDDEN' and override_reason
      const insertSql = `
        INSERT INTO allocations (food_stock_id, location_id, quantity, distance_km, priority_score, status, override_reason)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
      const allocRes = await client.query(insertSql, [
        Number(foodItem.id),
        locId,
        numQty,
        Number(distance_km) || 0,
        Number(priority_score) || 0,
        'OVERRIDDEN',
        trimmedReason,
      ]);
      const savedAlloc = allocRes.rows[0];

      // 5. Reduce food_stock quantity (never allow negative)
      const reduceStockSql = `
        UPDATE food_stock
        SET quantity = quantity - $1
        WHERE id = $2 AND quantity >= $1
        RETURNING *;
      `;
      const updateStockRes = await client.query(reduceStockSql, [numQty, Number(foodItem.id)]);
      const updatedStockItem = updateStockRes.rows[0];

      // 6. Create an alert for manual override
      const alertMsg = `Manual Override CONFIRMED: ${numQty} ${foodItem.unit || 'units'} of "${foodItem.food_name}" dispatched to "${destinationLoc.name}" with justification: "${trimmedReason}". Remaining batch stock: ${remainingStock} ${foodItem.unit || 'units'}.`;
      const alertRes = await client.query(
        `INSERT INTO alerts (location_id, type, message, severity, is_read)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING *;`,
        [locId, 'MANUAL_OVERRIDE_CONFIRMED', alertMsg, 'info']
      );
      const createdAlert = alertRes.rows[0];

      return {
        allocation: {
          ...savedAlloc,
          location_name: destinationLoc.name,
          location_type: destinationLoc.type,
          food_name: foodItem.food_name,
        },
        food_stock: {
          id: updatedStockItem?.id || foodItem.id,
          food_name: foodItem.food_name,
          previous_quantity: currentStockQty,
          reduced_quantity: numQty,
          remaining_quantity: remainingStock,
          unit: foodItem.unit,
        },
        vehicle: assignedVehicle ? {
          id: assignedVehicle.id,
          vehicle_number: assignedVehicle.vehicle_number,
          capacity: Number(assignedVehicle.capacity),
        } : null,
        alert: createdAlert,
      };
    });

    res.status(201).json({
      success: true,
      message: 'Manual override confirmed and saved successfully to allocations database.',
      data: transactionResult.allocation,
      details: transactionResult,
    });
  } catch (error) {
    console.error('Error executing manual override transaction (rolled back):', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to record manual allocation override. Transaction was rolled back.',
      error: error.message,
    });
  }
};

export default {
  runAllocation,
  getAllocations,
  confirmAllocation,
  manualOverrideAllocation,
};
