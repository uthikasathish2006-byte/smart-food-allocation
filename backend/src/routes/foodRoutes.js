import { Router } from 'express';
import {
  getAllFood,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/foodController.js';
import { validateFood } from '../middleware/validateFood.js';

const router = Router();

// Food Stock CRUD Endpoints
router.get('/', getAllFood);
router.get('/:id', getFoodById);
router.post('/', validateFood, createFood);
router.put('/:id', validateFood, updateFood);
router.delete('/:id', deleteFood);

export default router;
