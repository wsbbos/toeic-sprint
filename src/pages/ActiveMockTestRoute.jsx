import ActiveMockTest from './ActiveMockTest.jsx'
import { questionsData } from '../data/questions.js'

export default function ActiveMockTestRoute(props) {
  return <ActiveMockTest {...props} questions={questionsData} />
}
