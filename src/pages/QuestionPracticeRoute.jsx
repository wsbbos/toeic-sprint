import QuestionPractice from './QuestionPractice.jsx'
import { questionsData } from '../data/questions.js'

export default function QuestionPracticeRoute(props) {
  return <QuestionPractice {...props} questions={questionsData} />
}
