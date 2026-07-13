import Vocabulary from './Vocabulary.jsx'
import { vocabularyData } from '../data/vocabulary.js'

export default function VocabularyRoute(props) {
  return <Vocabulary {...props} vocabulary={vocabularyData} />
}
