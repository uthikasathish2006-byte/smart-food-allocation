-- ====================================================================
-- Smart Food Allocation Optimization System - Demo Seed Data
-- Focus: SDG 2 - Zero Hunger
-- Database Engine: PostgreSQL 14+
-- ====================================================================

-- Clear existing data if any (cascading deletes will handle child tables)
TRUNCATE TABLE alerts, allocations, demand, food_stock, vehicles, locations, users RESTART IDENTITY CASCADE;

-- ====================================================================
-- 1. SEED USERS
-- Password hash represents bcrypt('$2a$10$w...demo_password')
-- ====================================================================
INSERT INTO users (name, email, password_hash, role, created_at) VALUES
('Dr. Sarah Lin', 'coordinator@zerohunger.org', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'coordinator', NOW() - INTERVAL '30 days'),
('Elena Rostova', 'donor@greenmarket.com', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'donor', NOW() - INTERVAL '25 days'),
('Antoine Laurent', 'antoine@grandhotel.com', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'donor', NOW() - INTERVAL '20 days'),
('Marcus Vance', 'shelter@hopevalley.org', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'shelter', NOW() - INTERVAL '15 days'),
('Sister Theresa Chen', 'theresa@harbormission.org', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'shelter', NOW() - INTERVAL '12 days'),
('Samuel Gomez', 'samuel.driver@zerohunger.org', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'volunteer', NOW() - INTERVAL '10 days'),
('Aisha Al-Mansoor', 'aisha.driver@zerohunger.org', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'volunteer', NOW() - INTERVAL '8 days'),
('Admin Lead', 'admin@zerohunger.org', '$2a$10$e8g3j2kFjF9v81M7rQ9YyeX0Y8hI5s9J5P1N2Q3R4S5T6U7V8W9Xa', 'admin', NOW() - INTERVAL '60 days');

-- ====================================================================
-- 2. SEED LOCATIONS
-- Community kitchens, schools, shelters, relief centers, and hospitals
-- ====================================================================
INSERT INTO locations (name, type, latitude, longitude, capacity, population, contact_person, contact_phone, created_at) VALUES
('Harbor Mission Community Kitchen', 'COMMUNITY_KITCHEN', 37.79550000, -122.39370000, 600.00, 450, 'Sister Theresa Chen', '+1 (555) 771-3940', NOW() - INTERVAL '25 days'),
('Lincoln High Nutrition Canteen', 'SCHOOL', 37.74900000, -122.48200000, 1200.00, 850, 'Principal Robert Hayes', '+1 (555) 432-1100', NOW() - INTERVAL '20 days'),
('Hope Valley Emergency Shelter', 'SHELTER', 37.78330000, -122.41670000, 350.00, 280, 'Marcus Vance', '+1 (555) 982-4112', NOW() - INTERVAL '18 days'),
('East Bay Central Relief Center', 'RELIEF_CENTER', 37.80440000, -122.27120000, 2500.00, 1400, 'Elena Rostova', '+1 (555) 610-8201', NOW() - INTERVAL '15 days'),
('St. Jude Regional Hospital Care Wing', 'HOSPITAL', 37.76500000, -122.42000000, 800.00, 520, 'Dr. Aris Thorne', '+1 (555) 321-7788', NOW() - INTERVAL '12 days'),
('Metropolitan Community Kitchen', 'COMMUNITY_KITCHEN', 37.77490000, -122.41940000, 500.00, 310, 'David Miller', '+1 (555) 234-8891', NOW() - INTERVAL '10 days'),
('Oakridge Academy Food Center', 'SCHOOL', 37.75500000, -122.41000000, 950.00, 620, 'Claire Beauchamp', '+1 (555) 882-3344', NOW() - INTERVAL '8 days'),
('Sunrise Relief Logistics Hub', 'RELIEF_CENTER', 37.76120000, -122.38540000, 4000.00, 2100, 'Maya Lin', '+1 (555) 443-9090', NOW() - INTERVAL '6 days');

-- ====================================================================
-- 3. SEED FOOD_STOCK
-- Active surplus food batches from donor facilities
-- ====================================================================
INSERT INTO food_stock (food_name, category, quantity, unit, expiry_date, location_id, created_at) VALUES
('Organic Apples & Citrus Crates', 'Fresh Produce', 180.00, 'kg', NOW() + INTERVAL '18 hours', 1, NOW() - INTERVAL '6 hours'),
('Nutritious Rice & Veggie Stew Meals', 'Prepared Meals', 250.00, 'meals', NOW() + INTERVAL '4 hours', 2, NOW() - INTERVAL '2 hours'),
('Whole Wheat Loaves & Baguettes', 'Baked Goods', 120.00, 'loaves', NOW() + INTERVAL '6 hours', 3, NOW() - INTERVAL '4 hours'),
('Potatoes, Carrots & Leafy Greens', 'Fresh Produce', 520.00, 'kg', NOW() + INTERVAL '96 hours', 4, NOW() - INTERVAL '8 hours'),
('Pasteurized Whole Milk & Yogurt', 'Dairy', 300.00, 'liters', NOW() + INTERVAL '48 hours', 1, NOW() - INTERVAL '12 hours'),
('High-Protein Lentil & Quinoa Bowls', 'Prepared Meals', 140.00, 'servings', NOW() + INTERVAL '5 hours', 2, NOW() - INTERVAL '1 hour');

-- ====================================================================
-- 4. SEED DEMAND
-- Real-time hunger relief requirements from shelters and community kitchens
-- ====================================================================
INSERT INTO demand (location_id, required_quantity, people_count, urgency, status, requested_at) VALUES
(3, 180.00, 180, 5, 'PENDING', NOW() - INTERVAL '45 minutes'),
(1, 300.00, 300, 4, 'MATCHED', NOW() - INTERVAL '90 minutes'),
(4, 450.00, 380, 5, 'PENDING', NOW() - INTERVAL '2 hours'),
(2, 220.00, 220, 3, 'IN_TRANSIT', NOW() - INTERVAL '3 hours'),
(5, 95.00, 95, 2, 'FULFILLED', NOW() - INTERVAL '4 hours'),
(6, 130.00, 130, 1, 'PENDING', NOW() - INTERVAL '6 hours');

-- ====================================================================
-- 5. SEED VEHICLES
-- Logistics transport fleet equipped with cold-chain telemetry
-- ====================================================================
INSERT INTO vehicles (vehicle_number, capacity, current_latitude, current_longitude, status) VALUES
('EV-FOOD-901', 800.00, 37.78500000, -122.40800000, 'BUSY'),
('EV-FOOD-902', 800.00, 37.77400000, -122.41900000, 'AVAILABLE'),
('BIKE-CARGO-12', 150.00, 37.76800000, -122.42500000, 'BUSY'),
('TRK-COLD-05', 2500.00, 37.76000000, -122.39000000, 'AVAILABLE'),
('VAN-FREEZE-08', 1200.00, 37.79200000, -122.39800000, 'MAINTENANCE'),
('EV-FOOD-903', 750.00, 37.75500000, -122.41500000, 'AVAILABLE');

-- ====================================================================
-- 6. SEED ALLOCATIONS
-- Optimal matching between donor food batches and recipient shelters
-- ====================================================================
INSERT INTO allocations (food_stock_id, location_id, quantity, distance_km, priority_score, status, override_reason, allocated_at) VALUES
(2, 6, 250.00, 2.10, 98.40, 'in_transit', NULL, NOW() - INTERVAL '25 minutes'),
(3, 5, 120.00, 3.40, 95.20, 'in_transit', NULL, NOW() - INTERVAL '20 minutes'),
(1, 7, 150.00, 5.70, 92.80, 'approved', NULL, NOW() - INTERVAL '15 minutes');

-- ====================================================================
-- 7. SEED ALERTS
-- Real-time operational incident and spoilage monitoring alerts
-- ====================================================================
INSERT INTO alerts (location_id, type, message, severity, is_read, created_at) VALUES
(2, 'expiry_warning', '250 hot boxed meals at City Central Hotel must be dispatched immediately to prevent spoilage.', 'critical', FALSE, NOW() - INTERVAL '10 minutes'),
(5, 'demand_surge', 'Hope Valley Emergency Shelter reported 40 additional vulnerable individuals requiring evening nourishment.', 'high', FALSE, NOW() - INTERVAL '25 minutes'),
(1, 'temperature_alert', 'Eco-Van Alpha sensor reported 3.4°C (Safe threshold: 4.0°C). Temperature nearing limit.', 'medium', FALSE, NOW() - INTERVAL '42 minutes'),
(4, 'system_notice', 'SunHarvest Organics connected 520 kg surplus root vegetables ready for collection.', 'info', TRUE, NOW() - INTERVAL '1 hour');
