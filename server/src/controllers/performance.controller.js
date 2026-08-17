import { getInternPerformance } from '../services/performance.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get performance status for the currently authenticated intern.
 * Safe fallback, uses existing internally calculated data.
 */
export const status = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // The service uses existing metrics (Attendance, Tasks, Reports)
  // to calculate an overall status of GOOD, AVERAGE, NEEDS_IMPROVEMENT, or UNKNOWN.
  const performanceData = await getInternPerformance(userId);

  if (!performanceData) {
    throw new ApiError(500, 'Unable to calculate performance status');
  }

  res.status(200).json(performanceData);
});
