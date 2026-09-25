import { Router } from 'express';
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController.js';
import { validateLocation } from '../middleware/validateLocation.js';

const router = Router();

// Location CRUD endpoints
router.get('/', getAllLocations);
router.get('/:id', getLocationById);
router.post('/', validateLocation, createLocation);
router.put('/:id', validateLocation, updateLocation);
router.delete('/:id', deleteLocation);

export default router;
