import { Router } from 'express';
import { applicationsController } from '../controllers/applicationsController.js';

export const applicationsRouter = Router();

// §8
applicationsRouter.post('/applications', applicationsController.createApplication);

// §9
applicationsRouter.get('/applications', applicationsController.listApplications);

// §10
applicationsRouter.get('/applications/:id', applicationsController.getApplicationById);

// §11
applicationsRouter.put('/applications/:id', applicationsController.updateApplication);

// §12
applicationsRouter.post('/applications/:id/review-events', applicationsController.addReviewEvent);

// §13 — F8, F12, F13
applicationsRouter.get('/applications/:id/report', applicationsController.getReport);
