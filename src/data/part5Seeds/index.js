import { grammarSeeds } from './grammarSeeds.js'
import { usageSeeds } from './usageSeeds.js'

export const generatedPart5Seeds = [...grammarSeeds, ...usageSeeds]

if (generatedPart5Seeds.length !== 280) {
  throw new Error(`Part 5 seed invariant failed: expected 280 generated seeds, received ${generatedPart5Seeds.length}.`)
}
