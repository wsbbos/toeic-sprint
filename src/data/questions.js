import { listeningQuestionBank } from './listeningQuestionBank.js';
import { part5QuestionBank } from './part5QuestionBank.js';
import { getPart7DocumentMetadata } from './part7Documents.js';
import { getPart7Evidence } from './part7Evidence.js';

// src/data/questions.js

// Part 5 is sourced exclusively from the validated production question bank.
const rawPart7Data = [
  // Passage 1: Office relocation notice (q101-q103)
  {
    passageId: "p1",
    passage: "NOTICE OF OFFICE RELOCATION\nTo: All Employees of Apex Solutions\nFrom: Facilities Management\nDate: June 1, 2026\nWe are pleased to announce that our corporate headquarters will relocate to the new Green Plaza building in downtown Seattle, starting July 15, 2026. The new facility offers larger workspaces, advanced amenities, and direct access to public transit. \nPlease note that our current office will be closed from Friday, July 10, at 6:00 PM through Tuesday, July 14, at 8:00 AM to facilitate the transport of equipment. During this period, all systems including corporate email and servers will undergo scheduled maintenance and may be offline. Employees are requested to pack their personal belongings by July 9.",
    questions: [
      {
        id: "q101",
        part: 7,
        type: "主旨",
        question: "What is the main purpose of the notice?",
        choices: {
          A: "To announce scheduled server maintenance",
          B: "To inform staff about an office relocation",
          C: "To introduce a new public transit route",
          D: "To recruit facility management assistants"
        },
        correctAnswer: "B",
        explanation: "公告標題為 NOTICE OF OFFICE RELOCATION，且首句說明總部將於7月15日搬遷至西雅圖市中心，故主旨是告知員工辦公室搬遷的消息。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "公司公告"]
      },
      {
        id: "q102",
        part: 7,
        type: "細節",
        question: "When will the current office be officially closed?",
        choices: {
          A: "On June 1",
          B: "On July 9",
          C: "From July 10 to July 14",
          D: "On July 15"
        },
        correctAnswer: "C",
        explanation: "文中指出「our current office will be closed from Friday, July 10, at 6:00 PM through Tuesday, July 14, at 8:00 AM」，因此關閉時間是7月10日至14日。選 C。",
        difficulty: "Medium",
        tags: ["細節題", "時間定位"]
      },
      {
        id: "q103",
        part: 7,
        type: "細節",
        question: "What are employees asked to do by July 9?",
        choices: {
          A: "Access the company servers remotely",
          B: "Pack their personal belongings",
          C: "Submit travel reimbursement invoices",
          D: "Attend a public transit training session"
        },
        correctAnswer: "B",
        explanation: "最後一句明確指出「Employees are requested to pack their personal belongings by July 9」，故選 B。",
        difficulty: "Medium",
        tags: ["細節題", "行動建議"]
      }
    ]
  },
  // Passage 2: Sales Training Email (q104-q106)
  {
    passageId: "p2",
    passage: "To: Sales Division Staff\nFrom: Robert Chen, HR Director\nDate: June 5, 2026\nSubject: Mandatory Sales Training Session\nDear Colleagues,\nIn order to improve our sales numbers and prepare for the launch of our new software next quarter, HR is organizing a mandatory sales training session on Friday, June 12, from 9:00 AM to 1:00 PM in Conference Room A. \nThe training will be led by Ms. Sarah Miller, a senior marketing consultant from Miller & Associates. She will introduce advanced negotiation strategies and customer retention techniques. Please bring a laptop and your copy of last quarter's sales summary report. Refreshments will be served during the coffee break.",
    questions: [
      {
        id: "q104",
        part: 7,
        type: "主旨",
        question: "Why was the email sent?",
        choices: {
          A: "To recruit senior marketing consultants",
          B: "To announce a mandatory sales training session",
          C: "To postpone a software launching conference",
          D: "To complain about poor customer retention rates"
        },
        correctAnswer: "B",
        explanation: "主旨為 Mandatory Sales Training Session（強制性銷售培訓課程），文中通知銷售部門全體人員於6月12日參加培訓。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "內部郵件"]
      },
      {
        id: "q105",
        part: 7,
        type: "細節",
        question: "Who will lead the training session?",
        choices: {
          A: "Robert Chen",
          B: "Julia Vance",
          C: "Sarah Miller",
          D: "Henderson Davis"
        },
        correctAnswer: "C",
        explanation: "文中第二段指出「The training will be led by Ms. Sarah Miller, a senior marketing consultant」，故主持人是 Sarah Miller。選 C。",
        difficulty: "Easy",
        tags: ["細節題", "人名定位"]
      },
      {
        id: "q106",
        part: 7,
        type: "細節",
        question: "What should attendees bring to the session?",
        choices: {
          A: "A printed restaurant menu",
          B: "A laptop and last quarter's sales report",
          C: "A signed hotel booking invoice",
          D: "A passport and visa itinerary"
        },
        correctAnswer: "B",
        explanation: "文中要求「Please bring a laptop and your copy of last quarter's sales summary report」，故選 B。",
        difficulty: "Medium",
        tags: ["細節題", "攜帶物品"]
      }
    ]
  },
  // Passage 3: Corporate Travel Policy Memo (q107-q109)
  {
    passageId: "p3",
    passage: "MEMORANDUM\nTo: All Department Heads\nFrom: Finance Department\nDate: June 8, 2026\nSubject: Updated Corporate Travel Policy\nDue to current market deficits and our goal to improve overall profitability, we are implementing strict travel budget regulations starting July 1, 2026. \n1. First-class and business-class flights will no longer be reimbursed. All employees must travel economy-class for domestic flights.\n2. Hotel accommodation expenses are limited to a maximum of $150 per night. Receipts must be submitted to claim reimbursement within ten business days of returning.\n3. International corporate travel must be approved in writing by the CFO beforehand. Detailed guidelines are available on the employee portal.",
    questions: [
      {
        id: "q107",
        part: 7,
        type: "主旨",
        question: "What is the primary topic of the memo?",
        choices: {
          A: "A software relocation protocol",
          B: "An updated corporate travel policy",
          C: "A recruitment interview shortlist",
          D: "An international tourist itinerary"
        },
        correctAnswer: "B",
        explanation: "備忘錄主題為 Updated Corporate Travel Policy（更新的企業差旅政策），主要在規定縮減差旅預算。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "公司備忘錄"]
      },
      {
        id: "q108",
        part: 7,
        type: "細節",
        question: "What is the maximum nightly hotel expense permitted?",
        choices: {
          A: "$50",
          B: "$100",
          C: "$150",
          D: "$200"
        },
        correctAnswer: "C",
        explanation: "第二項規定「Hotel accommodation expenses are limited to a maximum of $150 per night」，限額為 150 美元。選 C。",
        difficulty: "Easy",
        tags: ["細節題", "數字定位"]
      },
      {
        id: "q109",
        part: 7,
        type: "細節",
        question: "By when must travel reimbursement receipts be submitted?",
        choices: {
          A: "Within June 8",
          B: "By July 1",
          C: "Within ten business days of returning",
          D: "Before boarding the return flight"
        },
        correctAnswer: "C",
        explanation: "第二項後半句指出「Receipts must be submitted to claim reimbursement within ten business days of returning」，選 C。",
        difficulty: "Medium",
        tags: ["細節題", "期限定位"]
      }
    ]
  },
  // Passage 4: Product Advertisement (q110-q112)
  {
    passageId: "p4",
    passage: "STREAMLINE PROJECTS WITH TASKMASTER 5.0!\nIs your company struggling with heavy workloads and delayed projects? Optimize your team's work efficiency today with TaskMaster 5.0—the ultimate collaborative software tool! \nKey Features:\n- Interactive Gantt charts to coordinate timelines\n- Real-time file sharing and confidential storage\n- Automated meeting minutes generation\nTry our 14-day free trial at www.taskmaster-software.com. Annual subscription plans offer a 20% discount. Purchase before June 30 to receive complimentary 24/7 technical helpline support!",
    questions: [
      {
        id: "q110",
        part: 7,
        type: "主旨",
        question: "What product is being advertised?",
        choices: {
          A: "A secure commercial cargo ship",
          B: "A collaborative project management software",
          C: "A luxury hotel accommodation package",
          D: "A state-of-the-art office photocopy machine"
        },
        correctAnswer: "B",
        explanation: "文宣標題與內容介紹 TaskMaster 5.0，稱其為「the ultimate collaborative software tool」，即協作專案管理軟體。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "商業廣告"]
      },
      {
        id: "q111",
        part: 7,
        type: "細節",
        question: "How long is the free trial period?",
        choices: {
          A: "5 days",
          B: "14 days",
          C: "20 days",
          D: "30 days"
        },
        correctAnswer: "B",
        explanation: "文中提及「Try our 14-day free trial」，免費試用期為14天。選 B。",
        difficulty: "Easy",
        tags: ["細節題", "數字定位"]
      },
      {
        id: "q112",
        part: 7,
        type: "推論",
        question: "What benefit is offered to buyers who purchase before June 30?",
        choices: {
          A: "A free upgrade to business class",
          B: "Complimentary 24/7 technical helpline support",
          C: "A 50% discount on annual subscriptions",
          D: "Free delivery of administrative equipment"
        },
        correctAnswer: "B",
        explanation: "文末指出「Purchase before June 30 to receive complimentary 24/7 technical helpline support」，故選 B。",
        difficulty: "Medium",
        tags: ["推論題", "活動優惠"]
      }
    ]
  },
  // Passage 5: Letter of Complaint (q113-q115)
  {
    passageId: "p5",
    passage: "Dear Customer Support,\nI am writing to express my disappointment regarding a recent shipment from your warehouse. On May 10, we ordered 50 office chairs (Invoice #CH-9921) for our new administrative branch, with guaranteed express delivery within 5 business days. \nHowever, the consignment did not arrive until May 25—ten days delayed. Furthermore, three chairs were severely damaged during transit, and one chair had a manufacturing defect on the wheels. We had to postpone our grand opening because of this delay. \nWe demand a replacement for the damaged chairs immediately and a refund for the express shipping fee. I have attached photos of the damaged items.\nSincerely,\nJulia Vance, Operations Director\nGreen Tech Corp.",
    questions: [
      {
        id: "q113",
        part: 7,
        type: "主旨",
        question: "Why did Ms. Vance write the letter?",
        choices: {
          A: "To complain about a delayed and damaged shipment",
          B: "To negotiate a rental lease for office space",
          C: "To request a quotation for administrative equipment",
          D: "To apply for an operational director vacancy"
        },
        correctAnswer: "A",
        explanation: "信中投訴貨物延遲抵達（ delayed）且有部分椅子損壞（damaged），要求更換與退款，為標準投訴信。選 A。",
        difficulty: "Easy",
        tags: ["主旨題", "客訴書信"]
      },
      {
        id: "q114",
        part: 7,
        type: "細節",
        question: "When did the shipment finally arrive?",
        choices: {
          A: "On May 5",
          B: "On May 10",
          C: "On May 25",
          D: "On June 1"
        },
        correctAnswer: "C",
        explanation: "信中指出「the consignment did not arrive until May 25」，故實際抵達時間是5月25日。選 C。",
        difficulty: "Easy",
        tags: ["細節題", "時間定位"]
      },
      {
        id: "q115",
        part: 7,
        type: "推論",
        question: "What does Ms. Vance demand from customer support?",
        choices: {
          A: "A free sommelier service in the cafeteria",
          B: "A replacement for the damaged items and a shipping fee refund",
          C: "A 20% discount on all future annual software subscriptions",
          D: "An extension of the corporate training probationary period"
        },
        correctAnswer: "B",
        explanation: "倒數第二段指出「We demand a replacement for the damaged chairs immediately and a refund for the express shipping fee」，對應 B 選項。選 B。",
        difficulty: "Medium",
        tags: ["推論題", "訴求主張"]
      }
    ]
  },
  // Passage 6: Corporate Announcement (q116-q118)
  {
    passageId: "p6",
    passage: "CORPORATE ANNOUNCEMENT\nApex Technologies Board of Directors\nJune 12, 2026\nThe Board of Directors officially announces that Mr. Kenneth Green, who has served as our Chief Executive Officer for the past fifteen years, plans to retire at the end of this fiscal year on December 31, 2026. \nUnder Mr. Green's outstanding leadership, our corporate revenues grew by over 300%, and we successfully launched three innovative product lines. The board has formed a special selection committee to recruit potential candidates from both inside and outside the company. The board expects to announce the official appointment of Mr. Green's successor by next October.",
    questions: [
      {
        id: "q116",
        part: 7,
        type: "主旨",
        question: "What is the primary topic of the announcement?",
        choices: {
          A: "A manufacturing defect in database software",
          B: "The planned retirement of Mr. Kenneth Green",
          C: "The establishment of a European subsidiary office",
          D: "An updated corporate invoice reimbursement policy"
        },
        correctAnswer: "B",
        explanation: "公告指出首席執行長 Mr. Kenneth Green 計劃於今年會計年度結束時退休，主旨為退休事宜。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "公司公告"]
      },
      {
        id: "q117",
        part: 7,
        type: "細節",
        question: "When is Mr. Green's retirement officially scheduled to begin?",
        choices: {
          A: "On June 12",
          B: "By next October",
          C: "On December 31, 2026",
          D: "Starting July 15, 2026"
        },
        correctAnswer: "C",
        explanation: "文中指出 Kenneth Green「plans to retire at the end of this fiscal year on December 31, 2026」，故選 C。",
        difficulty: "Easy",
        tags: ["細節題", "時間定位"]
      },
      {
        id: "q118",
        part: 7,
        type: "細節",
        question: "By when does the board expect to announce the new CEO?",
        choices: {
          A: "By June 30",
          B: "By next October",
          C: "At the end of this fiscal year",
          D: "Within ten business days"
        },
        correctAnswer: "B",
        explanation: "文末最後一句指出「The board expects to announce the official appointment of Mr. Green's successor by next October」，故選 B。",
        difficulty: "Medium",
        tags: ["細節題", "時間估計"]
      }
    ]
  },
  // Passage 7: IT Maintenance Notice (q119-q121)
  {
    passageId: "p7",
    passage: "MEMORANDUM\nTo: All Staff Members\nFrom: IT Infrastructure Department\nDate: June 15, 2026\nSubject: Scheduled IT System Maintenance\nPlease be advised that our corporate network servers will undergo essential maintenance and software upgrades next weekend, starting Saturday, June 20, at 8:00 AM through Sunday, June 21, at 6:00 PM. \nDuring this 34-hour session, the employee portal, general ledger system, and customer database will be completely offline. However, corporate email services will remain active on mobile devices. \nEmployees are advised to save all active project documents to local drives before Friday evening to prevent any loss of data. We apologize for this temporary inconvenience.",
    questions: [
      {
        id: "q119",
        part: 7,
        type: "主旨",
        question: "What is the main topic of the memorandum?",
        choices: {
          A: "A seminar on innovative database software",
          B: "A scheduled IT system maintenance session",
          C: "An administrative relocation of the IT department",
          D: "A temporary layoff of technical helpline assistants"
        },
        correctAnswer: "B",
        explanation: "備忘錄主旨為 Scheduled IT System Maintenance（預定的IT系統維護），說明伺服器與資料庫將於週末離線維護。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "內部備忘錄"]
      },
      {
        id: "q120",
        part: 7,
        type: "細節",
        question: "Which service will remain active during the maintenance?",
        choices: {
          A: "The employee portal",
          B: "The general ledger system",
          C: "Corporate email on mobile devices",
          D: "The customer database"
        },
        correctAnswer: "C",
        explanation: "文中指出「However, corporate email services will remain active on mobile devices」，故選 C。",
        difficulty: "Medium",
        tags: ["細節題", "系統狀態"]
      },
      {
        id: "q121",
        part: 7,
        type: "細節",
        question: "What are employees advised to do before Friday evening?",
        choices: {
          A: "Submit travel reimbursement invoices",
          B: "Save all active project documents locally",
          C: "Register for the sales training workshop",
          D: "Conduct a physical inventory audit check"
        },
        correctAnswer: "B",
        explanation: "文中建議「Employees are advised to save all active project documents to local drives before Friday evening」，即存在本地硬碟中。選 B。",
        difficulty: "Medium",
        tags: ["細節題", "行動建議"]
      }
    ]
  },
  // Passage 8: Invitation to Marketing Conference (q122-q124)
  {
    passageId: "p8",
    passage: "To: Business Associates\nFrom: Global Marketing Alliance\nDate: June 18, 2026\nSubject: Invitation to Annual Marketing Summit\nDear Colleagues,\nWe invite you to attend the 15th Annual Marketing Summit, which will take place from August 10 to August 12, 2026, at the Grand Hotel in Boston. \nThis year's summit focuses on 'Digital Innovation and Customer Loyalty.' Over fifty guest speakers will present strategies on brand diversification, niche market targeting, and social media advertising. \nEarly-bird registration rate is $300, valid until June 30. After this date, the standard registration fee is $450. Group discounts of 15% are available for corporate delegations of five or more attendees.",
    questions: [
      {
        id: "q122",
        part: 7,
        type: "主旨",
        question: "What event is being advertised in the email?",
        choices: {
          A: "A grand banquet celebrating a software merger",
          B: "The 15th Annual Marketing Summit",
          C: "An orientation training session for new hires",
          D: "An airport terminal renovation press conference"
        },
        correctAnswer: "B",
        explanation: "郵件主旨與首句指明邀請參加 The 15th Annual Marketing Summit（第15屆年度行銷峰會）。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "活動邀請"]
      },
      {
        id: "q123",
        part: 7,
        type: "細節",
        question: "When is the deadline for the early-bird registration rate?",
        choices: {
          A: "June 18",
          B: "June 30",
          C: "August 10",
          D: "August 12"
        },
        correctAnswer: "B",
        explanation: "文中指出「Early-bird registration rate is $300, valid until June 30」，故早鳥優惠截止於6月30日。選 B。",
        difficulty: "Easy",
        tags: ["細節題", "時間定位"]
      },
      {
        id: "q124",
        part: 7,
        type: "推論",
        question: "How can a company qualify for the 15% discount?",
        choices: {
          A: "By paying highway tolls in advance",
          B: "By sending five or more attendees",
          C: "By booking a luxury hotel suite",
          D: "By outsourcing their shipping logistics"
        },
        correctAnswer: "B",
        explanation: "文末說明「Group discounts of 15% are available for corporate delegations of five or more attendees」，即指5人或以上與會。選 B。",
        difficulty: "Medium",
        tags: ["推論題", "優待資格"]
      }
    ]
  },
  // Passage 9: Commercial Property Advertisement (q125-q127)
  {
    passageId: "p9",
    passage: "PRIME OFFICE SPACE AVAILABLE FOR LEASE\nLooking to establish a professional workspace for your growing business? Oakwood Commercial Center offers premium office spaces for lease in the heart of Boston's business district. \nAvailable Properties:\n- Suite 402: 120 square meters, perfect for a startup team of 10-15 personnel.\n- Suite 900: 350 square meters, features executive offices, two conference rooms, and a modern reception lobby.\nAll tenants enjoy complimentary amenities, including high-speed Wi-Fi, 24/7 security, and secure valet parking. Located near airport shuttle stations and highway entrances. Contact leasing manager Robert Davis at rdavis@oakwood-center.com for viewing.",
    questions: [
      {
        id: "q125",
        part: 7,
        type: "主旨",
        question: "What is being advertised in the text?",
        choices: {
          A: "Luxury resort hotel accommodation packages",
          B: "Commercial office spaces for lease",
          C: "Automobile maintenance and parking services",
          D: "Project management software annual subscriptions"
        },
        correctAnswer: "B",
        explanation: "標題 PRIME OFFICE SPACE AVAILABLE FOR LEASE（優質辦公室空間出租）表明這是一則商用不動產租賃廣告。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "商業廣告"]
      },
      {
        id: "q126",
        part: 7,
        type: "細節",
        question: "Which suite includes two conference rooms?",
        choices: {
          A: "Suite 120",
          B: "Suite 402",
          C: "Suite 900",
          D: "Suite 350"
        },
        correctAnswer: "C",
        explanation: "文中描述「Suite 900: 350 square meters, features executive offices, two conference rooms...」，故選 C。",
        difficulty: "Easy",
        tags: ["細節題", "房型定位"]
      },
      {
        id: "q127",
        part: 7,
        type: "細節",
        question: "Who should interested clients contact for a viewing?",
        choices: {
          A: "Sarah Miller",
          B: "Robert Davis",
          C: "Kenneth Green",
          D: "Julia Vance"
        },
        correctAnswer: "B",
        explanation: "最後一句指明「Contact leasing manager Robert Davis at rdavis@oakwood-center.com for viewing」，選 B。",
        difficulty: "Easy",
        tags: ["細節題", "聯絡人定位"]
      }
    ]
  },
  // Passage 10: Environmental Initiative Memo (q128-q130)
  {
    passageId: "p10",
    passage: "MEMORANDUM\nTo: All Department Supervisors\nFrom: Corporate Sustainability Committee\nDate: June 22, 2026\nSubject: Green Office Initiative Updates\nIn compliance with the new state environmental guidelines and to reduce our administrative overhead costs, we are launching the Green Office Initiative starting next month on July 1. \n- The procurement department will purchase only recycled paper and energy-efficient office equipment.\n- We plan to eliminate plastic utensils and paper cups in the cafeteria by July 15. Employees are encouraged to bring their own mugs.\n- A 10% bonus will be awarded to departments that achieve a 20% reduction in electricity consumption next quarter.",
    questions: [
      {
        id: "q128",
        part: 7,
        type: "主旨",
        question: "What is the primary goal of the Green Office Initiative?",
        choices: {
          A: "To recruit experienced HR directors",
          B: "To promote eco-friendly policies and reduce administrative costs",
          C: "To announce the liquidation of a deficit subsidiary",
          D: "To schedule a mandatory IT server maintenance session"
        },
        correctAnswer: "B",
        explanation: "備忘錄指出該計畫是「In compliance with state environmental guidelines and to reduce our administrative overhead costs」，即環保與減省行政開銷。選 B。",
        difficulty: "Easy",
        tags: ["主旨題", "公司備忘錄"]
      },
      {
        id: "q129",
        part: 7,
        type: "細節",
        question: "By when will plastic utensils be eliminated in the cafeteria?",
        choices: {
          A: "By June 22",
          B: "By July 1",
          C: "By July 15",
          D: "By next quarter"
        },
        correctAnswer: "C",
        explanation: "第二項指出「We plan to eliminate plastic utensils and paper cups in the cafeteria by July 15」，選 C。",
        difficulty: "Easy",
        tags: ["細節題", "時間定位"]
      },
      {
        id: "q130",
        part: 7,
        type: "細節",
        question: "How can departments qualify for the 10% bonus?",
        choices: {
          A: "By outsourcing cafeteria catering services",
          B: "By achieving a 20% reduction in electricity consumption",
          C: "By submitting hotel receipts within ten business days",
          D: "By completing the mandatory sales training workshop"
        },
        correctAnswer: "B",
        explanation: "最後一項指出「A 10% bonus will be awarded to departments that achieve a 20% reduction in electricity consumption」，選 B。",
        difficulty: "Medium",
        tags: ["細節題", "獎勵條件"]
      }
    ]
  }
];

// Compile Part 7 passages and their subquestions into the unified question shape.
const parsedPart7 = [];
rawPart7Data.forEach(passage => {
  passage.questions.forEach(question => {
    parsedPart7.push({
      id: question.id,
      part: 7,
      type: question.type,
      passage: passage.passage,
      document: getPart7DocumentMetadata(passage.passageId),
      evidence: getPart7Evidence(question.id),
      question: question.question,
      choices: question.choices,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      tags: question.tags,
      estimatedTime: question.type === '\u4e3b\u65e8' ? 45 : question.type === '\u7d30\u7bc0' ? 60 : 80
    });
  });
});
// Compile structured Listening question bank into the unified question shape.
const parsedListening = listeningQuestionBank.map(q => ({
  id: q.id,
  part: q.part,
  type: q.type,
  question: q.question,
  choices: q.choices,
  correctAnswer: q.answer,
  answer: q.answer,
  explanation: q.explanation,
  difficulty: q.difficulty,
  transcript: q.transcript,
  audioText: q.audioText || q.transcript,
  imageUrl: q.imageUrl,
  image: q.image,
  photo: q.photo,
  isDemo: q.isDemo,
  tags: q.tags || [],
  estimatedTime: q.estimatedTime || 45
}));
// Compile structured Part 5 question bank into the unified question shape.
const parsedPart5Bank = part5QuestionBank.map(q => ({
  id: q.id,
  part: 5,
  type: 'Incomplete Sentences',
  question: q.question,
  choices: q.choices,
  correctAnswer: q.answer,
  answer: q.answer,
  explanation: q.explanation,
  grammarPoint: q.grammarPoint,
  difficulty: q.difficulty,
  category: q.category,
  version: q.version,
  tags: q.tags || [],
  estimatedTime: q.estimatedTime || 45
}));

// Export unified questions database array
export const questionsData = [...parsedPart5Bank, ...parsedPart7, ...parsedListening];
