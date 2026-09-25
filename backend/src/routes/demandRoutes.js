import { Router } from 'express';
import {
  getAllDemands,
  getDemandById,
  createDemand,
  updateDemand,
  deleteDemand,
} from '../controllers/demandController.js';
import { validateDemand } from '../middleware/validateDemand.js';

const router = Router();

router.get('/', getAllDemands);
router.get('/:id', getDemandById);
router.post('/', validateDemand, createDemand);
router.put('/:id', validateDemand, updateDemand);
router.delete('/:id', deleteDemand);

export default router;
