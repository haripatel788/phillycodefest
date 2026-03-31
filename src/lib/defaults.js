export const fallbackChecklist = [
  'This court notice (printed or on your phone)',
  "A valid photo ID (driver's license, state ID, or passport)",
  "Your lawyer's contact info (if you have one)",
  'Anything that proves your address if bail is involved',
  'A pen and paper to take notes',
  'Arrive 30 minutes early - courthouses have security lines',
];

export const fallbackSayThis = [
  'Not guilty, Your Honor.',
  'Yes, Your Honor / No, Your Honor.',
  'I would like to speak with my lawyer.',
  'I understand.',
];

export const fallbackDontSay = [
  'Do not explain your side of the story unless the judge asks.',
  'Do not argue with the judge or court staff.',
  'Do not speak to the prosecutor without your lawyer.',
  'Do not use your phone in the courtroom.',
];

export const fallbackRights = [
  'You have the right to a lawyer, including a public defender if you cannot afford one.',
  'You have the right to remain silent.',
  'You have the right to plead not guilty and ask for a hearing.',
  'You have the right to review evidence shared by the prosecution.',
];

export const legalResources = [
  {
    name: 'Philadelphia Lawyers for Social Equity (PLSE)',
    description: 'Free legal help for people with criminal records',
    website: 'https://plsephilly.org',
    phone: '(215) 701-6519',
  },
  {
    name: 'Community Legal Services (CLS)',
    description: 'Free civil legal help for low-income Philadelphians',
    website: 'https://clsphila.org',
    phone: '(215) 981-3700',
  },
  {
    name: 'Defender Association of Philadelphia',
    description: 'Public defenders for criminal cases',
    website: 'https://phillydefenders.org',
    phone: '',
  },
  {
    name: 'Philadelphia Bar Association Lawyer Referral',
    description: 'Get matched with a lawyer; first 30-min consult is $35',
    website: 'https://philadelphiabar.org',
    phone: '(215) 238-6333',
  },
  {
    name: 'PA Law Help',
    description: 'Self-help legal resources in multiple languages',
    website: 'https://www.palawhelp.org',
    phone: '',
  },
];

export const statusMessages = [
  'Reading your court notice...',
  'Identifying your charges...',
  'Looking up what happens in court...',
  'Preparing your plain-English summary...',
];

export const hearingLabelMap = {
  arraignment: 'Arraignment',
  'preliminary hearing': 'Preliminary hearing',
  trial: 'Trial',
  sentencing: 'Sentencing',
  other: 'Other hearing',
  unknown: 'Unknown hearing type',
};
