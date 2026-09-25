import { Router } from 'express';
import { getMapData } from '../controllers/mapController.js';

const router = Router();

// GET /api/map - Returns all locations, vehicles, and demand markers with calculated marker types
router.get('/', getMapData);

export default router;
