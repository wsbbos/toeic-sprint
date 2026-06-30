// src/data/listeningQuestionBank.js

export const listeningQuestionBank = [
  {
    id: 'lq31',
    part: 1,
    type: '聽力照片描述',
    question: 'Look at the photo and choose the best description.',
    choices: {
      A: 'A man is working on a laptop computer.',
      B: 'A man is standing near a whiteboard.',
      C: 'A man is organizing documents in a cabinet.',
      D: 'A man is repairing a photocopier.'
    },
    answer: 'A',
    explanation: '聽力音檔描述：(A) 男子正在筆記型電腦上工作。這與照片中男子在辦公桌前專注用電腦的景象完全吻合，因此選 A。',
    difficulty: 'Easy',
    transcript: '(A) A man is working on a laptop computer. (B) A man is standing near a whiteboard. (C) A man is organizing documents in a cabinet. (D) A man is repairing a photocopier.',
    audioText: '(A) A man is working on a laptop computer. (B) A man is standing near a whiteboard. (C) A man is organizing documents in a cabinet. (D) A man is repairing a photocopier.',
    imageUrl: '',
    isDemo: true,
    tags: ['聽力Part 1', '照片描述']
  },
  {
    id: 'lq32',
    part: 2,
    type: '聽力應答',
    question: 'Listen to the question. Choose the best response.',
    choices: {
      A: 'To the advertising department on the third floor.',
      B: 'By next Friday afternoon at 5:00 PM.',
      C: 'Yes, I read the report yesterday morning.',
      D: 'Mr. Davis is managing that campaign.'
    },
    answer: 'B',
    explanation: '聽力問題：行銷報告期限是什麼時候 (When)？(B)「下週五下午五點前」是回答時間截止期的正確答案，選 B。',
    difficulty: 'Easy',
    transcript: 'When is the final marketing report due?',
    audioText: 'When is the final marketing report due?',
    isDemo: true,
    tags: ['聽力Part 2', '應答問題']
  },
  {
    id: 'lq33',
    part: 3,
    type: '聽力簡短對話',
    question: 'Listen to the conversation. What is the man waiting for?',
    choices: {
      A: 'A passenger flight ticket refund',
      B: 'Approval for corporate travel budget funds',
      C: 'A promotional discount code',
      D: 'Chicago hotel recommendations'
    },
    answer: 'B',
    explanation: "聽力對話中約翰提及：'I was waiting for approval from the CFO for travel funds'。因此約翰在等待經費核准，選 B。",
    difficulty: 'Medium',
    transcript: 'W: Hi, John. Did you book a flight to Chicago for the sales convention yet? M: Not yet, Sarah. I was waiting for approval from the CFO for travel funds. She signed off on the budget this morning. W: Great! Please book the flight quickly, as ticket prices are expected to rise tomorrow.',
    audioText: 'Hi, John. Did you book a flight to Chicago for the sales convention yet? Not yet, Sarah. I was waiting for approval from the CFO for travel funds. She signed off on the budget this morning. Great! Please book the flight quickly, as ticket prices are expected to rise tomorrow.',
    isDemo: true,
    tags: ['聽力Part 3', '對話細節']
  },
  {
    id: 'lq34',
    part: 3,
    type: '聽力簡短對話',
    question: 'Listen to the conversation. What does the woman suggest the man do next?',
    choices: {
      A: 'Email the meeting minutes to the directors',
      B: 'Reserve the flight tickets immediately',
      C: 'Negotiate a budget plan with the supplier',
      D: 'Postpone the business trip to next week'
    },
    answer: 'B',
    explanation: "對話結尾女士建議：'Please book the flight quickly'，'Reserve flight tickets immediately' 為其同義改寫。選 B。",
    difficulty: 'Medium',
    transcript: 'W: Hi, John. Did you book a flight to Chicago for the sales convention yet? M: Not yet, Sarah. I was waiting for approval from the CFO for travel funds. She signed off on the budget this morning. W: Great! Please book the flight quickly, as ticket prices are expected to rise tomorrow.',
    audioText: 'Hi, John. Did you book a flight to Chicago for the sales convention yet? Not yet, Sarah. I was waiting for approval from the CFO for travel funds. She signed off on the budget this morning. Great! Please book the flight quickly, as ticket prices are expected to rise tomorrow.',
    isDemo: true,
    tags: ['聽力Part 3', '行動建議']
  },
  {
    id: 'lq35',
    part: 4,
    type: '聽力簡短獨白',
    question: 'Listen to the announcement. What is the reason for the flight delay?',
    choices: {
      A: 'Mechanical maintenance issues',
      B: 'Incoming airport traffic congestion',
      C: 'Severe winter snowstorms',
      D: 'Flight crew members scheduling conflict'
    },
    answer: 'B',
    explanation: "獨白中提及：'delayed by approximately forty minutes due to incoming airport congestion'。選 B。",
    difficulty: 'Medium',
    transcript: 'Attention passengers of Flight UA-388 to San Francisco. Our departure has been delayed by approximately forty minutes due to incoming airport congestion. We apologize for this inconvenience. Boarding will now commence at Gate 14 at 2:15 PM instead of the original gate.',
    audioText: 'Attention passengers of Flight UA-388 to San Francisco. Our departure has been delayed by approximately forty minutes due to incoming airport congestion. We apologize for this inconvenience. Boarding will now commence at Gate 14 at 2:15 PM instead of the original gate.',
    isDemo: true,
    tags: ['聽力Part 4', '獨白細節']
  }
];

export const isListeningQuestionPracticeReady = (question) => {
  if (!question || question.part < 1 || question.part > 4) return false;
  if (question.part !== 1) return true;
  return Boolean(question.imageUrl || question.image || question.photo);
};

export const getPracticeReadyListeningQuestions = () => listeningQuestionBank.filter(isListeningQuestionPracticeReady);