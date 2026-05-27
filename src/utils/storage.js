// src/utils/storage.js

const USERS_KEY = 'toeic_sprint_users';
const CURRENT_USER_ID_KEY = 'toeic_sprint_current_user_id';

// Helper to get formatted future dates
const getFutureDate = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
};

// Seed initial users if they do not exist
const seedUsers = () => {
  const users = [
    {
      id: 'alex_seed',
      username: 'Alex (Gold Team) 🥇',
      createdAt: new Date().toISOString(),
      goals: {
        targetScore: 850,
        examDate: getFutureDate(45),
        dailyVocabularyGoal: 30,
        dailyQuestionGoal: 50,
        dailyStudyMinutesGoal: 60,
        dailyErrorReviewGoal: 10,
        weeklyMockTestGoal: 1
      },
      progress: {
        streakDays: 12,
        totalQuestionsAnswered: 320,
        totalCorrect: 262,
        totalWrong: 58,
        totalStudyMinutes: 420,
        learnedVocabularyCount: 180
      },
      vocabularyProgress: {}, // wordId -> status (learning, review, mastered)
      wrongBook: [],
      practiceHistory: [],
      mockTestHistory: [
        {
          id: 'mock_h1',
          date: getFutureDate(-5),
          mode: 'Mini Mock',
          totalQuestions: 20,
          correctCount: 16,
          wrongCount: 4,
          score: 810,
          timeSpent: 780 // seconds
        }
      ],
      // Tracks daily tasks: { date: 'YYYY-MM-DD', wordsLearned: 15, questionsAnswered: 25, studyMinutes: 35 }
      dailyRecords: [
        {
          date: new Date().toISOString().split('T')[0],
          wordsLearned: 18,
          questionsAnswered: 35,
          studyMinutes: 45
        }
      ]
    },
    {
      id: 'sarah_seed',
      username: 'Sarah (Sprint King) 👑',
      createdAt: new Date().toISOString(),
      goals: {
        targetScore: 950,
        examDate: getFutureDate(30),
        dailyVocabularyGoal: 40,
        dailyQuestionGoal: 60,
        dailyStudyMinutesGoal: 90,
        dailyErrorReviewGoal: 15,
        weeklyMockTestGoal: 2
      },
      progress: {
        streakDays: 25,
        totalQuestionsAnswered: 680,
        totalCorrect: 618,
        totalWrong: 62,
        totalStudyMinutes: 890,
        learnedVocabularyCount: 310
      },
      vocabularyProgress: {},
      wrongBook: [],
      practiceHistory: [],
      mockTestHistory: [
        {
          id: 'mock_h2',
          date: getFutureDate(-3),
          mode: 'Mini Mock',
          totalQuestions: 20,
          correctCount: 19,
          wrongCount: 1,
          score: 940,
          timeSpent: 620
        }
      ],
      dailyRecords: [
        {
          date: new Date().toISOString().split('T')[0],
          wordsLearned: 42,
          questionsAnswered: 65,
          studyMinutes: 95
        }
      ]
    },
    {
      id: 'toeic_master_seed',
      username: 'TOEIC Master 🚀',
      createdAt: new Date().toISOString(),
      goals: {
        targetScore: 990,
        examDate: getFutureDate(15),
        dailyVocabularyGoal: 50,
        dailyQuestionGoal: 80,
        dailyStudyMinutesGoal: 120,
        dailyErrorReviewGoal: 20,
        weeklyMockTestGoal: 2
      },
      progress: {
        streakDays: 48,
        totalQuestionsAnswered: 1450,
        totalCorrect: 1390,
        totalWrong: 60,
        totalStudyMinutes: 2450,
        learnedVocabularyCount: 650
      },
      vocabularyProgress: {},
      wrongBook: [],
      practiceHistory: [],
      mockTestHistory: [
        {
          id: 'mock_h3',
          date: getFutureDate(-2),
          mode: 'Mini Mock',
          totalQuestions: 20,
          correctCount: 20,
          wrongCount: 0,
          score: 990,
          timeSpent: 550
        }
      ],
      dailyRecords: [
        {
          date: new Date().toISOString().split('T')[0],
          wordsLearned: 55,
          questionsAnswered: 82,
          studyMinutes: 130
        }
      ]
    }
  ];

  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return users;
};

// Initialize Storage
export const initStorage = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    seedUsers();
  }
};

// Get all users
export const getUsers = () => {
  initStorage();
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
};

// Save all users
export const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Get current user ID
export const getCurrentUserId = () => {
  return localStorage.getItem(CURRENT_USER_ID_KEY) || '';
};

// Set current user ID
export const setCurrentUserId = (userId) => {
  localStorage.setItem(CURRENT_USER_ID_KEY, userId);
};

// Get active user data
export const getCurrentUser = () => {
  const users = getUsers();
  const currentId = getCurrentUserId();
  if (!currentId) return null;
  return users.find(u => u.id === currentId) || null;
};

// Update active user data
export const updateCurrentUser = (updateFn) => {
  const users = getUsers();
  const currentId = getCurrentUserId();
  if (!currentId) return null;

  const userIndex = users.findIndex(u => u.id === currentId);
  if (userIndex === -1) return null;

  const updatedUser = updateFn(users[userIndex]);
  users[userIndex] = updatedUser;
  saveUsers(users);
  return updatedUser;
};

// Add new user profile
export const createUser = (username, passwordHash = '', salt = '') => {
  const users = getUsers();
  const newUser = {
    id: 'user_' + Date.now(),
    username: username,
    passwordHash: passwordHash,
    salt: salt,
    createdAt: new Date().toISOString(),
    goals: {
      targetScore: 700,
      examDate: '',
      dailyVocabularyGoal: 30,
      dailyQuestionGoal: 30,
      dailyStudyMinutesGoal: 45,
      dailyErrorReviewGoal: 10,
      weeklyMockTestGoal: 1
    },
    progress: {
      streakDays: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalStudyMinutes: 0,
      learnedVocabularyCount: 0
    },
    vocabularyProgress: {},
    wrongBook: [],
    practiceHistory: [],
    mockTestHistory: [],
    dailyRecords: []
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
};

// Set password for migration or password change
export const setPasswordForUser = (userId, passwordHash, salt) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;
  users[userIndex].passwordHash = passwordHash;
  users[userIndex].salt = salt;
  saveUsers(users);
  return users[userIndex];
};

// Delete user account
export const deleteUser = (userId) => {
  let users = getUsers();
  users = users.filter(u => u.id !== userId);
  saveUsers(users);
  if (getCurrentUserId() === userId) {
    setCurrentUserId('');
  }
};

// Reset user account data
export const resetUserData = (userId) => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return;

  users[userIndex] = {
    ...users[userIndex],
    progress: {
      streakDays: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalStudyMinutes: 0,
      learnedVocabularyCount: 0
    },
    vocabularyProgress: {},
    wrongBook: [],
    practiceHistory: [],
    mockTestHistory: [],
    dailyRecords: []
  };

  saveUsers(users);
};

// Get today's record for a user
export const getTodayRecord = (user) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!user.dailyRecords) {
    user.dailyRecords = [];
  }
  let todayRec = user.dailyRecords.find(r => r.date === todayStr);
  if (!todayRec) {
    todayRec = {
      date: todayStr,
      wordsLearned: 0,
      questionsAnswered: 0,
      studyMinutes: 0
    };
  }
  return todayRec;
};

// Update today's record in state
export const updateTodayRecord = (user, fieldsToUpdate) => {
  const todayStr = new Date().toISOString().split('T')[0];
  if (!user.dailyRecords) {
    user.dailyRecords = [];
  }
  let recordIndex = user.dailyRecords.findIndex(r => r.date === todayStr);

  if (recordIndex === -1) {
    const newRecord = {
      date: todayStr,
      wordsLearned: 0,
      questionsAnswered: 0,
      studyMinutes: 0,
      ...fieldsToUpdate
    };
    user.dailyRecords.push(newRecord);
  } else {
    user.dailyRecords[recordIndex] = {
      ...user.dailyRecords[recordIndex],
      ...fieldsToUpdate
    };
  }

  // Handle streak updates dynamically
  if (user.progress.streakDays === 0) {
    user.progress.streakDays = 1;
  }

  return user;
};
