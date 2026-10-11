// Shared JSON shape for every model: `id` as string, no `_id` / `__v` (docs/API_CONTRACT.md "Basics").
export function toApiJson(schema) {
  schema.set('toJSON', {
    virtuals: false,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  });
}
