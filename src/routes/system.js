import { Router } from 'express';
import { systemController } from '../controllers/systemController.js';

export const systemRouter = Router();

// §1
systemRouter.get('/health', systemController.getHealth);

// §2
systemRouter.get('/meta', systemController.getMeta);
