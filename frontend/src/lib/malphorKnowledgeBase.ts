export interface KBEntry {
  id: string;
  category: string;
  keywords: string[];
  title: string;
  content: string;
  actionUrl?: string;
  actionLabel?: string;
}

export const WEBSITE_KNOWLEDGE_BASE: KBEntry[] = [
  {
    id: 'login',
    category: 'Authentication',
    keywords: ['login', 'sign in', 'log in', 'access account', 'portal login', 'student login', 'teacher login', 'admin login'],
    title: 'MALPHOR Portals & Login',
    content: 'You can log into your respective MALPHOR portal from the top navigation bar or using the direct links below:',
    actionUrl: '/student/login',
    actionLabel: 'Go to Student Login'
  },
  {
    id: 'register',
    category: 'Authentication',
    keywords: ['register', 'signup', 'sign up', 'create account', 'join', 'student register', 'teacher register', 'new account'],
    title: 'Account Registration',
    content: 'New to MALPHOR? You can register as a Student or Teacher to access personalized learning dashboards:',
    actionUrl: '/student/register',
    actionLabel: 'Register as Student'
  },
  {
    id: 'student_portal',
    category: 'Portals',
    keywords: ['student portal', 'student dashboard', 'my classes', 'student tools', 'study hub', 'student area'],
    title: 'Student Portal',
    content: 'The Student Portal includes CampusGPT AI assistant, PYQ Question Paper Analyzer, Note Generator, Assignment Hub, and Course Resources.',
    actionUrl: '/student/login',
    actionLabel: 'Open Student Portal'
  },
  {
    id: 'teacher_portal',
    category: 'Portals',
    keywords: ['teacher portal', 'teacher dashboard', 'faculty portal', 'instructor dashboard', 'create assignment', 'class management'],
    title: 'Teacher Portal',
    content: 'The Teacher Portal empowers educators with automated test paper generation, AI grading assistance, class analytics, and approval management.',
    actionUrl: '/teacher/login',
    actionLabel: 'Open Teacher Portal'
  },
  {
    id: 'admin_portal',
    category: 'Portals',
    keywords: ['admin portal', 'admin dashboard', 'erp', 'system metrics', 'user approvals', 'administrator', 'system admin'],
    title: 'Admin & ERP Portal',
    content: 'The Admin Portal manages institutional ERP, teacher/student account approvals, role permissions, system analytics, and AI model configurations.',
    actionUrl: '/admin/login',
    actionLabel: 'Open Admin Portal'
  },
  {
    id: 'campusgpt',
    category: 'Features',
    keywords: ['campusgpt', 'campus gpt', 'ai assistant', 'rag chat', 'study ai', 'ai tutor', 'voice assistant'],
    title: 'CampusGPT',
    content: 'CampusGPT is our core AI learning companion with multi-model intelligence (Groq, Gemini, Llama), document RAG retrieval, voice interaction, and LaTeX equation support.',
    actionUrl: '/student/dashboard/campus-gpt',
    actionLabel: 'Launch CampusGPT'
  },
  {
    id: 'pyq_analyzer',
    category: 'Features',
    keywords: ['pyq', 'pyq analyzer', 'question paper', 'previous year questions', 'ocr paper', 'similarity check', 'exam analysis'],
    title: 'PYQ Question Paper Analyzer',
    content: 'The PYQ Analyzer performs 6-dimensional deep semantic similarity analysis on question papers, extracts LaTeX formulas from PDFs/images, and generates non-repeated replacement questions automatically.',
    actionUrl: '/student/dashboard/pyq-analyzer',
    actionLabel: 'Try PYQ Analyzer'
  },
  {
    id: 'resources',
    category: 'Resources',
    keywords: ['resources', 'notes', 'study material', 'marketplace', 'documents', 'library', 'courses', 'downloads'],
    title: 'Learning Resources & Marketplace',
    content: 'Access institutional notes, course modules, verified past papers, and teacher-shared study resources in the Marketplace.',
    actionUrl: '#features',
    actionLabel: 'Explore Resources'
  },
  {
    id: 'features',
    category: 'Overview',
    keywords: ['features', 'what can malphor do', 'capabilities', 'platform overview', 'why malphor', 'tools'],
    title: 'MALPHOR Features',
    content: 'MALPHOR features include Interactive 3D Malphor Assistant, CampusGPT RAG Chat, 6D PYQ Analyzer, Weather & Location Widget, Admin ERP, and Real-Time Voice Synthesis.',
    actionUrl: '#features',
    actionLabel: 'View All Features'
  },
  {
    id: 'about',
    category: 'Information',
    keywords: ['about', 'about malphor', 'mission', 'who built malphor', 'overview', 'info'],
    title: 'About MALPHOR',
    content: 'MALPHOR is a next-generation AI-powered institutional ecosystem built for modern universities, empowering students and faculty with intelligent tools.',
    actionUrl: '#about',
    actionLabel: 'Read About Us'
  },
  {
    id: 'contact',
    category: 'Support',
    keywords: ['contact', 'help', 'support team', 'email support', 'reach out', 'feedback', 'issue'],
    title: 'Contact & Support',
    content: 'Need assistance or have feedback? Reach out to your institutional IT admin or click below to contact MALPHOR support.',
    actionUrl: '#contact',
    actionLabel: 'Contact Support'
  },
  {
    id: 'documentation',
    category: 'Help',
    keywords: ['documentation', 'docs', 'manual', 'user guide', 'how to use', 'help center', 'api docs'],
    title: 'Documentation & Guides',
    content: 'Comprehensive guides are available inside your student/teacher portal under the Help & Documentation section.',
    actionUrl: '#docs',
    actionLabel: 'View Documentation'
  }
];

export type MalphorIntent = 
  | { type: 'WEBSITE_INSTANT'; entry: KBEntry }
  | { type: 'WEBSITE_LLM' }
  | { type: 'ACADEMIC_AI' };

export function detectMalphorIntent(userQuery: string): MalphorIntent {
  const query = userQuery.toLowerCase().trim();
  if (!query) return { type: 'ACADEMIC_AI' };

  // 1. Direct Keyword Matching against Instant KB
  for (const entry of WEBSITE_KNOWLEDGE_BASE) {
    for (const kw of entry.keywords) {
      if (query === kw || query === `where is ${kw}` || query === `where is the ${kw}` || query === `how to ${kw}` || query === `tell me about ${kw}`) {
        return { type: 'WEBSITE_INSTANT', entry };
      }
    }
  }

  // 2. High relevance keyword checking
  const websiteIntentTerms = [
    'malphor', 'login', 'register', 'signup', 'sign in', 'log in',
    'student portal', 'teacher portal', 'admin portal', 'campusgpt',
    'pyq analyzer', 'navigation', 'contact support', 'about malphor',
    'website features', 'how do i log in', 'where is the login', 'where is the portal'
  ];

  const hasWebsiteTerm = websiteIntentTerms.some(term => query.includes(term));
  if (hasWebsiteTerm) {
    const matchedEntry = WEBSITE_KNOWLEDGE_BASE.find(entry => 
      entry.keywords.some(kw => query.includes(kw))
    );
    if (matchedEntry) {
      return { type: 'WEBSITE_INSTANT', entry: matchedEntry };
    }
    return { type: 'WEBSITE_LLM' };
  }

  // 3. Otherwise default to Academic AI (homework, coding, science, general QA, math, DBMS, etc.)
  return { type: 'ACADEMIC_AI' };
}
