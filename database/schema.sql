-- ====================================================================
-- Smart Food Allocation Optimization System - Database Schema
-- Focus: SDG 2 - Zero Hunger
-- Database Engine: PostgreSQL 14+
-- ====================================================================

-- Clean slate / recreate tables if needed (in proper foreign key dependency order)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS allocations CASCADE;
DROP TABLE IF EXISTS demand CASCADE;
DROP TABLE IF EXISTS food_stock CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ====================================================================
-- 1. USERS TABLE
-- Stores coordinators, donors, shelters, drivers, and administrators
-- ====================================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('coordinator', 'donor', 'shelter', 'volunteer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 2. LOCATIONS TABLE
-- Stores donor facilities, emergency shelters, food banks, and hubs
-- ====================================================================
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('COMMUNITY_KITCHEN', 'SCHOOL', 'SHELTER', 'RELIEF_CENTER', 'HOSPITAL', 'donor', 'shelter', 'food_bank', 'community_kitchen', 'distribution_center')),
    latitude DECIMAL(10, 8) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude DECIMAL(11, 8) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    capacity NUMERIC(10, 2) NOT NULL DEFAULT 0.0 CHECK (capacity >= 0.0),
    population INT NOT NULL DEFAULT 0 CHECK (population >= 0),
    contact_person VARCHAR(150),
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 3. FOOD_STOCK TABLE
-- Real-time surplus inventory logged by donors with expiry monitoring
-- ====================================================================
CREATE TABLE food_stock (
    id SERIAL PRIMARY KEY,
    food_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('Prepared Meals', 'Fresh Produce', 'Baked Goods', 'Dairy', 'Canned Goods', 'Beverages', 'Other')),
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity >= 0.0),
    unit VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 4. DEMAND TABLE
-- Relief requests from emergency shelters, soup kitchens, and communities
-- ====================================================================
CREATE TABLE demand (
    id SERIAL PRIMARY KEY,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    required_quantity NUMERIC(10, 2) NOT NULL CHECK (required_quantity >= 0.0),
    people_count INT NOT NULL CHECK (people_count >= 0),
    urgency INT NOT NULL CHECK (urgency >= 1 AND urgency <= 5),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'MATCHED', 'IN_TRANSIT', 'FULFILLED', 'CANCELLED')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 5. VEHICLES TABLE
-- Cold-chain fleet and volunteer delivery logistics
-- ====================================================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    capacity NUMERIC(10, 2) NOT NULL CHECK (capacity >= 0.0),
    current_latitude DECIMAL(10, 8) CHECK (current_latitude >= -90.0 AND current_latitude <= 90.0),
    current_longitude DECIMAL(11, 8) CHECK (current_longitude >= -180.0 AND current_longitude <= 180.0),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BUSY', 'MAINTENANCE', 'available', 'in_transit', 'maintenance', 'scheduled', 'offline'))
);

-- ====================================================================
-- 6. ALLOCATIONS TABLE
-- Multi-objective algorithmic matching between surplus stock and shelter demand
-- ====================================================================
CREATE TABLE allocations (
    id SERIAL PRIMARY KEY,
    food_stock_id INT NOT NULL REFERENCES food_stock(id) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0.0),
    distance_km NUMERIC(8, 2) NOT NULL CHECK (distance_km >= 0.0),
    priority_score NUMERIC(5, 2) NOT NULL CHECK (priority_score >= 0.0 AND priority_score <= 100.0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'completed', 'cancelled', 'confirmed', 'CONFIRMED')),
    override_reason TEXT,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- 7. ALERTS TABLE
-- Spoilage countdowns, urgency spikes, cold-chain breaches, and notices
-- ====================================================================
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    location_id INT REFERENCES locations(id) ON DELETE SET NULL,
    type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ====================================================================
-- INDEXES FOR OPTIMIZED QUERY PERFORMANCE
-- ====================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Locations
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);

-- Food Stock
CREATE INDEX idx_food_stock_location ON food_stock(location_id);
CREATE INDEX idx_food_stock_expiry ON food_stock(expiry_date);
CREATE INDEX idx_food_stock_category ON food_stock(category);
CREATE INDEX idx_food_stock_expiry_qty ON food_stock(expiry_date, quantity);

-- Demand
CREATE INDEX idx_demand_location ON demand(location_id);
CREATE INDEX idx_demand_urgency ON demand(urgency);
CREATE INDEX idx_demand_requested_at ON demand(requested_at);

-- Vehicles
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_number ON vehicles(vehicle_number);

-- Allocations
CREATE INDEX idx_allocations_food_stock ON allocations(food_stock_id);
CREATE INDEX idx_allocations_location ON allocations(location_id);
CREATE INDEX idx_allocations_status ON allocations(status);
CREATE INDEX idx_allocations_priority ON allocations(priority_score DESC);
CREATE INDEX idx_allocations_allocated_at ON allocations(allocated_at);

-- Alerts
CREATE INDEX idx_alerts_location ON alerts(location_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
