# Part 5 question bank contract

Part 5 questions live in `src/data/part5QuestionBank.js`. Part 7 remains a separate data source and must not be mixed into this bank.

## Required schema

Every runtime question must contain:

- `id`: stable, unique identifier.
- `question`: unique sentence with one `-------` blank.
- `choices`: exactly four non-empty choices keyed by `A`, `B`, `C`, and `D`.
- `answer`: one of the keys present in `choices`.
- `explanation`: explanation that names or contains the correct choice.
- `category`: one value from `PART5_CATEGORIES`.
- `difficulty`: `easy`, `medium`, or `hard`.
- `tags`: one or more searchable labels.
- `version`: current `PART5_SCHEMA_VERSION`.

The legacy `part` and `grammarPoint` fields may remain for the current UI, but they are not substitutes for the formal fields above.

## Validation

Run:

```powershell
npm.cmd run validate:questions
```

The command exits non-zero for structural errors, duplicate content, invalid answers, explanation mismatches, a severely skewed answer position, or an abnormal category distribution. A bank with fewer than 100 questions receives a category sample-size warning because a strict category-distribution judgement would be misleading.

During phase 3, the current 20-question bank is expected to fail only `ANSWER_POSITION_MISSING` because no correct answer uses D. Phase 4 must replace that known debt with at least 300 validated questions and make the command exit successfully.
