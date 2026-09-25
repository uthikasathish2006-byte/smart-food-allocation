import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import foodRoutes from './foodRoutes.js';
import locationRoutes from './locationRoutes.js';
import vehicleRoutes from './vehicleRoutes.js';
import allocationRoutes from './allocationRoutes.js';
import demandRoutes from './demandRoutes.js';
import alertRoutes from './alertRoutes.js';
import mapRoutes from './mapRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import historyRoutes from './historyRoutes.js';
import authRoutes from './authRoutes.js';
import { query } from '../db/database.js';

const router = Router();

// Mount API sub-routers
router.use('/auth', authRoutes);
router.use('/food', foodRoutes);
router.use('/locations', locationRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/demand', demandRoutes);
router.use('/allocation', allocationRoutes);
router.use('/alerts', alertRoutes);
router.use('/map', mapRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/history', historyRoutes);
router.use('/', healthRoutes);

// Database connection verification endpoint
router.get('/db-check', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.status(200).json({
      success: true,
      status: 'connected',
      dbTime: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

export default router;
