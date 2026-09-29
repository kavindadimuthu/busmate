// The dev seed's accounts (docs/dev-seed-credentials.md). Dev-only, non-deliverable @busmate.test addresses.
export interface Account {
  email: string;
  password: string;
  name: string;
}

export const ACCOUNTS = {
  mot: { email: 'mot@busmate.test', password: 'Mot@2026', name: 'Chaminda Wickramasinghe' },
  // ordinary passengers, who have never applied
  dilani: { email: 'passenger.dilani@busmate.test', password: 'Passenger1@2026', name: 'Dilani Perera' },
  ishara: { email: 'passenger.ishara@busmate.test', password: 'Passenger3@2026', name: 'Ishara Gunawardena' },
  // community: an active contributor, one for another corridor, a steward for Colombo-Kandy, an applicant
  amara: { email: 'contributor.amara@busmate.test', password: 'Contributor1@2026', name: 'Amara Jayawardena' },
  chamara: { email: 'contributor.chamara@busmate.test', password: 'Contributor2@2026', name: 'Chamara Herath' },
  tharindu: { email: 'steward.tharindu@busmate.test', password: 'Steward1@2026', name: 'Tharindu Ekanayake' },
  nadeesha: { email: 'applicant.nadeesha@busmate.test', password: 'Applicant1@2026', name: 'Nadeesha Rajapaksa' },
} satisfies Record<string, Account>;
