export const ROLE_LABELS = {
  SUPER_ADMIN: 'Senior Team Leader',
  ADMIN: 'Team Leader',
  MENTOR: 'Captain',
  INTERN: 'Intern',
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;