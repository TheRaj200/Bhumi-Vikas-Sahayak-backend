import { applicationService } from '../services/applicationService.js';
import {
  applicationCreateSchema,
  applicationUpdateSchema,
  idParamSchema,
  reviewEventCreateSchema,
} from '../validation/schemas.js';

export const applicationsController = {
  async listApplications(_req, res, next) {
    try {
      const list = await applicationService.listApplications();
      return res.json({ applications: list });
    } catch (err) {
      return next(err);
    }
  },

  async getApplicationById(req, res, next) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const app = await applicationService.getApplication(id);
      return res.json(app);
    } catch (err) {
      return next(err);
    }
  },

  async createApplication(req, res, next) {
    try {
      const data = applicationCreateSchema.parse(req.body);
      const created = await applicationService.createApplication(data);
      return res.status(201).json(created);
    } catch (err) {
      return next(err);
    }
  },

  async updateApplication(req, res, next) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = applicationUpdateSchema.parse(req.body);
      const updated = await applicationService.updateApplication(id, data);
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  },

  async addReviewEvent(req, res, next) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = reviewEventCreateSchema.parse(req.body);
      const event = await applicationService.addReviewEvent(id, data);
      return res.status(201).json(event);
    } catch (err) {
      return next(err);
    }
  },

  async getReport(req, res, next) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const lang = req.query.lang === 'hi' ? 'hi' : 'en';
      const report = await applicationService.generateReport(id, lang);
      return res.json(report);
    } catch (err) {
      return next(err);
    }
  },
};
