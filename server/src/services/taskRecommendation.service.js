const TASK_TEMPLATES = [
  {
    title: 'Write unit tests for the existing module',
    description:
      'Create unit tests for one of the modules already completed in the project and cover the main success and failure cases.',
    keywords: ['testing', 'test', 'jest', 'vitest', 'qa'],
    reason: 'Testing has not been demonstrated yet and this builds on work already completed.',
    difficulty: 'Medium',
    estimatedTime: '3–4 hours',
  },
  {
    title: 'Document the project APIs',
    description:
      'Create clear documentation for the APIs currently implemented in the project, including endpoints, request data, and responses.',
    keywords: ['api', 'backend', 'node', 'express', 'rest', 'documentation'],
    reason: 'The project already has backend work that can now be documented clearly.',
    difficulty: 'Easy',
    estimatedTime: '2–3 hours',
  },
  {
    title: 'Add input validation to an existing feature',
    description:
      'Review an existing form or API and add validation for invalid, missing, and unexpected input.',
    keywords: ['validation', 'security', 'backend', 'frontend', 'api'],
    reason: 'Validation is a practical next step after implementing a working feature.',
    difficulty: 'Medium',
    estimatedTime: '2–3 hours',
  },
  {
    title: 'Improve error handling in an existing feature',
    description:
      'Review one existing feature and handle common failure cases with useful user-facing or API error messages.',
    keywords: ['error', 'backend', 'frontend', 'api', 'node', 'react'],
    reason: 'The intern can strengthen an existing feature instead of starting from scratch.',
    difficulty: 'Medium',
    estimatedTime: '2–3 hours',
  },
  {
    title: 'Create a responsive UI for an existing feature',
    description:
      'Review an existing page and improve its layout for mobile, tablet, and desktop screen sizes.',
    keywords: ['react', 'frontend', 'ui', 'css', 'html', 'responsive'],
    reason: 'This strengthens frontend implementation and usability skills.',
    difficulty: 'Medium',
    estimatedTime: '3–4 hours',
  },
  {
    title: 'Optimize an existing database query',
    description:
      'Identify one frequently used database query and improve its efficiency, filtering, or selected fields.',
    keywords: ['database', 'sql', 'postgresql', 'prisma', 'mongodb', 'optimization'],
    reason: 'Database work can be extended into performance and optimization.',
    difficulty: 'Medium',
    estimatedTime: '2–3 hours',
  },
  {
    title: 'Add a feature to the existing project',
    description:
      'Identify a small missing feature in the current project and implement it end-to-end.',
    keywords: ['feature', 'react', 'node', 'backend', 'frontend'],
    reason: 'The intern is ready to extend the existing project rather than only maintaining it.',
    difficulty: 'Medium',
    estimatedTime: '4–5 hours',
  },
  {
    title: 'Create technical documentation for the project',
    description:
      "Document the project's setup process, architecture, major modules, and how the main features work.",
    keywords: ['documentation', 'architecture', 'project', 'technical'],
    reason: 'Good documentation helps turn completed development work into a maintainable project.',
    difficulty: 'Easy',
    estimatedTime: '2–3 hours',
  },
  {
    title: 'Add logging and monitoring to an existing feature',
    description:
      'Add useful logs around an existing backend feature so important actions and failures can be tracked.',
    keywords: ['logging', 'monitoring', 'backend', 'node', 'api'],
    reason: 'This introduces an important production-oriented engineering practice.',
    difficulty: 'Medium',
    estimatedTime: '2–3 hours',
  },
  {
    title: 'Deploy an existing project feature',
    description:
      'Prepare one completed project feature for deployment and verify that it works correctly in the deployed environment.',
    keywords: ['deployment', 'docker', 'devops', 'cloud', 'production'],
    reason: 'The intern can move from development toward real-world deployment.',
    difficulty: 'Medium',
    estimatedTime: '3–5 hours',
  },
];

const normalize = (value = '') =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const getTokens = (values) => {
  const tokens = new Set();

  values.forEach((value) => {
    normalize(value).forEach((token) => tokens.add(token));
  });

  return tokens;
};

const scoreTemplate = (template, context) => {
  const templateKeywords = new Set(template.keywords);
  let score = 0;
  const reasons = [];

  const internTokens = getTokens([
    context.skills,
    context.projectName,
    context.projectDescription,
  ]);

  const completedTokens = getTokens(
    context.completedTasks.map((task) => `${task.title} ${task.description || ''}`)
  );

  const allExistingTokens = getTokens(
    context.allTasks.map((task) => `${task.title} ${task.description || ''}`)
  );

  // Match the recommendation to the intern's current project/skills.
  for (const keyword of templateKeywords) {
    if (internTokens.has(keyword)) {
      score += 15;
    }
  }

  // Prefer tasks that build on work the intern has already completed.
  for (const keyword of templateKeywords) {
    if (completedTokens.has(keyword)) {
      score += 20;
    }
  }

  // Avoid recommending something that is already represented in their tasks.
  const alreadyCovered = [...templateKeywords].some((keyword) =>
    allExistingTokens.has(keyword)
  );

  if (alreadyCovered) {
    score -= 25;
  }

  // Prefer recommendations when the intern has completed some work.
  if (context.completedTasks.length > 0) {
    score += 10;
    reasons.push('Builds on work the intern has already completed.');
  }

  if (context.completedTasks.length >= 3) {
    score += 10;
  }

  return {
    ...template,
    score,
    reasons,
  };
};

export const getTaskRecommendations = async (prisma, internId) => {
  const intern = await prisma.user.findUnique({
    where: {
      id: internId,
    },
    select: {
      id: true,
      name: true,
      role: true,
      skills: true,
      internProfile: {
        select: {
          projectId: true,
          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
            },
          },
        },
      },
      projectTasks: {
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          completedAt: true,
        },
      },
    },
  });

  if (!intern) {
    return null;
  }

  if (intern.role !== 'INTERN') {
    return {
      error: 'The selected user is not an intern.',
    };
  }

  const completedTasks = intern.projectTasks.filter(
    (task) => task.status === 'DONE'
  );

  const context = {
    skills: intern.skills || '',
    projectName: intern.internProfile?.project?.name || '',
    projectDescription: intern.internProfile?.project?.description || '',
    completedTasks,
    allTasks: intern.projectTasks,
  };

  const recommendations = TASK_TEMPLATES
    .map((template) => scoreTemplate(template, context))
    .sort((a, b) => b.score - a.score);

  const best = recommendations[0];

  return {
    intern: {
      id: intern.id,
      name: intern.name,
    },
    project: intern.internProfile?.project || null,
    recommendation: {
      title: best.title,
      description: best.description,
      difficulty: best.difficulty,
      estimatedTime: best.estimatedTime,
      reason:
        best.reasons[0] ||
        'This task is a good fit for the intern’s current project stage.',
    },
    alternatives: recommendations.slice(1, 4).map((item) => ({
      title: item.title,
      description: item.description,
      difficulty: item.difficulty,
      estimatedTime: item.estimatedTime,
      reason: item.reason,
    })),
    context: {
      completedTasks: completedTasks.length,
      totalTasks: intern.projectTasks.length,
      skills: intern.skills
        ? intern.skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean)
        : [],
    },
  };
};