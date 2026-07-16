export const PART7_SCHEMA_VERSION = 'part7-v1'
export const PART7_ANSWER_KEYS = Object.freeze(['A', 'B', 'C', 'D'])
export const PART7_TYPES = Object.freeze(['主旨', '細節', '推論'])
export const PART7_DIFFICULTIES = Object.freeze(['Easy', 'Medium', 'Hard'])
export const PART7_REQUIRED_FIELDS = Object.freeze([
  'id',
  'part',
  'type',
  'passageId',
  'passage',
  'document',
  'evidence',
  'question',
  'choices',
  'correctAnswer',
  'explanation',
  'difficulty',
  'tags',
  'version',
])