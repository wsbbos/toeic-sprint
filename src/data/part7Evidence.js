const PART7_EVIDENCE = Object.freeze({
  q101: { quote: 'our corporate headquarters will relocate to the new Green Plaza building', label: '搬遷公告' },
  q102: { quote: 'our current office will be closed from Friday, July 10, at 6:00 PM through Tuesday, July 14, at 8:00 AM', label: '關閉期間' },
  q103: { quote: 'Employees are requested to pack their personal belongings by July 9', label: '員工行動' },
  q104: { quote: 'organizing a mandatory sales training session on Friday, June 12', label: '郵件目的' },
  q105: { quote: 'The training will be led by Ms. Sarah Miller, a senior marketing consultant', label: '講師資訊' },
  q106: { quote: "Please bring a laptop and your copy of last quarter's sales summary report", label: '攜帶物品' },
  q107: { quote: 'implementing strict travel budget regulations starting July 1, 2026', label: '政策主旨' },
  q108: { quote: 'Hotel accommodation expenses are limited to a maximum of $150 per night', label: '住宿限額' },
  q109: { quote: 'Receipts must be submitted to claim reimbursement within ten business days of returning', label: '報帳期限' },
  q110: { quote: 'the ultimate collaborative software tool', label: '產品定位' },
  q111: { quote: 'Try our 14-day free trial', label: '試用期間' },
  q112: { quote: 'Purchase before June 30 to receive complimentary 24/7 technical helpline support', label: '購買優惠' },
  q113: { quote: 'I am writing to express my disappointment regarding a recent shipment from your warehouse', label: '客訴目的' },
  q114: { quote: 'the consignment did not arrive until May 25', label: '到貨日期' },
  q115: { quote: 'We demand a replacement for the damaged chairs immediately and a refund for the express shipping fee', label: '客戶訴求' },
  q116: { quote: 'plans to retire at the end of this fiscal year on December 31, 2026', label: '公告主旨' },
  q117: { quote: 'at the end of this fiscal year on December 31, 2026', label: '退休日期' },
  q118: { quote: "The board expects to announce the official appointment of Mr. Green's successor by next October", label: '公告時程' },
  q119: { quote: 'corporate network servers will undergo essential maintenance and software upgrades next weekend', label: '維護主旨' },
  q120: { quote: 'corporate email services will remain active on mobile devices', label: '可用服務' },
  q121: { quote: 'Employees are advised to save all active project documents to local drives before Friday evening', label: '事前行動' },
  q122: { quote: 'We invite you to attend the 15th Annual Marketing Summit', label: '活動主旨' },
  q123: { quote: 'Early-bird registration rate is $300, valid until June 30', label: '早鳥期限' },
  q124: { quote: 'Group discounts of 15% are available for corporate delegations of five or more attendees', label: '團體折扣' },
  q125: { quote: "offers premium office spaces for lease in the heart of Boston's business district", label: '廣告標的' },
  q126: { quote: 'Suite 900: 350 square meters, features executive offices, two conference rooms', label: '空間設備' },
  q127: { quote: 'Contact leasing manager Robert Davis at rdavis@oakwood-center.com for viewing', label: '看房聯絡人' },
  q128: { quote: 'In compliance with the new state environmental guidelines and to reduce our administrative overhead costs', label: '計畫目標' },
  q129: { quote: 'We plan to eliminate plastic utensils and paper cups in the cafeteria by July 15', label: '淘汰期限' },
  q130: { quote: 'A 10% bonus will be awarded to departments that achieve a 20% reduction in electricity consumption', label: '獎勵條件' },
})

export function getPart7Evidence(questionId) {
  const evidence = PART7_EVIDENCE[questionId]
  return evidence ? { ...evidence } : null
}

export { PART7_EVIDENCE }
