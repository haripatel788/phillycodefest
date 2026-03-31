export const mockAnalysis = {
  extracted: {
    court_date: 'Thursday, April 17, 2025',
    court_time: '9:00 AM',
    courtroom_address: 'Room 304, Criminal Justice Center, 1301 Filbert St, Philadelphia',
    judge_name: 'Not listed in notice',
    charges: ['Retail theft (misdemeanor 2nd degree)'],
    case_number: 'MC-51-CR-0012345-2025',
    hearing_type: 'arraignment',
  },
  charge_explanations: [
    {
      charge: 'Retail theft (misdemeanor 2nd degree)',
      plain_english:
        'This means you are accused of taking store items without paying. It is a criminal charge, but not the highest level offense.',
      max_penalty: 'Possible penalties can include a fine, probation, or jail time based on the facts and history.',
      severity: 'misdemeanor',
    },
  ],
  what_will_happen: [
    'You wait in the courtroom until your name is called.',
    'The judge reviews your charge and basic case details.',
    'The court discusses release conditions or next dates.',
    'You will likely get instructions for the next step in your case.',
  ],
  what_to_bring: ['Court notice', 'Photo ID', 'Lawyer contact information', 'Notebook and pen'],
  say_this: ['Yes, Your Honor.', 'No, Your Honor.', 'I would like to speak with my lawyer.'],
  dont_say_this: [
    'Do not explain your full story unless asked by the judge.',
    'Do not argue with court staff.',
    'Do not discuss details with the prosecutor without your lawyer.',
  ],
  key_rights: [
    'You have the right to a lawyer, including a public defender if needed.',
    'You have the right to remain silent.',
    'You have the right to plead not guilty.',
  ],
  tone_note: 'Take your time, listen carefully, and ask the court to repeat anything you do not understand.',
};
