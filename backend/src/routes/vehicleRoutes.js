import { Router } from 'express';
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicleController.js';
import { validateVehicle } from '../middleware/validateVehicle.js';

const router = Router();

// Fleet Vehicle CRUD routes
router.get('/', getAllVehicles);
router.get('/:id', getVehicleById);
router.post('/', validateVehicle, createVehicle);
router.put('/:id', validateVehicle, updateVehicle);
router.delete('/:id', deleteVehicle);

export default router;
