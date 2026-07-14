export const part7DocumentMetadata = Object.freeze({
  p1: {
    type: 'notice',
    eyebrow: 'Facilities update',
    title: 'Notice of Office Relocation',
    fields: { Issued: 'June 1, 2026', Effective: 'July 15, 2026' },
    callouts: ['Current office closed July 10–14', 'Pack personal belongings by July 9'],
  },
  p2: {
    type: 'email',
    title: 'Mandatory Sales Training Session',
    fields: { To: 'Sales Division Staff', From: 'Robert Chen, HR Director', Date: 'June 5, 2026' },
    attachment: "Last quarter's sales summary report",
  },
  p3: {
    type: 'memo',
    eyebrow: 'Finance Department',
    title: 'Updated Corporate Travel Policy',
    fields: { To: 'All Department Heads', Effective: 'July 1, 2026' },
    callouts: ['Economy class for domestic flights', '$150 maximum hotel rate', 'CFO approval for international travel'],
  },
  p4: {
    type: 'advertisement',
    eyebrow: 'TaskMaster 5.0',
    title: 'Streamline Projects. Deliver On Time.',
    metrics: [{ label: 'Free trial', value: '14 days' }, { label: 'Annual saving', value: '20%' }],
    callouts: ['Interactive Gantt charts', 'Real-time file sharing', 'Automated meeting minutes'],
    action: 'Start a free trial',
  },
  p5: {
    type: 'email',
    title: 'Shipment Complaint — Invoice CH-9921',
    fields: { To: 'Customer Support', From: 'Julia Vance, Green Tech Corp.', Sent: 'After May 25' },
    attachment: 'Damage photos · Invoice CH-9921',
  },
  p6: {
    type: 'notice',
    eyebrow: 'Board of Directors',
    title: 'Leadership Transition Announcement',
    fields: { Issued: 'June 12, 2026', Retirement: 'December 31, 2026' },
    metrics: [{ label: 'CEO tenure', value: '15 years' }, { label: 'Revenue growth', value: '300%+' }],
  },
  p7: {
    type: 'schedule',
    eyebrow: 'IT maintenance window',
    title: 'Scheduled System Maintenance',
    columns: ['Time', 'Service status'],
    rows: [
      ['Fri · before evening', 'Save active files to local drives'],
      ['Sat · 8:00 AM', 'Maintenance begins'],
      ['Sun · 6:00 PM', 'Systems return online'],
    ],
    callouts: ['Mobile email remains available'],
  },
  p8: {
    type: 'form',
    eyebrow: 'Event registration',
    title: '15th Annual Marketing Summit',
    fields: {
      Dates: 'August 10–12, 2026',
      Venue: 'Grand Hotel, Boston',
      'Early-bird rate': '$300 through June 30',
      'Group discount': '15% for 5+ attendees',
    },
    action: 'Register for the summit',
  },
  p9: {
    type: 'table_chart',
    eyebrow: 'Oakwood Commercial Center',
    title: 'Available Office Suites',
    columns: ['Suite', 'Area', 'Best for', 'Highlights'],
    rows: [
      ['402', '120 m²', '10–15 people', 'Startup workspace'],
      ['900', '350 m²', 'Established team', '2 conference rooms'],
    ],
    callouts: ['Wi-Fi included', '24/7 security', 'Valet parking'],
  },
  p10: {
    type: 'memo',
    eyebrow: 'Sustainability Committee',
    title: 'Green Office Initiative Updates',
    fields: { To: 'All Department Supervisors', Starts: 'July 1' },
    callouts: ['Recycled procurement', 'No disposable cafeteria utensils after July 15', '10% performance bonus'],
  },
})

export const getPart7DocumentMetadata = (passageId) => part7DocumentMetadata[passageId] || null
