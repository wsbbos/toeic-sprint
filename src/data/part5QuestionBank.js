// src/data/part5QuestionBank.js

import { PART5_SCHEMA_VERSION } from './part5Schema.js';

const categoryById = Object.freeze({
  'p5-001': 'word_form',
  'p5-002': 'verb_tense',
  'p5-003': 'voice',
  'p5-004': 'preposition',
  'p5-005': 'conjunction',
  'p5-006': 'relative_clause',
  'p5-007': 'participle',
  'p5-008': 'infinitive',
  'p5-009': 'word_form',
  'p5-010': 'subject_verb_agreement',
  'p5-011': 'preposition',
  'p5-012': 'conjunction',
  'p5-013': 'participle',
  'p5-014': 'verb_tense',
  'p5-015': 'preposition',
  'p5-016': 'relative_clause',
  'p5-017': 'word_form',
  'p5-018': 'vocabulary',
  'p5-019': 'verb_tense',
  'p5-020': 'verb_tense'
});

const part5SeedQuestions = [
  {
    id: 'p5-001',
    part: 'Part 5',
    question: 'The finance team prepared the quarterly report ------- to meet the board\'s deadline.',
    choices: { A: 'careful', B: 'carefully', C: 'carefulness', D: 'caring' },
    answer: 'B',
    explanation: 'The blank modifies the verb prepared, so the adverb carefully is required.',
    grammarPoint: 'Word form: adverbs modify verbs.',
    difficulty: 'easy',
    tags: ['word form', 'adverb', 'business report']
  },
  {
    id: 'p5-002',
    part: 'Part 5',
    question: 'All employees ------- the updated security policy before accessing the new database.',
    choices: { A: 'review', B: 'reviewed', C: 'must review', D: 'reviewing' },
    answer: 'C',
    explanation: 'The sentence expresses an obligation before accessing a system, so must review is the best choice.',
    grammarPoint: 'Modal verbs: must + base verb.',
    difficulty: 'easy',
    tags: ['modal verb', 'workplace policy', 'verb form']
  },
  {
    id: 'p5-003',
    part: 'Part 5',
    question: 'The revised contract ------- by the legal department yesterday afternoon.',
    choices: { A: 'approved', B: 'was approved', C: 'approves', D: 'approving' },
    answer: 'B',
    explanation: 'The contract receives the action, and yesterday afternoon marks past time, so the past passive form was approved is correct.',
    grammarPoint: 'Passive voice: was/were + past participle.',
    difficulty: 'medium',
    tags: ['passive voice', 'past tense', 'contract']
  },
  {
    id: 'p5-004',
    part: 'Part 5',
    question: 'Please send the purchase order ------- email so that we can process it immediately.',
    choices: { A: 'by', B: 'on', C: 'at', D: 'from' },
    answer: 'A',
    explanation: 'The fixed expression is by email, meaning using email as the method.',
    grammarPoint: 'Preposition collocation: by email.',
    difficulty: 'easy',
    tags: ['preposition', 'collocation', 'purchase order']
  },
  {
    id: 'p5-005',
    part: 'Part 5',
    question: '------- the supplier offered a discount, the purchasing manager requested a better warranty.',
    choices: { A: 'Although', B: 'Because', C: 'Unless', D: 'During' },
    answer: 'A',
    explanation: 'The two clauses contrast with each other, so although is the correct subordinating conjunction.',
    grammarPoint: 'Conjunctions: although introduces contrast.',
    difficulty: 'medium',
    tags: ['conjunction', 'contrast', 'supplier']
  },
  {
    id: 'p5-006',
    part: 'Part 5',
    question: 'The consultant ------- we hired last month will lead the market research project.',
    choices: { A: 'who', B: 'which', C: 'whose', D: 'where' },
    answer: 'A',
    explanation: 'The relative pronoun refers to the consultant, a person, so who is correct.',
    grammarPoint: 'Relative pronouns: who refers to people.',
    difficulty: 'medium',
    tags: ['relative pronoun', 'people', 'consultant']
  },
  {
    id: 'p5-007',
    part: 'Part 5',
    question: '------- the final figures, the analyst noticed several unusual expenses.',
    choices: { A: 'Reviewed', B: 'Reviewing', C: 'Reviews', D: 'To reviewed' },
    answer: 'B',
    explanation: 'Reviewing forms a participial phrase that describes what the analyst was doing.',
    grammarPoint: 'Participial phrases: present participle for active meaning.',
    difficulty: 'hard',
    tags: ['participle', 'sentence reduction', 'financial analysis']
  },
  {
    id: 'p5-008',
    part: 'Part 5',
    question: 'The company plans to ------- its customer service team before the holiday season.',
    choices: { A: 'expand', B: 'expansion', C: 'expansive', D: 'expanded' },
    answer: 'A',
    explanation: 'After plans to, use the base verb expand.',
    grammarPoint: 'Infinitives: to + base verb.',
    difficulty: 'easy',
    tags: ['verb form', 'infinitive', 'customer service']
  },
  {
    id: 'p5-009',
    part: 'Part 5',
    question: 'The new inventory system has ------- reduced the time needed to locate products.',
    choices: { A: 'significant', B: 'significance', C: 'significantly', D: 'signify' },
    answer: 'C',
    explanation: 'The blank modifies the verb phrase has reduced, so the adverb significantly is needed.',
    grammarPoint: 'Word form: adverbs modify verb phrases.',
    difficulty: 'easy',
    tags: ['word form', 'adverb', 'inventory']
  },
  {
    id: 'p5-010',
    part: 'Part 5',
    question: 'The marketing proposal ------- several practical ways to attract younger customers.',
    choices: { A: 'outlines', B: 'outline', C: 'outlining', D: 'outlined' },
    answer: 'A',
    explanation: 'The subject is singular, and the sentence describes a current fact, so outlines is correct.',
    grammarPoint: 'Subject-verb agreement: singular subject + singular verb.',
    difficulty: 'medium',
    tags: ['subject verb agreement', 'present tense', 'marketing']
  },
  {
    id: 'p5-011',
    part: 'Part 5',
    question: 'Ms. Rivera was appointed ------- regional sales director after ten years with the company.',
    choices: { A: 'as', B: 'to', C: 'for', D: 'with' },
    answer: 'A',
    explanation: 'The correct phrase is appointed as a role or position.',
    grammarPoint: 'Preposition collocation: appointed as.',
    difficulty: 'medium',
    tags: ['preposition', 'collocation', 'promotion']
  },
  {
    id: 'p5-012',
    part: 'Part 5',
    question: 'The training session will begin at 9:00 A.M. ------- all participants have signed in.',
    choices: { A: 'once', B: 'despite', C: 'during', D: 'whether' },
    answer: 'A',
    explanation: 'Once means as soon as and correctly introduces the time condition.',
    grammarPoint: 'Conjunctions: once introduces a time condition.',
    difficulty: 'medium',
    tags: ['conjunction', 'time clause', 'training']
  },
  {
    id: 'p5-013',
    part: 'Part 5',
    question: 'The documents ------- in the secure cabinet contain confidential client information.',
    choices: { A: 'store', B: 'stored', C: 'storing', D: 'stores' },
    answer: 'B',
    explanation: 'Stored is a past participle that reduces the passive clause documents that are stored.',
    grammarPoint: 'Reduced relative clauses: past participle for passive meaning.',
    difficulty: 'hard',
    tags: ['participle', 'reduced clause', 'confidential documents']
  },
  {
    id: 'p5-014',
    part: 'Part 5',
    question: 'The accounting department will ------- the reimbursement requests by Friday.',
    choices: { A: 'process', B: 'processed', C: 'processing', D: 'procession' },
    answer: 'A',
    explanation: 'After will, use the base verb process.',
    grammarPoint: 'Future tense: will + base verb.',
    difficulty: 'easy',
    tags: ['future tense', 'verb form', 'reimbursement']
  },
  {
    id: 'p5-015',
    part: 'Part 5',
    question: 'The software update was delayed ------- an unexpected server problem.',
    choices: { A: 'because', B: 'due to', C: 'although', D: 'unless' },
    answer: 'B',
    explanation: 'Due to is followed by a noun phrase, and an unexpected server problem is a noun phrase.',
    grammarPoint: 'Cause expressions: due to + noun phrase.',
    difficulty: 'medium',
    tags: ['preposition phrase', 'cause', 'software']
  },
  {
    id: 'p5-016',
    part: 'Part 5',
    question: 'The hiring committee selected the candidate ------- experience best matched the job requirements.',
    choices: { A: 'who', B: 'whose', C: 'which', D: 'whom' },
    answer: 'B',
    explanation: 'Whose shows possession: the candidate whose experience matched the requirements.',
    grammarPoint: 'Relative pronouns: whose shows possession.',
    difficulty: 'hard',
    tags: ['relative pronoun', 'possession', 'hiring']
  },
  {
    id: 'p5-017',
    part: 'Part 5',
    question: 'The branch manager gave a ------- explanation of the new refund policy.',
    choices: { A: 'clearly', B: 'clarify', C: 'clear', D: 'clearness' },
    answer: 'C',
    explanation: 'The blank modifies the noun explanation, so the adjective clear is required.',
    grammarPoint: 'Word form: adjectives modify nouns.',
    difficulty: 'easy',
    tags: ['word form', 'adjective', 'policy']
  },
  {
    id: 'p5-018',
    part: 'Part 5',
    question: 'The manufacturer increased production to meet the growing ------- for electric delivery vans.',
    choices: { A: 'demand', B: 'demanding', C: 'demanded', D: 'demands' },
    answer: 'A',
    explanation: 'Demand is the business noun meaning market need; growing demand is the common phrase.',
    grammarPoint: 'Business vocabulary: demand means market need.',
    difficulty: 'medium',
    tags: ['business vocabulary', 'noun', 'manufacturing']
  },
  {
    id: 'p5-019',
    part: 'Part 5',
    question: 'Our team has ------- completed the client presentation, so it is ready for review.',
    choices: { A: 'yet', B: 'already', C: 'soon', D: 'still' },
    answer: 'B',
    explanation: 'Already fits the present perfect structure and means the action is complete earlier than expected.',
    grammarPoint: 'Present perfect adverbs: already with completed actions.',
    difficulty: 'medium',
    tags: ['present perfect', 'adverb', 'presentation']
  },
  {
    id: 'p5-020',
    part: 'Part 5',
    question: 'The sales director requested that the final quotation ------- sent to the client today.',
    choices: { A: 'is', B: 'be', C: 'was', D: 'being' },
    answer: 'B',
    explanation: 'After verbs like requested that, formal English often uses the base form be in the subjunctive.',
    grammarPoint: 'Subjunctive: request that + subject + base verb.',
    difficulty: 'hard',
    tags: ['subjunctive', 'formal business English', 'quotation']
  }
];

export const part5QuestionBank = part5SeedQuestions.map((question) => ({
  ...question,
  category: categoryById[question.id],
  version: PART5_SCHEMA_VERSION
}));

export const getPart5PracticeQuestions = () => part5QuestionBank;
