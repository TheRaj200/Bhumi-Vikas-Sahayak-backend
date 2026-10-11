import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDbConnected } from '../db/connect.js';
import { Application, ComplianceCheck, ReviewEvent } from '../models/index.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const samplesPath = path.resolve(dir, '../data/sample_applications.json');

const memoryStore = {
  applications: new Map(),
  reviewEvents: new Map(),
  complianceChecks: new Map(),
};

function initMemoryStore() {
  if (memoryStore.applications.size > 0) return;
  try {
    const raw = fs.readFileSync(samplesPath, 'utf8');
    const samples = JSON.parse(raw);
    for (const s of samples) {
      const id = s.sample_key || crypto.randomUUID();
      memoryStore.applications.set(id, {
        _id: id,
        id,
        sample_key: s.sample_key,
        title: s.title,
        is_sample: true,
        inputs: s.inputs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  } catch (_e) {
    // fallback if file not readable
  }
}

initMemoryStore();

export const applicationsRepository = {
  async list() {
    if (isDbConnected()) {
      const list = await Application.find().sort({ updated_at: -1 }).lean();
      return list.map((doc) => ({ ...doc, id: String(doc._id || doc.id) }));
    }
    return Array.from(memoryStore.applications.values());
  },

  async getById(id) {
    if (isDbConnected()) {
      if (/^[a-f0-9]{24}$/i.test(id)) {
        const doc = await Application.findById(id).lean();
        if (doc) return { ...doc, id: String(doc._id) };
      }
      const sample = await Application.findOne({ sample_key: id }).lean();
      if (sample) return { ...sample, id: String(sample._id) };
      return memoryStore.applications.get(id) || null;
    }
    return memoryStore.applications.get(id) || null;
  },

  async create(data) {
    if (isDbConnected()) {
      const doc = new Application(data);
      await doc.save();
      const lean = doc.toObject();
      return { ...lean, id: String(lean._id) };
    }
    const id = data.sample_key || crypto.randomUUID();
    const now = new Date().toISOString();
    const doc = {
      _id: id,
      id,
      title: data.title || 'Untitled Application',
      is_sample: Boolean(data.is_sample),
      inputs: data.inputs || {},
      created_at: now,
      updated_at: now,
    };
    memoryStore.applications.set(id, doc);
    return doc;
  },

  async update(id, data) {
    if (isDbConnected()) {
      const filter = /^[a-f0-9]{24}$/i.test(id) ? { _id: id } : { sample_key: id };
      const doc = await Application.findOneAndUpdate(filter, { ...data, updated_at: new Date() }, { new: true }).lean();
      if (doc) return { ...doc, id: String(doc._id) };
      const existing = memoryStore.applications.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
      memoryStore.applications.set(id, updated);
      return updated;
    }
    const existing = memoryStore.applications.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...data,
      inputs: data.inputs ? { ...existing.inputs, ...data.inputs } : existing.inputs,
      updated_at: new Date().toISOString(),
    };
    memoryStore.applications.set(id, updated);
    return updated;
  },

  async addReviewEvent(appId, eventData) {
    if (isDbConnected()) {
      if (/^[a-f0-9]{24}$/i.test(appId)) {
        const doc = new ReviewEvent({ application_id: appId, ...eventData });
        await doc.save();
        const lean = doc.toObject();
        return { ...lean, id: String(lean._id) };
      }
    }
    const eventId = crypto.randomUUID();
    const event = {
      _id: eventId,
      id: eventId,
      application_id: appId,
      ...eventData,
      created_at: new Date().toISOString(),
    };
    const list = memoryStore.reviewEvents.get(appId) || [];
    list.push(event);
    memoryStore.reviewEvents.set(appId, list);
    return event;
  },

  async getReviewEvents(appId) {
    if (isDbConnected() && /^[a-f0-9]{24}$/i.test(appId)) {
      const list = await ReviewEvent.find({ application_id: appId }).sort({ created_at: -1 }).lean();
      return list.map((doc) => ({ ...doc, id: String(doc._id || doc.id) }));
    }
    return memoryStore.reviewEvents.get(appId) || [];
  },
};

export const complianceRepository = {
  async saveCheck(data) {
    if (isDbConnected()) {
      const doc = new ComplianceCheck(data);
      await doc.save();
      return doc.toObject();
    }
    const id = data.check_run_id || crypto.randomUUID();
    const doc = { _id: id, id, ...data };
    memoryStore.complianceChecks.set(id, doc);
    return doc;
  },

  async getCheckById(id) {
    if (isDbConnected()) {
      return ComplianceCheck.findById(id).lean();
    }
    return memoryStore.complianceChecks.get(id) || null;
  },
};
