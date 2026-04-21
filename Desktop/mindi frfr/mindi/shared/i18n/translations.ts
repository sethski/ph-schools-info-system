// =============================================================================
// MINDI — Translations
// English (en) + Filipino / Tagalog (tl)
// Architecture-ready for future locales.
// =============================================================================

export type TranslationKey =
  // Navigation
  | 'nav.graph' | 'nav.chat' | 'nav.upload' | 'nav.settings' | 'nav.signout'
  // Brain
  | 'brain.empty.title' | 'brain.empty.body' | 'brain.empty.cta'
  | 'brain.node.confidence' | 'brain.node.version' | 'brain.node.encrypted'
  | 'brain.node.source'
  // Chat
  | 'chat.placeholder' | 'chat.empty.title' | 'chat.empty.body'
  | 'chat.sources' | 'chat.thinking' | 'chat.send'
  // Upload
  | 'upload.title' | 'upload.subtitle' | 'upload.drop' | 'upload.browse'
  | 'upload.accept' | 'upload.max' | 'upload.reading' | 'upload.scanning'
  | 'upload.building' | 'upload.done' | 'upload.pii.title' | 'upload.pii.body'
  // Auth
  | 'auth.login.title' | 'auth.login.subtitle' | 'auth.login.email'
  | 'auth.login.password' | 'auth.login.submit' | 'auth.login.google'
  | 'auth.login.signup' | 'auth.signup.title' | 'auth.signup.name'
  | 'auth.error.invalid'
  // Settings
  | 'settings.title' | 'settings.personality' | 'settings.accessibility'
  | 'settings.voice' | 'settings.export' | 'settings.privacy'
  // Proactivity
  | 'proactivity.calm.title.stressed' | 'proactivity.calm.body.stressed'
  | 'proactivity.calm.title.fatigued' | 'proactivity.calm.body.fatigued'
  // Scenarios
  | 'scenarios.title' | 'scenarios.subtitle' | 'scenarios.placeholder'
  | 'scenarios.simulate' | 'scenarios.disclaimer'
  | 'scenarios.tab.story' | 'scenarios.tab.pros' | 'scenarios.tab.cons'
  | 'scenarios.mindi.asks'
  // General
  | 'common.loading' | 'common.error.retry' | 'common.save'
  | 'common.cancel' | 'common.approve' | 'common.reject'
  | 'common.preview' | 'common.copied' | 'common.offline';

type Translations = Record<TranslationKey, string>;

export const translations: Record<string, Translations> = {
  en: {
    'nav.graph': 'Graph',
    'nav.chat': 'Chat',
    'nav.upload': 'Upload',
    'nav.settings': 'Settings',
    'nav.signout': 'Sign out',

    'brain.empty.title': 'Your brain is empty',
    'brain.empty.body': 'Upload a file to get started',
    'brain.empty.cta': 'Upload your first file →',
    'brain.node.confidence': 'Confidence',
    'brain.node.version': 'Version',
    'brain.node.encrypted': 'Encrypted',
    'brain.node.source': 'Source',

    'chat.placeholder': 'Ask Mindi anything about your brain…',
    'chat.empty.title': 'Ask me anything',
    'chat.empty.body': 'I\'ll answer with citations from your own content.',
    'chat.sources': 'Sources',
    'chat.thinking': 'Thinking…',
    'chat.send': 'Send message',

    'upload.title': 'Add to your brain',
    'upload.subtitle': 'Upload notes, code, emails, or docs. Mindi will learn your style.',
    'upload.drop': 'Drop a file here, or',
    'upload.browse': 'browse',
    'upload.accept': '.txt, .md, .pdf, .json',
    'upload.max': 'max 50MB',
    'upload.reading': 'Reading file…',
    'upload.scanning': 'Scanning for personal info…',
    'upload.building': 'Building your brain…',
    'upload.done': 'Added to your brain',
    'upload.pii.title': 'Personal info detected & removed',
    'upload.pii.body': 'Mindi found and redacted: {fields}. Your data was never sent to AI models.',

    'auth.login.title': 'Welcome back',
    'auth.login.subtitle': 'Your brain is waiting',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Sign in',
    'auth.login.google': 'Continue with Google',
    'auth.login.signup': 'Create one',
    'auth.signup.title': 'Meet Mindi',
    'auth.signup.name': 'Your name',
    'auth.error.invalid': 'Invalid credentials',

    'settings.title': 'Settings',
    'settings.personality': 'Visual Personality',
    'settings.accessibility': 'Accessibility',
    'settings.voice': 'Voice',
    'settings.export': 'Export Brain',
    'settings.privacy': 'Privacy',

    'proactivity.calm.title.stressed': 'Mindi notices some tension',
    'proactivity.calm.body.stressed': 'Take a breath. You\'re doing well.',
    'proactivity.calm.title.fatigued': 'You\'ve been at it for a while',
    'proactivity.calm.body.fatigued': 'A short break can sharpen your focus.',

    'scenarios.title': 'Simulate My Future',
    'scenarios.subtitle': 'Explore a decision through the lens of your own mind.',
    'scenarios.placeholder': 'What decision are you exploring?',
    'scenarios.simulate': 'Simulate',
    'scenarios.disclaimer': 'Grounded in your knowledge base · Not a prediction · Always your choice',
    'scenarios.tab.story': 'Story',
    'scenarios.tab.pros': 'Upsides',
    'scenarios.tab.cons': 'Challenges',
    'scenarios.mindi.asks': 'Mindi asks',

    'common.loading': 'Loading…',
    'common.error.retry': 'Something went wrong. Please try again.',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.approve': 'Approve',
    'common.reject': 'Reject',
    'common.preview': 'Preview',
    'common.copied': 'Copied!',
    'common.offline': 'You\'re offline',
  },

  tl: {
    'nav.graph': 'Grap',
    'nav.chat': 'Chat',
    'nav.upload': 'I-upload',
    'nav.settings': 'Mga Setting',
    'nav.signout': 'Mag-sign out',

    'brain.empty.title': 'Walang laman ang iyong utak',
    'brain.empty.body': 'Mag-upload ng file para magsimula',
    'brain.empty.cta': 'I-upload ang iyong unang file →',
    'brain.node.confidence': 'Kumpiyansa',
    'brain.node.version': 'Bersyon',
    'brain.node.encrypted': 'Naka-encrypt',
    'brain.node.source': 'Pinagmulan',

    'chat.placeholder': 'Tanungin si Mindi tungkol sa iyong utak…',
    'chat.empty.title': 'Tanungin ako ng kahit ano',
    'chat.empty.body': 'Sasagutin kita gamit ang mga sanggunian mula sa iyong sariling nilalaman.',
    'chat.sources': 'Mga Sanggunian',
    'chat.thinking': 'Nag-iisip…',
    'chat.send': 'Ipadala ang mensahe',

    'upload.title': 'Idagdag sa iyong utak',
    'upload.subtitle': 'Mag-upload ng mga tala, code, email, o dokumento. Matututo si Mindi ng iyong estilo.',
    'upload.drop': 'I-drop ang file dito, o',
    'upload.browse': 'mag-browse',
    'upload.accept': '.txt, .md, .pdf, .json',
    'upload.max': 'max 50MB',
    'upload.reading': 'Binabasa ang file…',
    'upload.scanning': 'Sinusuri ang personal na impormasyon…',
    'upload.building': 'Binubuo ang iyong utak…',
    'upload.done': 'Naidagdag sa iyong utak',
    'upload.pii.title': 'Natuklasan at natanggal ang personal na impormasyon',
    'upload.pii.body': 'Natagpuan at natanggal ni Mindi: {fields}. Hindi kailanman naipadala ang iyong data sa mga AI model.',

    'auth.login.title': 'Maligayang pagbabalik',
    'auth.login.subtitle': 'Naghihintay ang iyong utak',
    'auth.login.email': 'Email',
    'auth.login.password': 'Password',
    'auth.login.submit': 'Mag-sign in',
    'auth.login.google': 'Magpatuloy gamit ang Google',
    'auth.login.signup': 'Gumawa ng isa',
    'auth.signup.title': 'Makilala si Mindi',
    'auth.signup.name': 'Ang iyong pangalan',
    'auth.error.invalid': 'Mali ang mga kredensyal',

    'settings.title': 'Mga Setting',
    'settings.personality': 'Visual na Personalidad',
    'settings.accessibility': 'Accessibility',
    'settings.voice': 'Boses',
    'settings.export': 'I-export ang Utak',
    'settings.privacy': 'Privacy',

    'proactivity.calm.title.stressed': 'Napansin ni Mindi ang ilang tensyon',
    'proactivity.calm.body.stressed': 'Huminga. Magaling ka.',
    'proactivity.calm.title.fatigued': 'Matagal ka nang nagtatrabaho',
    'proactivity.calm.body.fatigued': 'Ang maikling pahinga ay makakatulong sa iyong konsentrasyon.',

    'scenarios.title': 'Gayahin ang Aking Hinaharap',
    'scenarios.subtitle': 'Tuklasin ang isang desisyon sa pamamagitan ng iyong sariling isip.',
    'scenarios.placeholder': 'Anong desisyon ang iyong tinutuklas?',
    'scenarios.simulate': 'Gayahin',
    'scenarios.disclaimer': 'Nakabase sa iyong kaalaman · Hindi hula · Palagi mong pagpipilian',
    'scenarios.tab.story': 'Kwento',
    'scenarios.tab.pros': 'Mga Kalamangan',
    'scenarios.tab.cons': 'Mga Hamon',
    'scenarios.mindi.asks': 'Tanong ni Mindi',

    'common.loading': 'Naglo-load…',
    'common.error.retry': 'May nangyaring mali. Subukan muli.',
    'common.save': 'I-save',
    'common.cancel': 'Kanselahin',
    'common.approve': 'Aprubahan',
    'common.reject': 'Tanggihan',
    'common.preview': 'Preview',
    'common.copied': 'Nakopya!',
    'common.offline': 'Offline ka',
  },
};
