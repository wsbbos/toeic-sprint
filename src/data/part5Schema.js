export const PART5_SCHEMA_VERSION = '1.0.0'

export const PART5_ANSWER_KEYS = Object.freeze(['A', 'B', 'C', 'D'])

export const PART5_DIFFICULTIES = Object.freeze(['easy', 'medium', 'hard'])

export const PART5_CATEGORIES = Object.freeze([
  'word_form',
  'verb_tense',
  'voice',
  'subject_verb_agreement',
  'preposition',
  'conjunction',
  'relative_clause',
  'pronoun',
  'comparison',
  'participle',
  'infinitive',
  'gerund',
  'vocabulary',
  'business_collocation'
])

export const PART5_REQUIRED_FIELDS = Object.freeze([
  'id',
  'question',
  'choices',
  'answer',
  'explanation',
  'category',
  'difficulty',
  'tags',
  'version'
])
