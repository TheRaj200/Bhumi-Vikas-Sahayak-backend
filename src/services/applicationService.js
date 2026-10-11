import { REPORT_LIMITATIONS, STRINGS } from '../constants/strings.js';
import { applicationsRepository, complianceRepository } from '../repositories/applicationsRepository.js';
import { HttpError } from '../utils/httpError.js';
import { complianceService } from './complianceService.js';

export const applicationService = {
  async listApplications() {
    return applicationsRepository.list();
  },

  async getApplication(id) {
    const app = await applicationsRepository.getById(id);
    if (!app) throw new HttpError(404, 'APPLICATION_NOT_FOUND', `Application ${id} not found.`);
    const events = await applicationsRepository.getReviewEvents(app.id || app._id || id);
    let latestCheck = null;
    if (app.latest_check_id) {
      latestCheck = await complianceRepository.getCheckById(app.latest_check_id);
    }
    return { application: app, latest_check: latestCheck, review_events: events };
  },

  async createApplication(data) {
    return applicationsRepository.create(data);
  },

  async updateApplication(id, data) {
    const app = await applicationsRepository.update(id, data);
    if (!app) throw new HttpError(404, 'APPLICATION_NOT_FOUND', `Application ${id} not found.`);
    return app;
  },

  async addReviewEvent(id, eventData) {
    const app = await applicationsRepository.getById(id);
    if (!app) throw new HttpError(404, 'APPLICATION_NOT_FOUND', `Application ${id} not found.`);
    return applicationsRepository.addReviewEvent(id, eventData);
  },

  async generateReport(id, lang = 'en') {
    const app = await applicationsRepository.getById(id);
    if (!app) throw new HttpError(404, 'APPLICATION_NOT_FOUND', `Application ${id} not found.`);

    let latestCheck = null;
    if (app.latest_check_id) {
      latestCheck = await complianceRepository.getCheckById(app.latest_check_id);
    }

    if (!latestCheck && app.inputs) {
      latestCheck = await complianceService.runComplianceCheck({ inputs: app.inputs, application_id: id });
    }

    const events = await applicationsRepository.getReviewEvents(id);

    return {
      application_id: id,
      title: app.title,
      generated_at: new Date().toISOString(),
      lang,
      disclaimer: lang === 'hi' ? STRINGS.disclaimer.hi : STRINGS.disclaimer.en,
      inputs: app.inputs,
      compliance_summary: latestCheck?.summary || null,
      overall_status: latestCheck?.overall_status || 'needs_information',
      findings: latestCheck?.findings || [],
      missing_inputs: latestCheck?.missing_inputs || [],
      input_issues: latestCheck?.input_issues || [],
      next_actions: latestCheck?.next_actions || [],
      review_events: events,
      limitations: lang === 'hi' ? REPORT_LIMITATIONS.hi : REPORT_LIMITATIONS.en,
    };
  },
};
