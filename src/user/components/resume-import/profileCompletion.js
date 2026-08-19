// ════════════════════════════════════════════════════════════
//  Resume Import — profile completion helper
//  There was no existing "profile completion %" logic in the
//  project, so this is a single source of truth introduced by
//  this feature. If other parts of the app need the same number
//  later, import from here instead of recalculating it.
// ════════════════════════════════════════════════════════════

// Weight the fields that matter for a "complete" profile.
// Kept in one place so the weights are easy to tune later.
const WEIGHTS = {
  name: 10,
  department: 10,
  college: 10,
  yearOfStudy: 10,
  linkedinUrl: 5,
  skills: 20,
  education: 20,
  experience: 15,
};

const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

function hasText(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * profile: { name, department, college, yearOfStudy, linkedinUrl, skills, education, experience }
 * - skills: comma-separated string (matches the User.skills column)
 * - education / experience: arrays (parsed from educationJson / experienceJson)
 */
export function calculateProfileCompletion(profile = {}) {
  let earned = 0;

  if (hasText(profile.name)) earned += WEIGHTS.name;
  if (hasText(profile.department)) earned += WEIGHTS.department;
  if (hasText(profile.college)) earned += WEIGHTS.college;
  if (hasText(profile.yearOfStudy)) earned += WEIGHTS.yearOfStudy;
  if (hasText(profile.linkedinUrl)) earned += WEIGHTS.linkedinUrl;
  if (hasText(profile.skills)) earned += WEIGHTS.skills;
  if (Array.isArray(profile.education) && profile.education.length > 0) earned += WEIGHTS.education;
  if (Array.isArray(profile.experience) && profile.experience.length > 0) earned += WEIGHTS.experience;

  return Math.round((earned / TOTAL_WEIGHT) * 100);
}

export default { calculateProfileCompletion };
