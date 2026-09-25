import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Configure PostgreSQL connection pool using environment variables
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'smart_food_db',
      connectionTimeoutMillis: 2000,
    };

export const pool = new Pool(poolConfig);

let pgAvailable = false;
let hasCheckedPg = false;

// Seed initial memory tables matching database/seed.sql with exact required types
let memLocations = [
  {
    id: 1,
    name: 'Harbor Mission Community Kitchen',
    type: 'COMMUNITY_KITCHEN',
    latitude: 37.7955,
    longitude: -122.3937,
    capacity: 600,
    population: 450,
    contact_person: 'Sister Theresa Chen',
    contact_phone: '+1 (555) 771-3940',
    created_at: new Date(Date.now() - 25 * 86400 * 1000).toISOString(),
  },
  {
    id: 2,
    name: 'Lincoln High Nutrition Canteen',
    type: 'SCHOOL',
    latitude: 37.7490,
    longitude: -122.4820,
    capacity: 1200,
    population: 850,
    contact_person: 'Principal Robert Hayes',
    contact_phone: '+1 (555) 432-1100',
    created_at: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
  },
  {
    id: 3,
    name: 'Hope Valley Emergency Shelter',
    type: 'SHELTER',
    latitude: 37.7833,
    longitude: -122.4167,
    capacity: 350,
    population: 280,
    contact_person: 'Marcus Vance',
    contact_phone: '+1 (555) 982-4112',
    created_at: new Date(Date.now() - 18 * 86400 * 1000).toISOString(),
  },
  {
    id: 4,
    name: 'East Bay Central Relief Center',
    type: 'RELIEF_CENTER',
    latitude: 37.8044,
    longitude: -122.2712,
    capacity: 2500,
    population: 1400,
    contact_person: 'Elena Rostova',
    contact_phone: '+1 (555) 610-8201',
    created_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
  },
  {
    id: 5,
    name: 'St. Jude Regional Hospital Care Wing',
    type: 'HOSPITAL',
    latitude: 37.7650,
    longitude: -122.4200,
    capacity: 800,
    population: 520,
    contact_person: 'Dr. Aris Thorne',
    contact_phone: '+1 (555) 321-7788',
    created_at: new Date(Date.now() - 12 * 86400 * 1000).toISOString(),
  },
  {
    id: 6,
    name: 'Metropolitan Community Kitchen',
    type: 'COMMUNITY_KITCHEN',
    latitude: 37.7749,
    longitude: -122.4194,
    capacity: 500,
    population: 310,
    contact_person: 'David Miller',
    contact_phone: '+1 (555) 234-8891',
    created_at: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
  },
];

let nextLocationId = 7;

let memFoodStock = [
  {
    id: 1,
    food_name: 'Organic Apples & Citrus Crates',
    category: 'Fresh Produce',
    quantity: 180.00,
    unit: 'kg',
    expiry_date: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    location_id: 1,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 2,
    food_name: 'Nutritious Rice & Veggie Stew Meals',
    category: 'Prepared Meals',
    quantity: 250.00,
    unit: 'meals',
    expiry_date: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    location_id: 2,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 3,
    food_name: 'Whole Wheat Loaves & Baguettes',
    category: 'Baked Goods',
    quantity: 120.00,
    unit: 'loaves',
    expiry_date: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    location_id: 3,
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    food_name: 'Potatoes, Carrots & Leafy Greens',
    category: 'Fresh Produce',
    quantity: 520.00,
    unit: 'kg',
    expiry_date: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
    location_id: 4,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: 5,
    food_name: 'Pasteurized Whole Milk & Yogurt',
    category: 'Dairy',
    quantity: 300.00,
    unit: 'liters',
    expiry_date: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    location_id: 5,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 6,
    food_name: 'Past Expiry Fresh Salads Batch',
    category: 'Fresh Produce',
    quantity: 45.00,
    unit: 'boxes',
    expiry_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    location_id: 1,
    created_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
  },
];

let nextFoodStockId = 7;

// Seed initial memory table for Demand
let memDemand = [
  {
    id: 1,
    location_id: 3, // Hope Valley Emergency Shelter
    required_quantity: 180.00,
    people_count: 180,
    urgency: 5,
    status: 'PENDING',
    requested_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    location_id: 1, // Harbor Mission Community Kitchen
    required_quantity: 300.00,
    people_count: 300,
    urgency: 4,
    status: 'MATCHED',
    requested_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    location_id: 4, // East Bay Central Relief Center
    required_quantity: 450.00,
    people_count: 380,
    urgency: 5,
    status: 'PENDING',
    requested_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: 4,
    location_id: 2, // Lincoln High Nutrition Canteen
    required_quantity: 220.00,
    people_count: 220,
    urgency: 3,
    status: 'IN_TRANSIT',
    requested_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 5,
    location_id: 5, // St. Jude Regional Hospital Care Wing
    required_quantity: 95.00,
    people_count: 95,
    urgency: 2,
    status: 'FULFILLED',
    requested_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: 6,
    location_id: 6, // Metropolitan Community Kitchen
    required_quantity: 130.00,
    people_count: 130,
    urgency: 1,
    status: 'PENDING',
    requested_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
];

let nextDemandId = 7;

// Seed initial memory table for Vehicles
let memVehicles = [
  { id: 1, vehicle_number: 'EV-FOOD-901', capacity: 800.00, current_latitude: 37.7850, current_longitude: -122.4080, status: 'BUSY' },
  { id: 2, vehicle_number: 'EV-FOOD-902', capacity: 800.00, current_latitude: 37.7740, current_longitude: -122.4190, status: 'AVAILABLE' },
  { id: 3, vehicle_number: 'BIKE-CARGO-12', capacity: 150.00, current_latitude: 37.7680, current_longitude: -122.4250, status: 'BUSY' },
  { id: 4, vehicle_number: 'TRK-COLD-05', capacity: 2500.00, current_latitude: 37.7600, current_longitude: -122.3900, status: 'AVAILABLE' },
  { id: 5, vehicle_number: 'VAN-FREEZE-08', capacity: 1200.00, current_latitude: 37.7920, current_longitude: -122.3980, status: 'MAINTENANCE' },
  { id: 6, vehicle_number: 'EV-FOOD-903', capacity: 750.00, current_latitude: 37.7550, current_longitude: -122.4150, status: 'AVAILABLE' },
];

let nextVehicleId = 7;

// Seed initial memory table for Allocations
let memAllocations = [
  {
    id: 1,
    food_stock_id: 2,
    location_id: 6,
    quantity: 250.00,
    distance_km: 2.10,
    priority_score: 98.40,
    status: 'CONFIRMED',
    override_reason: null,
    allocated_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    food_stock_id: 3,
    location_id: 5,
    quantity: 120.00,
    distance_km: 3.40,
    priority_score: 95.20,
    status: 'CONFIRMED',
    override_reason: null,
    allocated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    food_stock_id: 4,
    location_id: 4,
    quantity: 350.00,
    distance_km: 0.50,
    priority_score: 88.50,
    status: 'OVERRIDDEN',
    override_reason: 'Emergency situation: Sudden influx of 120 displaced refugees arriving at East Bay relief shelter.',
    allocated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    food_stock_id: 1,
    location_id: 3,
    quantity: 180.00,
    distance_km: 1.20,
    priority_score: 82.10,
    status: 'PENDING',
    override_reason: null,
    allocated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    food_stock_id: 5,
    location_id: 2,
    quantity: 200.00,
    distance_km: 4.80,
    priority_score: 76.90,
    status: 'OVERRIDDEN',
    override_reason: 'Severe weather advisory: Pre-positioning dairy and provisions ahead of storm surge.',
    allocated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];
let nextAllocationId = 6;

// Seed initial memory table for Alerts
let memAlerts = [
  {
    id: 1,
    location_id: 3,
    type: 'URGENT_DEMAND',
    message: 'Hope Valley Emergency Shelter requires immediate food relief.',
    severity: 'critical',
    is_read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];
let nextAlertId = 2;

// Seed initial memory table for Users (Auth & RBAC)
let memUsers = [
  {
    id: 1,
    name: 'Admin Lead',
    email: 'admin@zerohunger.org',
    password: '$2b$10$wNqV7Vj1m4T319g7u8x4aOBz1Bv3E7GvC34m67v8B9.s5JbHq1yK2',
    plain_fallback: 'admin123',
    role: 'admin',
    created_at: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
  },
  {
    id: 2,
    name: 'Dr. Sarah Lin',
    email: 'coordinator@zerohunger.org',
    password: '$2b$10$wNqV7Vj1m4T319g7u8x4aOBz1Bv3E7GvC34m67v8B9.s5JbHq1yK2',
    plain_fallback: 'coordinator123',
    role: 'coordinator',
    created_at: new Date(Date.now() - 20 * 86400 * 1000).toISOString(),
  },
  {
    id: 3,
    name: 'GreenMarket Partner',
    email: 'donor@greenmarket.com',
    password: '$2b$10$wNqV7Vj1m4T319g7u8x4aOBz1Bv3E7GvC34m67v8B9.s5JbHq1yK2',
    plain_fallback: 'donor123',
    role: 'donor',
    created_at: new Date(Date.now() - 15 * 86400 * 1000).toISOString(),
  },
  {
    id: 4,
    name: 'Marcus Vance',
    email: 'shelter@hopevalley.org',
    password: '$2b$10$wNqV7Vj1m4T319g7u8x4aOBz1Bv3E7GvC34m67v8B9.s5JbHq1yK2',
    plain_fallback: 'shelter123',
    role: 'shelter',
    created_at: new Date(Date.now() - 10 * 86400 * 1000).toISOString(),
  },
];
let nextUserId = 5;

const getUrgencyIndicator = (urgency) => {
  if (urgency >= 5) return 'CRITICAL';
  if (urgency >= 4) return 'HIGH';
  if (urgency >= 3) return 'MEDIUM';
  return 'LOW';
};

/**
 * Execute query against PostgreSQL pool.
 * If PostgreSQL is unavailable, gracefully fall back to in-memory tables.
 */
export const query = async (text, params = []) => {
  try {
    const result = await pool.query(text, params);
    pgAvailable = true;
    return result;
  } catch (err) {
    if (!hasCheckedPg) {
      console.warn(`[PostgreSQL Notice] Unable to connect to PostgreSQL at ${poolConfig.connectionString || poolConfig.host}. Operating in development data store mode.`);
      hasCheckedPg = true;
    }

    const sql = text.trim();

    // 1. SELECT NOW()
    if (sql.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date().toISOString() }], rowCount: 1 };
    }

    // 2. Locations INSERT
    if (sql.startsWith('INSERT INTO locations')) {
      const [name, type, population, capacity, latitude, longitude, contact_person, contact_phone] = params;
      const newLoc = {
        id: nextLocationId++,
        name,
        type,
        population: Number(population) || 0,
        capacity: Number(capacity) || 0,
        latitude: Number(latitude),
        longitude: Number(longitude),
        contact_person: contact_person || '',
        contact_phone: contact_phone || '',
        created_at: new Date().toISOString(),
      };
      memLocations.push(newLoc);
      return { rows: [newLoc], rowCount: 1 };
    }

    // 3. Locations UPDATE
    if (sql.startsWith('UPDATE locations')) {
      const [name, type, population, capacity, latitude, longitude, contact_person, contact_phone, id] = params;
      const index = memLocations.findIndex((l) => l.id === Number(id));
      if (index === -1) return { rows: [], rowCount: 0 };

      memLocations[index] = {
        ...memLocations[index],
        name,
        type,
        population: Number(population) || 0,
        capacity: Number(capacity) || 0,
        latitude: Number(latitude),
        longitude: Number(longitude),
        contact_person: contact_person || '',
        contact_phone: contact_phone || '',
      };
      return { rows: [memLocations[index]], rowCount: 1 };
    }

    // 4. Locations DELETE
    if (sql.startsWith('DELETE FROM locations')) {
      const id = Number(params[0]);
      const index = memLocations.findIndex((l) => l.id === id);
      if (index === -1) return { rows: [], rowCount: 0 };
      const deleted = memLocations.splice(index, 1)[0];
      memFoodStock = memFoodStock.filter((f) => f.location_id !== id);
      memDemand = memDemand.filter((d) => d.location_id !== id);
      return { rows: [deleted], rowCount: 1 };
    }

    // 5. Locations SELECT
    if (sql.includes('FROM locations')) {
      if (sql.includes('WHERE id = $1')) {
        const id = Number(params[0]);
        const loc = memLocations.find((l) => l.id === id);
        return { rows: loc ? [loc] : [], rowCount: loc ? 1 : 0 };
      }

      let locs = [...memLocations];

      const typeParam = params.find((p) => [
        'COMMUNITY_KITCHEN', 'SCHOOL', 'SHELTER', 'RELIEF_CENTER', 'HOSPITAL',
        'donor', 'shelter', 'food_bank', 'community_kitchen', 'distribution_center'
      ].includes(p));
      if (typeParam) {
        locs = locs.filter((l) => l.type.toUpperCase() === typeParam.toUpperCase());
      }

      const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const term = searchParam.replace(/%/g, '').toLowerCase();
        locs = locs.filter((l) =>
          l.name.toLowerCase().includes(term) ||
          l.type.toLowerCase().includes(term) ||
          (l.contact_person && l.contact_person.toLowerCase().includes(term)) ||
          (l.contact_phone && l.contact_phone.toLowerCase().includes(term))
        );
      }

      locs.sort((a, b) => a.name.localeCompare(b.name));
      return { rows: locs, rowCount: locs.length };
    }

    // 6. Demand SELECT
    if (sql.includes('FROM demand')) {
      // Demand by location_id
      if (sql.includes('WHERE location_id = $1') || sql.includes('WHERE d.location_id = $1')) {
        const locId = Number(params[0]);
        let items = memDemand.filter((d) => d.location_id === locId);
        if (sql.includes("status <> 'CANCELLED'")) {
          items = items.filter((d) => d.status !== 'CANCELLED');
        }
        return { rows: items, rowCount: items.length };
      }

      // Single demand by ID
      if (sql.includes('WHERE d.id = $1') || sql.includes('WHERE id = $1')) {
        const id = Number(params[0]);
        const item = memDemand.find((d) => d.id === id);
        if (!item) return { rows: [], rowCount: 0 };
        const loc = memLocations.find((l) => l.id === item.location_id);
        const enriched = {
          ...item,
          location_name: loc ? loc.name : 'Unknown Location',
          location_type: loc ? loc.type : 'SHELTER',
          contact_person: loc ? loc.contact_person : '',
          contact_phone: loc ? loc.contact_phone : '',
          latitude: loc ? loc.latitude : 0,
          longitude: loc ? loc.longitude : 0,
          urgency_level: getUrgencyIndicator(item.urgency),
        };
        return { rows: [enriched], rowCount: 1 };
      }

      // List all demand
      let items = memDemand.map((item) => {
        const loc = memLocations.find((l) => l.id === item.location_id);
        return {
          ...item,
          location_name: loc ? loc.name : 'Unknown Location',
          location_type: loc ? loc.type : 'SHELTER',
          contact_person: loc ? loc.contact_person : '',
          contact_phone: loc ? loc.contact_phone : '',
          latitude: loc ? loc.latitude : 0,
          longitude: loc ? loc.longitude : 0,
          population: loc ? loc.population : 0,
          capacity: loc ? loc.capacity : 0,
          urgency_level: getUrgencyIndicator(item.urgency),
        };
      });

      // Filter urgency
      const urgencyParam = params.find((p) => typeof p === 'number' && p >= 1 && p <= 5);
      if (urgencyParam) {
        items = items.filter((d) => d.urgency === urgencyParam);
      }

      // Filter status
      const statusParam = params.find((p) => ['PENDING', 'MATCHED', 'IN_TRANSIT', 'FULFILLED', 'CANCELLED'].includes(p));
      if (statusParam) {
        items = items.filter((d) => d.status === statusParam);
      }

      // Filter search
      const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const term = searchParam.replace(/%/g, '').toLowerCase();
        items = items.filter((d) =>
          d.location_name.toLowerCase().includes(term) ||
          d.location_type.toLowerCase().includes(term) ||
          (d.contact_person && d.contact_person.toLowerCase().includes(term))
        );
      }

      items.sort((a, b) => b.urgency - a.urgency || new Date(b.requested_at) - new Date(a.requested_at));
      return { rows: items, rowCount: items.length };
    }

    // 7. Demand INSERT
    if (sql.startsWith('INSERT INTO demand')) {
      const [location_id, required_quantity, people_count, urgency, status] = params;
      const newDemand = {
        id: nextDemandId++,
        location_id: Number(location_id),
        required_quantity: Number(required_quantity),
        people_count: Number(people_count),
        urgency: Number(urgency),
        status: status || 'PENDING',
        requested_at: new Date().toISOString(),
      };
      memDemand.push(newDemand);
      return { rows: [newDemand], rowCount: 1 };
    }

    // 8. Demand UPDATE
    if (sql.startsWith('UPDATE demand')) {
      if (sql.includes('SET status = $1 WHERE id = $2') || (sql.includes('SET status =') && params.length === 2)) {
        const [status, id] = params;
        const index = memDemand.findIndex((d) => d.id === Number(id));
        if (index !== -1) {
          memDemand[index].status = status;
          return { rows: [memDemand[index]], rowCount: 1 };
        }
        return { rows: [], rowCount: 0 };
      }

      if (params.length >= 6) {
        const [location_id, required_quantity, people_count, urgency, status, id] = params;
        const index = memDemand.findIndex((d) => d.id === Number(id));
        if (index === -1) return { rows: [], rowCount: 0 };

        memDemand[index] = {
          ...memDemand[index],
          location_id: Number(location_id),
          required_quantity: Number(required_quantity),
          people_count: Number(people_count),
          urgency: Number(urgency),
          status: status || memDemand[index].status,
        };
        return { rows: [memDemand[index]], rowCount: 1 };
      }
    }

    // 9. Demand DELETE
    if (sql.startsWith('DELETE FROM demand')) {
      const id = Number(params[0]);
      const index = memDemand.findIndex((d) => d.id === id);
      if (index === -1) return { rows: [], rowCount: 0 };
      const deleted = memDemand.splice(index, 1)[0];
      return { rows: [deleted], rowCount: 1 };
    }

    // 10. Vehicles SELECT
    if (sql.includes('FROM vehicles')) {
      if (sql.includes('WHERE id = $1')) {
        const id = Number(params[0]);
        const v = memVehicles.find((item) => item.id === id);
        return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
      }

      if (sql.includes('WHERE UPPER(vehicle_number) = UPPER($1)')) {
        const num = String(params[0]).toUpperCase();
        if (params.length > 1 && sql.includes('AND id <> $2')) {
          const excludeId = Number(params[1]);
          const v = memVehicles.find((item) => item.vehicle_number.toUpperCase() === num && item.id !== excludeId);
          return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
        }
        const v = memVehicles.find((item) => item.vehicle_number.toUpperCase() === num);
        return { rows: v ? [v] : [], rowCount: v ? 1 : 0 };
      }

      let list = [...memVehicles];

      if (sql.includes("UPPER(status) = 'AVAILABLE'") || sql.includes("status = 'AVAILABLE'")) {
        list = list.filter((v) => String(v.status).toUpperCase() === 'AVAILABLE');
      }

      if (sql.includes('MAX(capacity)')) {
        const avail = list.filter((v) => String(v.status).toUpperCase() === 'AVAILABLE');
        const maxCap = avail.length > 0 ? Math.max(...avail.map((v) => Number(v.capacity))) : 0;
        return { rows: [{ max_cap: maxCap, capacity: maxCap }], rowCount: 1 };
      }

      const statusParam = params.find((p) => typeof p === 'string' && ['AVAILABLE', 'BUSY', 'MAINTENANCE'].includes(p.toUpperCase()));
      if (statusParam) {
        list = list.filter((v) => v.status.toUpperCase() === statusParam.toUpperCase());
      }

      const capParam = params.find((p) => typeof p === 'number');
      if (sql.includes('capacity >= $') && capParam !== undefined) {
        list = list.filter((v) => Number(v.capacity) >= capParam);
      }

      const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const term = searchParam.replace(/%/g, '').toLowerCase();
        list = list.filter((v) =>
          v.vehicle_number.toLowerCase().includes(term) ||
          v.status.toLowerCase().includes(term)
        );
      }

      if (sql.includes('ORDER BY capacity ASC')) {
        list.sort((a, b) => Number(a.capacity) - Number(b.capacity));
      } else if (sql.includes('ORDER BY capacity DESC')) {
        list.sort((a, b) => Number(b.capacity) - Number(a.capacity));
      } else {
        list.sort((a, b) => a.id - b.id);
      }

      if (sql.includes('LIMIT 1')) {
        list = list.slice(0, 1);
      }

      return { rows: list, rowCount: list.length };
    }

    // 11. Vehicles INSERT
    if (sql.startsWith('INSERT INTO vehicles')) {
      const [vehicle_number, capacity, current_latitude, current_longitude, status] = params;
      const newV = {
        id: nextVehicleId++,
        vehicle_number,
        capacity: Number(capacity),
        current_latitude: Number(current_latitude) || 0,
        current_longitude: Number(current_longitude) || 0,
        status: status || 'AVAILABLE',
      };
      memVehicles.push(newV);
      return { rows: [newV], rowCount: 1 };
    }

    // 12. Vehicles UPDATE
    if (sql.startsWith('UPDATE vehicles')) {
      const [vehicle_number, capacity, current_latitude, current_longitude, status, id] = params;
      const index = memVehicles.findIndex((v) => v.id === Number(id));
      if (index === -1) return { rows: [], rowCount: 0 };

      memVehicles[index] = {
        ...memVehicles[index],
        vehicle_number,
        capacity: Number(capacity),
        current_latitude: Number(current_latitude) || 0,
        current_longitude: Number(current_longitude) || 0,
        status: status || memVehicles[index].status,
      };
      return { rows: [memVehicles[index]], rowCount: 1 };
    }

    // 13. Vehicles DELETE
    if (sql.startsWith('DELETE FROM vehicles')) {
      const id = Number(params[0]);
      const index = memVehicles.findIndex((v) => v.id === id);
      if (index === -1) return { rows: [], rowCount: 0 };
      const deleted = memVehicles.splice(index, 1)[0];
      return { rows: [deleted], rowCount: 1 };
    }

    // 14. Food Stock SELECT
    if (sql.includes('FROM food_stock')) {
      if (sql.includes('WHERE fs.id = $1') || sql.includes('WHERE id = $1')) {
        const id = Number(params[0]);
        const item = memFoodStock.find((f) => f.id === id);
        if (!item) return { rows: [], rowCount: 0 };
        const loc = memLocations.find((l) => l.id === item.location_id);
        const enriched = {
          ...item,
          location_name: loc ? loc.name : 'Unknown Location',
          location_type: loc ? loc.type : 'COMMUNITY_KITCHEN',
          contact_person: loc ? loc.contact_person : '',
          contact_phone: loc ? loc.contact_phone : '',
          expiry_status:
            new Date(item.expiry_date) < new Date()
              ? 'EXPIRED'
              : new Date(item.expiry_date) <= new Date(Date.now() + 24 * 3600 * 1000)
              ? 'EXPIRING_SOON'
              : 'GOOD',
          hours_until_expiry: Number(((new Date(item.expiry_date) - new Date()) / (3600 * 1000)).toFixed(1)),
        };
        return { rows: [enriched], rowCount: 1 };
      }

      let items = memFoodStock.map((item) => {
        const loc = memLocations.find((l) => l.id === item.location_id);
        return {
          ...item,
          location_name: loc ? loc.name : 'Unknown Location',
          location_type: loc ? loc.type : 'COMMUNITY_KITCHEN',
          contact_person: loc ? loc.contact_person : '',
          contact_phone: loc ? loc.contact_phone : '',
          latitude: loc ? loc.latitude : 37.7749,
          longitude: loc ? loc.longitude : -122.4194,
          expiry_status:
            new Date(item.expiry_date) < new Date()
              ? 'EXPIRED'
              : new Date(item.expiry_date) <= new Date(Date.now() + 24 * 3600 * 1000)
              ? 'EXPIRING_SOON'
              : 'GOOD',
          hours_until_expiry: Number(((new Date(item.expiry_date) - new Date()) / (3600 * 1000)).toFixed(1)),
        };
      });

      const categoryParam = params.find((p) => [
        'Prepared Meals', 'Fresh Produce', 'Baked Goods', 'Dairy', 'Canned Goods', 'Beverages', 'Other'
      ].includes(p));
      if (categoryParam) {
        items = items.filter((i) => i.category === categoryParam);
      }

      const searchParam = params.find((p) => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const term = searchParam.replace(/%/g, '').toLowerCase();
        items = items.filter(
          (i) =>
            i.food_name.toLowerCase().includes(term) ||
            (i.location_name && i.location_name.toLowerCase().includes(term)) ||
            i.category.toLowerCase().includes(term)
        );
      }

      if (sql.includes('fs.expiry_date > NOW()') || sql.includes('expiry_date > NOW()')) {
        items = items.filter((i) => new Date(i.expiry_date) > new Date());
      } else if (sql.includes('WHERE 1=1 AND fs.expiry_date < NOW()') || sql.includes('AND fs.expiry_date < NOW()')) {
        items = items.filter((i) => i.expiry_status === 'EXPIRED');
      } else if (sql.includes("AND fs.expiry_date >= NOW() AND fs.expiry_date <= NOW() + INTERVAL '24 hours'")) {
        items = items.filter((i) => i.expiry_status === 'EXPIRING_SOON');
      } else if (sql.includes("AND fs.expiry_date > NOW() + INTERVAL '24 hours'")) {
        items = items.filter((i) => i.expiry_status === 'GOOD');
      }

      items.sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
      return { rows: items, rowCount: items.length };
    }

    // 11. Food Stock INSERT
    if (sql.startsWith('INSERT INTO food_stock')) {
      const [food_name, category, quantity, unit, expiry_date, location_id] = params;
      const newItem = {
        id: nextFoodStockId++,
        food_name,
        category,
        quantity: Number(quantity),
        unit,
        expiry_date: new Date(expiry_date).toISOString(),
        location_id: Number(location_id),
        created_at: new Date().toISOString(),
      };
      memFoodStock.push(newItem);
      return { rows: [newItem], rowCount: 1 };
    }

    // 12. Food Stock UPDATE
    if (sql.startsWith('UPDATE food_stock')) {
      // Deduction update: SET quantity = quantity - $1 WHERE id = $2
      if (sql.includes('quantity = quantity -') || sql.includes('quantity - $1')) {
        const deductQty = Number(params[0]);
        const id = Number(params[1]);
        const index = memFoodStock.findIndex((f) => f.id === id);
        if (index === -1) return { rows: [], rowCount: 0 };
        const currentQty = Number(memFoodStock[index].quantity);
        const newQty = Number((currentQty - deductQty).toFixed(2));
        if (newQty < 0) {
          throw new Error(`Food stock quantity cannot become negative (current: ${currentQty}, deduct: ${deductQty}, resulting: ${newQty})`);
        }
        memFoodStock[index].quantity = newQty;
        return { rows: [memFoodStock[index]], rowCount: 1 };
      }

      // Direct quantity set: SET quantity = $1 WHERE id = $2
      if (sql.includes('SET quantity = $1') && params.length === 2) {
        const newQty = Number(params[0]);
        const id = Number(params[1]);
        const index = memFoodStock.findIndex((f) => f.id === id);
        if (index === -1) return { rows: [], rowCount: 0 };
        if (newQty < 0) {
          throw new Error(`Food stock quantity cannot become negative (resulting: ${newQty})`);
        }
        memFoodStock[index].quantity = Number(newQty.toFixed(2));
        return { rows: [memFoodStock[index]], rowCount: 1 };
      }

      // Standard multi-field update
      if (params.length >= 7) {
        const [food_name, category, quantity, unit, expiry_date, location_id, id] = params;
        const index = memFoodStock.findIndex((f) => f.id === Number(id));
        if (index === -1) return { rows: [], rowCount: 0 };
        if (Number(quantity) < 0) {
          throw new Error('Food stock quantity cannot become negative');
        }
        memFoodStock[index] = {
          ...memFoodStock[index],
          food_name,
          category,
          quantity: Number(quantity),
          unit,
          expiry_date: new Date(expiry_date).toISOString(),
          location_id: Number(location_id),
        };
        return { rows: [memFoodStock[index]], rowCount: 1 };
      }
    }

    // 13. Food Stock DELETE
    if (sql.startsWith('DELETE FROM food_stock')) {
      const id = Number(params[0]);
      const index = memFoodStock.findIndex((f) => f.id === id);
      if (index === -1) return { rows: [], rowCount: 0 };
      const deleted = memFoodStock.splice(index, 1)[0];
      return { rows: [deleted], rowCount: 1 };
    }

    // 14. Allocations SELECT
    if (sql.includes('FROM allocations')) {
      const enriched = memAllocations.map((a) => {
        const loc = memLocations.find((l) => l.id === a.location_id);
        const food = memFoodStock.find((f) => f.id === a.food_stock_id);
        return {
          ...a,
          location_name: loc ? loc.name : `Location #${a.location_id}`,
          location_type: loc ? loc.type : 'SHELTER',
          food_name: food ? food.food_name : 'Surplus Food Batch',
        };
      });
      return { rows: enriched, rowCount: enriched.length };
    }

    // 15. Allocations INSERT
    if (sql.startsWith('INSERT INTO allocations')) {
      let food_stock_id, location_id, quantity, distance_km, priority_score, status, override_reason;
      if (params.length === 6) {
        // Form: VALUES ($1, $2, $3, $4, $5, 'CONFIRMED' / 'OVERRIDDEN', $6)
        [food_stock_id, location_id, quantity, distance_km, priority_score, override_reason] = params;
        status = sql.includes("'OVERRIDDEN'") ? 'OVERRIDDEN' : (override_reason ? 'OVERRIDDEN' : 'CONFIRMED');
      } else {
        [food_stock_id, location_id, quantity, distance_km, priority_score, status, override_reason] = params;
      }

      const newAlloc = {
        id: nextAllocationId++,
        food_stock_id: Number(food_stock_id),
        location_id: Number(location_id),
        quantity: Number(quantity),
        distance_km: Number(distance_km) || 0,
        priority_score: Number(priority_score) || 0,
        status: status || (override_reason ? 'OVERRIDDEN' : 'CONFIRMED'),
        override_reason: override_reason || null,
        allocated_at: new Date().toISOString(),
      };
      memAllocations.unshift(newAlloc);
      return { rows: [newAlloc], rowCount: 1 };
    }

    // 16. Allocations UPDATE
    if (sql.startsWith('UPDATE allocations')) {
      if (sql.includes('SET status = $1 WHERE id = $2') || (sql.includes('status = $1') && params.length === 2)) {
        const [status, id] = params;
        const index = memAllocations.findIndex((a) => a.id === Number(id));
        if (index === -1) return { rows: [], rowCount: 0 };
        memAllocations[index].status = status;
        return { rows: [memAllocations[index]], rowCount: 1 };
      }
      if (sql.includes('WHERE id = $') || sql.includes('WHERE id = $7')) {
        const id = Number(params[params.length - 1]);
        const index = memAllocations.findIndex((a) => a.id === id);
        if (index === -1) return { rows: [], rowCount: 0 };
        if (params.length >= 6) {
          memAllocations[index] = {
            ...memAllocations[index],
            status: 'CONFIRMED',
            quantity: Number(params[0]) || memAllocations[index].quantity,
            food_stock_id: Number(params[1]) || memAllocations[index].food_stock_id,
            location_id: Number(params[2]) || memAllocations[index].location_id,
            distance_km: Number(params[3]) || memAllocations[index].distance_km,
            priority_score: Number(params[4]) || memAllocations[index].priority_score,
            override_reason: params[5] || memAllocations[index].override_reason,
          };
        }
        return { rows: [memAllocations[index]], rowCount: 1 };
      }
    }

    // 17. Alerts INSERT
    if (sql.startsWith('INSERT INTO alerts')) {
      const [location_id, type, message, severity, is_read] = params;
      const newAlert = {
        id: nextAlertId++,
        location_id: location_id ? Number(location_id) : null,
        type: type || 'ALLOCATION_CONFIRMED',
        message: message || '',
        severity: (severity || 'info').toLowerCase(),
        is_read: is_read === true || is_read === 'true',
        created_at: new Date().toISOString(),
      };
      memAlerts.unshift(newAlert);
      return { rows: [newAlert], rowCount: 1 };
    }

    // 18. Alerts UPDATE
    if (sql.startsWith('UPDATE alerts')) {
      if (sql.includes('WHERE id = $1')) {
        const id = Number(params[0]);
        const index = memAlerts.findIndex((a) => a.id === id);
        if (index === -1) return { rows: [], rowCount: 0 };
        memAlerts[index].is_read = true;
        return { rows: [memAlerts[index]], rowCount: 1 };
      }
      if (sql.includes('SET is_read = TRUE') || sql.includes('SET is_read = true')) {
        memAlerts.forEach((a) => {
          a.is_read = true;
        });
        return { rows: [...memAlerts], rowCount: memAlerts.length };
      }
    }

    // 19. Alerts DELETE
    if (sql.startsWith('DELETE FROM alerts')) {
      const id = Number(params[0]);
      const index = memAlerts.findIndex((a) => a.id === id);
      if (index === -1) return { rows: [], rowCount: 0 };
      const deleted = memAlerts.splice(index, 1)[0];
      return { rows: [deleted], rowCount: 1 };
    }

    // 20. Alerts SELECT
    if (sql.includes('FROM alerts')) {
      let list = memAlerts.map((a) => {
        const loc = memLocations.find((l) => l.id === a.location_id);
        return {
          ...a,
          location_name: loc ? loc.name : null,
          location_type: loc ? loc.type : null,
        };
      });

      if (sql.includes('WHERE id = $1')) {
        const id = Number(params[0]);
        const item = list.find((a) => a.id === id);
        return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
      }

      if (sql.includes('is_read = false') || sql.includes('is_read = FALSE')) {
        list = list.filter((a) => !a.is_read);
      }

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows: list, rowCount: list.length };
    }

    // 19. Users SQL Handlers (Auth & RBAC)
    if (sql.includes('FROM users') || sql.includes('INTO users') || sql.includes('UPDATE users')) {
      if (sql.startsWith('INSERT INTO users')) {
        const [name, email, password, role] = params;
        const existing = memUsers.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
        if (existing) {
          throw new Error('User with this email already exists');
        }
        const newUser = {
          id: nextUserId++,
          name: name || 'User',
          email: String(email).toLowerCase(),
          password,
          role: role || 'coordinator',
          created_at: new Date().toISOString(),
        };
        memUsers.push(newUser);
        return { rows: [newUser], rowCount: 1 };
      }

      if (sql.includes('WHERE email = $1') || sql.includes('WHERE LOWER(email) = LOWER($1)')) {
        const target = String(params[0]).toLowerCase();
        const user = memUsers.find((u) => u.email.toLowerCase() === target);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      }

      if (sql.includes('WHERE id = $1')) {
        const targetId = Number(params[0]);
        const user = memUsers.find((u) => u.id === targetId);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      }

      return { rows: [...memUsers], rowCount: memUsers.length };
    }

    return { rows: [], rowCount: 0 };
  }
};

/**
 * Execute operations within a database transaction.
 * In production with PostgreSQL: runs BEGIN, COMMIT, and ROLLBACK.
 * In development without PostgreSQL: takes an atomic snapshot of in-memory tables
 * and completely rolls back all data modifications if any step throws an error.
 */
export const withTransaction = async (callback) => {
  let client = null;
  let isPgConnected = false;
  try {
    client = await pool.connect();
    isPgConnected = true;
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    if (isPgConnected && client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        console.error('Error during PostgreSQL transaction rollback:', rbErr);
      }
    }

    if (!isPgConnected) {
      // Memory development transaction fallback
      const snapshot = {
        foodStock: JSON.parse(JSON.stringify(memFoodStock)),
        demand: JSON.parse(JSON.stringify(memDemand)),
        vehicles: JSON.parse(JSON.stringify(memVehicles)),
        locations: JSON.parse(JSON.stringify(memLocations)),
        allocations: JSON.parse(JSON.stringify(memAllocations)),
        alerts: JSON.parse(JSON.stringify(memAlerts)),
        users: JSON.parse(JSON.stringify(memUsers)),
        nextAllocId: nextAllocationId,
        nextAlertId: nextAlertId,
        nextUserId: nextUserId,
      };

      try {
        const mockClient = {
          query: (text, params) => query(text, params),
        };
        const result = await callback(mockClient);
        return result;
      } catch (mockErr) {
        // Atomic ROLLBACK: restore previous in-memory state
        memFoodStock = snapshot.foodStock;
        memDemand = snapshot.demand;
        memVehicles = snapshot.vehicles;
        memLocations = snapshot.locations;
        memAllocations = snapshot.allocations;
        memAlerts = snapshot.alerts;
        memUsers = snapshot.users;
        nextAllocationId = snapshot.nextAllocId;
        nextAlertId = snapshot.nextAlertId;
        nextUserId = snapshot.nextUserId;
        throw mockErr;
      }
    }

    throw err;
  } finally {
    if (client) {
      try {
        client.release();
      } catch (relErr) {
        // ignore
      }
    }
  }
};

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export default pool;
