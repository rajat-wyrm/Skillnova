// ════════════════════════════════════════════════════════════
//  USER — pages/Roadmap.jsx
//  Interactive Learning Roadmap & Tracker (Frontend Only)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react';
import { 
  Coffee, Globe, Cpu, Terminal, BarChart2, Check, Lock, 
  Clock, ArrowRight, Play, Trophy, Sparkles, BookOpen, Star
} from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, GreenButton } from '../../shared/components/UI';
import notify from '../../lib/toast';

// ── Roadmap Specifications ─────────────────────────────────
const ROADMAPS = {
  java: {
    title: "Java Development",
    icon: Coffee,
    description: "Master Java basics, OOP principles, exception handling, collections, threading, Hibernate ORM, and Spring Boot architecture.",
    level: "Beginner to Advanced",
    topicsCount: 10,
    topics: [
      { id: 'j1', title: 'Java Basics', description: 'Introduction to Java programming language, compiling and running, variables, primitive types, loops, conditionals, and arrays.', level: 'Beginner', estimatedTime: '2 hours', subtopics: ['JDK vs JRE vs JVM', 'Syntax & Basic Data Types', 'Control Statements (if, for, while)', 'Single & Multi-dimensional Arrays'] },
      { id: 'j2', title: 'Object-Oriented Programming', description: 'Learn class design, objects, constructors, and the core pillars of OOP: inheritance, polymorphism, encapsulation, and abstraction.', level: 'Beginner', estimatedTime: '4 hours', subtopics: ['Classes & Object Instances', 'Inheritance & Subclasses', 'Method Overriding & Overloading', 'Encapsulation & Access Modifiers', 'Interfaces & Abstract Classes'] },
      { id: 'j3', title: 'Exception Handling', description: 'Understand robust error handling, try-catch-finally, throws declarations, checked vs unchecked exceptions, and custom exception types.', level: 'Beginner', estimatedTime: '2 hours', subtopics: ['Checked vs Unchecked Exceptions', 'Try-Catch-Finally syntax', 'Throw & Throws declarations', 'Designing Custom Exceptions'] },
      { id: 'j4', title: 'Collections Framework', description: 'Master lists, sets, maps, sorting mechanics with Comparable/Comparator interfaces, and collection operations.', level: 'Intermediate', estimatedTime: '3 hours', subtopics: ['List (ArrayList & LinkedList)', 'Set (HashSet & TreeSet)', 'Map (HashMap & TreeMap)', 'Comparable & Comparator sorting'] },
      { id: 'j5', title: 'Multithreading', description: 'Learn thread lifecycles, synchronization, volatile memory access, lock structures, and concurrency utility thread pools.', level: 'Advanced', estimatedTime: '4 hours', subtopics: ['Thread Class vs Runnable Interface', 'Thread States & Synchronized blocks', 'Volatile variables & ReentrantLocks', 'ExecutorService & Thread Pools'] },
      { id: 'j6', title: 'JDBC', description: 'Establish database connections, compile statements, retrieve ResultSets, and manage transactions.', level: 'Intermediate', estimatedTime: '3 hours', subtopics: ['DriverManager & Connection string', 'Statement vs PreparedStatement', 'Mapping ResultSet rows', 'Transactions & Commit/Rollback'] },
      { id: 'j7', title: 'Hibernate', description: 'Introduction to Object-Relational Mapping (ORM), entity definitions, mappings, session caching, and Hibernate HQL queries.', level: 'Advanced', estimatedTime: '5 hours', subtopics: ['Hibernate Configuration & Entities', 'Primary Keys & Relationship Mappings', 'Sessions & Entity State Lifecycle', 'HQL and Criteria API queries'] },
      { id: 'j8', title: 'Spring Boot', description: 'Dive into Spring Framework basics, dependency injection, autowiring beans, properties mapping, and architecture patterns.', level: 'Advanced', estimatedTime: '6 hours', subtopics: ['Inversion of Control (IoC) & DI', '@Component, @Service, @Repository', '@Autowired & Bean Lifecycle', 'Spring Boot Starter dependencies'] },
      { id: 'j9', title: 'REST APIs', description: 'Build API controllers, mapping endpoints, processing JSON, and returning customized response entities.', level: 'Intermediate', estimatedTime: '4 hours', subtopics: ['@RestController & @RequestMapping', '@GetMapping, @PostMapping, @PutMapping, @DeleteMapping', '@PathVariable & @RequestParam', 'Global Exception Handling with @ControllerAdvice'] },
      { id: 'j10', title: 'Full Stack Java Project', description: 'Build an end-to-end full stack application, integrating Spring Boot endpoints, Hibernate database logic, and a frontend client.', level: 'Advanced', estimatedTime: '10 hours', subtopics: ['Layered System Architecture', 'Database integrations with Spring Data JPA', 'REST API Client communication', 'Security concepts & deployment'] },
    ]
  },
  fullstack: {
    title: "Full Stack Development",
    icon: Globe,
    description: "Learn HTML/CSS, JavaScript logic, React UI components, backend routing with Node/Express, and MongoDB aggregation.",
    level: "Beginner to Advanced",
    topicsCount: 5,
    topics: [
      { id: 'f1', title: 'HTML & CSS', description: 'Learn semantic markup, page styling, and responsive layout designs using Flexbox and Grid.', level: 'Beginner', estimatedTime: '3 hours', subtopics: ['Semantic Tags & SEO', 'CSS Selectors & Cascade', 'Flexbox & CSS Grid Layouts', 'Media Queries & Responsiveness'] },
      { id: 'f2', title: 'JavaScript Basics', description: 'Develop scripting logic, variables, conditionals, functions, arrays, objects, and DOM events.', level: 'Beginner', estimatedTime: '4 hours', subtopics: ['Variables, Loops & Scopes', 'Arrow Functions & Array Methods', 'DOM querying & dynamic classes', 'Async/Await & Fetching APIs'] },
      { id: 'f3', title: 'React Framework', description: 'Create dynamic interfaces using components, hooks, state variables, props flow, and side-effects.', level: 'Intermediate', estimatedTime: '6 hours', subtopics: ['JSX & Virtual DOM reconciliation', 'useState & useEffect hooks', 'Props, events, and data flow', 'Component lifecycle hooks'] },
      { id: 'f4', title: 'Node.js & Express', description: 'Set up servers, declare endpoints, process JSON payloads, and apply middleware configurations.', level: 'Intermediate', estimatedTime: '5 hours', subtopics: ['Event Loop & Node runtime basics', 'Express Routing configurations', 'Middleware execution stack', 'CORS, headers & error handlers'] },
      { id: 'f5', title: 'MongoDB', description: 'Learn NoSQL databases, Mongoose schema modeling, indices, and database queries.', level: 'Intermediate', estimatedTime: '4 hours', subtopics: ['Document vs Relational structures', 'Mongoose schemas & models', 'CRUD & database queries', 'Aggregations & indexes'] }
    ]
  },
  dsa: {
    title: "Data Structures & Algorithms",
    icon: Cpu,
    description: "Master algorithms from hashing and double pointers to trees, shortest path graphs, and dynamic programming.",
    level: "Intermediate to Advanced",
    topicsCount: 5,
    topics: [
      { id: 'd1', title: 'Arrays & Hashing', description: 'Learn memory alignment, HashMaps, HashSets, double pointers, and sliding windows.', level: 'Intermediate', estimatedTime: '3 hours', subtopics: ['Array indexing & memory models', 'HashMap hashing & collisions', 'Two Pointers technique', 'Sliding Window optimizations'] },
      { id: 'd2', title: 'Linked Lists', description: 'Manipulate list elements, redirection pointers, cycle loops, and merging algorithms.', level: 'Intermediate', estimatedTime: '3 hours', subtopics: ['Singly & Doubly Linked List nodes', 'Pointer swap logic', 'Cycle detection algorithms', 'Sorting/merging lists'] },
      { id: 'd3', title: 'Trees & Graphs', description: 'Learn hierarchical nodes, BFS/DFS traversal methods, spanning trees, and shortest paths.', level: 'Advanced', estimatedTime: '6 hours', subtopics: ['Binary Search Trees', 'Breadth-First & Depth-First search', 'Graph representation methods', 'Dijkstra\'s shortest path algorithm'] },
      { id: 'd4', title: 'Sorting & Searching', description: 'Analyze binary search boundaries, pivot partitioning, and runtime complexity metrics.', level: 'Intermediate', estimatedTime: '4 hours', subtopics: ['Binary Search boundaries', 'Quick Sort & Merge Sort pivots', 'Sorting complexities', 'Heap sorting mechanics'] },
      { id: 'd5', title: 'Dynamic Programming', description: 'Store subproblem solutions in arrays using memoization and tabular dynamic loops.', level: 'Advanced', estimatedTime: '8 hours', subtopics: ['Memoization vs Tabulation', '1D DP (Fibonacci & Climbs)', '2D DP (Matrix path finding)', '0/1 Knapsack problem'] }
    ]
  },
  python: {
    title: "Python Development",
    icon: Terminal,
    description: "Learn Python script logic, class parameters, file operations, web scrapers, and Django MVT systems.",
    level: "Beginner to Intermediate",
    topicsCount: 5,
    topics: [
      { id: 'p1', title: 'Python Basics', description: 'Learn basic syntax, control loops, arrays, dictionaries, tuples, and parameters.', level: 'Beginner', estimatedTime: '2 hours', subtopics: ['Syntax indentation model', 'Lists, tuples, sets & dicts', 'For/While loops & if/else', 'Functions & return parameters'] },
      { id: 'p2', title: 'OOP in Python', description: 'Construct reusable pythonic classes, constructors, methods, inheritance, and magic dunders.', level: 'Beginner', estimatedTime: '3 hours', subtopics: ['Classes & instance objects', '__init__ constructor properties', 'Inheritance & super calls', 'Dunder methods (__str__, __len__)'] },
      { id: 'p3', title: 'File Handling & APIs', description: 'Open, read, and write filesystem files, and execute requests over API channels.', level: 'Intermediate', estimatedTime: '3 hours', subtopics: ['Filesystem read/write operations', 'With blocks & Context Managers', 'Requests library & parsing JSON', 'Header configs & status validation'] },
      { id: 'p4', title: 'Web Scraping', description: 'Locate markup nodes using BeautifulSoup elements and dynamic browser drivers.', level: 'Intermediate', estimatedTime: '4 hours', subtopics: ['BeautifulSoup HTML parsing', 'Scraping target CSS selectors', 'Selenium Webdriver execution', 'Pagination scraping loops'] },
      { id: 'p5', title: 'Django Framework', description: 'Build models, map URLs, process template views, and manage database dashboards.', level: 'Advanced', estimatedTime: '8 hours', subtopics: ['Django MVT architecture model', 'ORM model migrations & admin', 'URL routing configurations', 'Template parsing & views'] }
    ]
  },
  datascience: {
    title: "Data Science",
    icon: BarChart2,
    description: "Perform matrix calculations, data cleaning, Seaborn visualization, feature engineering, and training classifiers.",
    level: "Intermediate to Advanced",
    topicsCount: 5,
    topics: [
      { id: 'ds1', title: 'Pandas & NumPy', description: 'Construct matrices, filter columns, clean values, and merge data structures.', level: 'Intermediate', estimatedTime: '4 hours', subtopics: ['NumPy vector operations', 'Pandas Series & DataFrames', 'Cleaning and handling missing data', 'Join & GroupBy operations'] },
      { id: 'ds2', title: 'Data Visualization', description: 'Produce visual representations of charts, plots, scatter charts, and subplots.', level: 'Beginner', estimatedTime: '3 hours', subtopics: ['Matplotlib basic line/bar plots', 'Seaborn statistical layouts', 'Scatter charts & Heatmaps', 'Customizing subplots & legends'] },
      { id: 'ds3', title: 'Data Preprocessing', description: 'Scale values, encode categories, and split datasets into training/testing divisions.', level: 'Intermediate', estimatedTime: '4 hours', subtopics: ['Feature scaling normalizations', 'One-Hot Category encoding', 'Outlier filtering operations', 'Train-Test dataset splits'] },
      { id: 'ds4', title: 'Machine Learning', description: 'Deploy classifiers, predict categories, compile regression equations, and perform clustering.', level: 'Intermediate', estimatedTime: '6 hours', subtopics: ['Linear & Logistic Regression models', 'Decision Trees & Random Forests', 'K-Means clustering loops', 'Evaluation metric validation'] },
      { id: 'ds5', title: 'Deep Learning Intro', description: 'Create multi-layer sequential neural networks, compile activations, and monitor loss metrics.', level: 'Advanced', estimatedTime: '8 hours', subtopics: ['Neural network perceptrons', 'Activation functions (ReLU/Sigmoid)', 'Keras sequential compilation', 'Evaluating loss and accuracy curves'] }
    ]
  }
};

const Roadmap = () => {
  const [activeRoadmapKey, setActiveRoadmapKey] = useState('java');
  const [completedTopicIds, setCompletedTopicIds] = useState({
    java: ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'],
    fullstack: [],
    dsa: [],
    python: [],
    datascience: []
  });
  const [activeTopicId, setActiveTopicId] = useState('j7');
  const topicRefs = useRef({});

  const activeRoadmap = ROADMAPS[activeRoadmapKey];
  const topics = activeRoadmap.topics;
  const completedList = completedTopicIds[activeRoadmapKey] || [];
  
  const completedCount = completedList.length;
  const totalCount = topics.length;
  const progressPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const isFinished = progressPct === 100;

  // Determine current active learning topic
  const currentTopic = topics.find(t => !completedList.includes(t.id)) || topics[topics.length - 1];

  useEffect(() => {
    const list = completedTopicIds[activeRoadmapKey] || [];
    const current = activeRoadmap.topics.find(t => !list.includes(t.id)) || activeRoadmap.topics[activeRoadmap.topics.length - 1];
    if (current) {
      setActiveTopicId(current.id);
    }
  }, [activeRoadmapKey]);

  // Scroll to topic or activate details panel
  const scrollToCurrentTopic = () => {
    if (currentTopic) {
      setActiveTopicId(currentTopic.id);
      const element = topicRefs.current[currentTopic.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const getTopicStatus = (topicId) => {
    if (completedList.includes(topicId)) return 'COMPLETED';
    const firstUncompleted = topics.find(t => !completedList.includes(t.id));
    if (firstUncompleted && firstUncompleted.id === topicId) return 'CURRENT';
    return 'LOCKED';
  };

  const handleMarkAsCompleted = (topicId) => {
    if (completedList.includes(topicId)) return;
    
    // Check if user is completing in order (can only complete if status is CURRENT)
    const status = getTopicStatus(topicId);
    if (status === 'LOCKED') {
      notify.error("Please complete the preceding topics in order!");
      return;
    }

    const updatedList = [...completedList, topicId];
    setCompletedTopicIds(prev => ({
      ...prev,
      [activeRoadmapKey]: updatedList
    }));

    notify.success("Topic completed! Keep pushing forward.");

    // Select the next topic automatically
    const nextTopic = topics.find(t => t.id !== topicId && !completedList.includes(t.id) && t.id !== currentTopic?.id);
    if (nextTopic) {
      setActiveTopicId(nextTopic.id);
    }
  };

  const handleResetRoadmap = () => {
    if (window.confirm("Are you sure you want to reset your progress on this roadmap?")) {
      setCompletedTopicIds(prev => ({
        ...prev,
        [activeRoadmapKey]: []
      }));
      // Reset active topic to the first one
      if (topics[0]) {
        setActiveTopicId(topics[0].id);
      }
      notify.success("Progress reset successfully.");
    }
  };

  const activeTopic = topics.find(t => t.id === activeTopicId) || currentTopic;

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden p-8 flex flex-col md:flex-row items-center justify-between gap-6"
           style={{ background: "linear-gradient(135deg, #2D3436 0%, #1c2122 100%)", border: "1px solid var(--border)" }}>
        <div className="space-y-3 max-w-xl text-center md:text-left">
          <Badge variant="purple">UptoSkills Academy</Badge>
          <h1 className="text-3xl font-black text-white tracking-tight">Your Learning Roadmap</h1>
          <p className="text-sm opacity-80 text-slate-300">
            Follow a structured path, build industry-ready skills, and track your completion progress in real-time.
          </p>
          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2">
            {Object.keys(ROADMAPS).map((key) => {
              const r = ROADMAPS[key];
              const isActive = activeRoadmapKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveRoadmapKey(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'text-white' 
                      : 'text-slate-400 bg-slate-800/40 border border-slate-700 hover:text-white hover:bg-slate-800'
                  }`}
                  style={isActive ? { background: '#ff6d34' } : {}}
                >
                  {r.title}
                </button>
              );
            })}
          </div>
        </div>
        <div className="hidden md:flex w-40 h-40 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          <BookOpen className="text-slate-400 animate-pulse" size={64} style={{ color: '#ff6d34' }} />
        </div>
      </div>

      {/* Completion Banner */}
      {isFinished && (
        <Card className="p-6 border-green-500 bg-emerald-50/10 dark:bg-emerald-950/20 text-center space-y-4 animate-fadeIn">
          <Trophy size={48} className="mx-auto text-yellow-500 animate-bounce" />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Roadmap Completed! 🎉</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Congratulations! You have completed all topic modules under the <strong className="text-emerald-500">{activeRoadmap.title}</strong> learning path.
          </p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => {
                const keys = Object.keys(ROADMAPS);
                const nextIdx = (keys.indexOf(activeRoadmapKey) + 1) % keys.length;
                setActiveRoadmapKey(keys[nextIdx]);
              }} 
              className="text-xs font-semibold px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
              style={{ background: '#00bea3' }}
            >
              Explore Another Roadmap
            </button>
            <button 
              onClick={handleResetRoadmap} 
              className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Reset Progress
            </button>
          </div>
        </Card>
      )}

      {/* Two Column Layout: Roadmap Timeline & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Vertical Roadmap Timeline */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-md font-bold" style={{ color: 'var(--text)' }}>Roadmap Timeline</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Follow this sequence of stages step-by-step</p>
              </div>
              <Badge variant="gray">{activeRoadmap.level}</Badge>
            </div>

            {/* Connecting Vertical Timeline */}
            <div className="relative pl-6 space-y-6">
              {/* Vertical connecting line */}
              <div 
                className="absolute left-[15px] top-2 bottom-2 w-0.5" 
                style={{ background: 'var(--border)' }}
              />

              {topics.map((t, idx) => {
                const status = getTopicStatus(t.id);
                const isSelected = activeTopicId === t.id;
                
                let iconBg = 'var(--bg)';
                let iconColor = 'var(--muted)';
                let borderStyle = '1px solid var(--border)';
                let shadowStyle = 'none';

                if (status === 'COMPLETED') {
                  iconBg = '#00bea320';
                  iconColor = '#00bea3';
                  borderStyle = '1px solid #00bea340';
                } else if (status === 'CURRENT') {
                  iconBg = '#ff6d3420';
                  iconColor = '#ff6d34';
                  borderStyle = '2px solid #ff6d34';
                  shadowStyle = '0 0 12px rgba(255, 109, 52, 0.15)';
                }

                return (
                  <div 
                    key={t.id} 
                    ref={el => topicRefs.current[t.id] = el}
                    onClick={() => setActiveTopicId(t.id)}
                    className={`relative p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected ? 'ring-2 ring-indigo-500/20 scale-[1.01]' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                    }`}
                    style={{ 
                      background: isSelected ? 'var(--bg)' : 'var(--card)', 
                      border: borderStyle,
                      boxShadow: shadowStyle
                    }}
                  >
                    {/* Absolutely Positioned Node Icon */}
                    <div className="absolute left-[-22px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 border shadow-sm transition-colors"
                         style={{ 
                           background: isSelected ? 'var(--card)' : iconBg, 
                           borderColor: isSelected ? '#ff6d34' : 'var(--border)' 
                         }}>
                      {status === 'COMPLETED' ? (
                        <Check size={14} style={{ color: '#00bea3' }} />
                      ) : status === 'CURRENT' ? (
                        <Play size={10} className="ml-0.5 fill-current animate-pulse" style={{ color: '#ff6d34' }} />
                      ) : (
                        <Lock size={12} style={{ color: 'var(--muted)' }} />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tracking-wider uppercase opacity-55">
                            Stage {idx + 1}
                          </span>
                          {status === 'CURRENT' && (
                            <span className="text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse" style={{ background: '#ff6d34' }}>
                              Currently Learning
                            </span>
                          )}
                          {status === 'COMPLETED' && (
                            <span className="text-[9px] font-bold text-emerald-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider" style={{ background: '#00bea315' }}>
                              Completed
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t.title}</h4>
                        <p className="text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>{t.description}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-right">
                        <span className="text-[10px] opacity-70 font-semibold">{t.estimatedTime}</span>
                        <Badge variant={t.level === 'Beginner' ? 'success' : t.level === 'Intermediate' ? 'warning' : 'purple'}>
                          {t.level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Column: Progress Details & Active Topic View */}
        <div className="lg:col-span-5 space-y-6">
          {/* Progress Overview Card */}
          <Card className="p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Overall Progress</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-black" style={{ color: 'var(--text)' }}>{progressPct}%</span>
              <span className="text-xs opacity-60" style={{ color: 'var(--muted)' }}>
                {completedCount} of {totalCount} topics finished
              </span>
            </div>
            
            {/* Custom Progress Bar */}
            <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--border)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPct}%`, background: '#ff6d34' }}
              />
            </div>

            {currentTopic && (
              <div className="p-3.5 rounded-xl border border-dashed mb-4 bg-slate-50/50 dark:bg-slate-800/10 space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <p className="text-[10px] uppercase font-bold opacity-60">Active Objective</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{currentTopic.title}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>Estimated: {currentTopic.estimatedTime}</span>
                  <button 
                    onClick={scrollToCurrentTopic}
                    className="text-[11px] font-bold flex items-center gap-1 hover:opacity-85 transition-opacity"
                    style={{ color: '#ff6d34' }}
                  >
                    Continue Learning <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Detailed Topic view */}
          {activeTopic && (
            <Card className="p-6 space-y-4 border-l-4" style={{ borderLeftColor: '#ff6d34' }}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-55">Topic Details</span>
                  <Badge variant={getTopicStatus(activeTopic.id) === 'COMPLETED' ? 'success' : getTopicStatus(activeTopic.id) === 'CURRENT' ? 'warning' : 'gray'}>
                    {getTopicStatus(activeTopic.id).replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-md font-bold mt-1" style={{ color: 'var(--text)' }}>{activeTopic.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                    ⏱ {activeTopic.estimatedTime}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                    📊 {activeTopic.level} Level
                  </span>
                </div>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                {activeTopic.description}
              </p>

              {activeTopic.subtopics && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Key Concepts to Cover:</p>
                  <ul className="space-y-1.5">
                    {activeTopic.subtopics.map((sub, i) => (
                      <li key={i} className="text-xs flex items-center gap-2" style={{ color: 'var(--muted)' }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff6d34' }} />
                        {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                {getTopicStatus(activeTopic.id) === 'COMPLETED' ? (
                  <GreenButton className="w-full flex justify-center text-xs opacity-75 cursor-not-allowed">
                    ✓ Completed Module
                  </GreenButton>
                ) : getTopicStatus(activeTopic.id) === 'CURRENT' ? (
                  <>
                    <PrimaryButton 
                      onClick={() => handleMarkAsCompleted(activeTopic.id)}
                      className="flex-1 flex justify-center text-xs font-bold"
                    >
                      Mark as Completed
                    </PrimaryButton>
                  </>
                ) : (
                  <button 
                    disabled 
                    className="w-full text-xs font-semibold py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-600 flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <Lock size={12} /> Complete preceding steps to unlock
                  </button>
                )}
              </div>
            </Card>
          )}

          {/* Continue Where You Left Off Card */}
          {currentTopic && (
            <Card className="p-5 bg-gradient-to-r from-orange-500/5 to-teal-500/5 hover:scale-[1.01] transition-transform duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: 'rgba(255, 109, 52, 0.08)' }}>
                  <Sparkles size={20} style={{ color: '#ff6d34' }} />
                </div>
                <div className="space-y-2 min-w-0 flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#ff6d34' }}>
                    Continue where you left off
                  </h4>
                  <div>
                    <h5 className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>
                      {currentTopic.title}
                    </h5>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Complete this next milestone to unlock upcoming concepts.
                    </p>
                  </div>
                  <button
                    onClick={scrollToCurrentTopic}
                    className="text-xs font-bold flex items-center gap-1 py-1 rounded transition-colors"
                    style={{ color: '#00bea3' }}
                  >
                    Open Topic <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Explore Other Roadmaps Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-bold" style={{ color: 'var(--text)' }}>Explore Other Roadmaps</h3>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Switch to a different learning path at any time to build new skill sets</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(ROADMAPS).map((key) => {
            const r = ROADMAPS[key];
            const IconComponent = r.icon;
            const completed = completedTopicIds[key] || [];
            const topicsCount = r.topics.length;
            const donePct = topicsCount ? Math.round((completed.length / topicsCount) * 100) : 0;
            const isActive = activeRoadmapKey === key;

            return (
              <Card 
                key={key} 
                hover
                onClick={() => setActiveRoadmapKey(key)}
                className={`p-5 flex flex-col justify-between transition-all duration-300 ${
                  isActive ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''
                }`}
                style={{ 
                  background: isActive ? 'var(--bg)' : 'var(--card)'
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-xl" style={{ background: isActive ? '#ff6d3420' : 'var(--bg)' }}>
                      <IconComponent size={20} style={{ color: isActive ? '#ff6d34' : 'var(--muted)' }} />
                    </div>
                    {donePct === 100 ? (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#00bea3' }}>
                        Finished 🎉
                      </span>
                    ) : donePct > 0 ? (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full" style={{ background: '#ff6d34' }}>
                        {donePct}% done
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                        Not Started
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{r.title}</h4>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>
                    {r.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>{topicsCount} Topics</span>
                  <span className="font-bold flex items-center gap-0.5" style={{ color: '#00bea3' }}>
                    View Path <ArrowRight size={12} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
