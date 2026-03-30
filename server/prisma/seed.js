import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })
  console.log('✅ Admin user created (username: admin, password: admin123)')

  // Create sample departments
  const engineeringDept = await prisma.department.create({
    data: { name: 'Engineering' }
  })
  
  const devopsDept = await prisma.department.create({
    data: { name: 'DevOps' }
  })
  
  const qaDept = await prisma.department.create({
    data: { name: 'Quality Assurance' }
  })

  console.log('✅ Created 3 departments')

  // Create sample positions
  const positions = [
    // Engineering positions
    { name: 'Junior Developer', departmentId: engineeringDept.id },
    { name: 'Senior Developer', departmentId: engineeringDept.id },
    { name: 'Tech Lead', departmentId: engineeringDept.id },
    { name: 'Frontend Developer', departmentId: engineeringDept.id },
    { name: 'Backend Developer', departmentId: engineeringDept.id },
    { name: 'Full Stack Developer', departmentId: engineeringDept.id },
    // DevOps positions
    { name: 'DevOps Engineer', departmentId: devopsDept.id },
    { name: 'SRE', departmentId: devopsDept.id },
    { name: 'Cloud Architect', departmentId: devopsDept.id },
    // QA positions
    { name: 'QA Engineer', departmentId: qaDept.id },
    { name: 'QA Lead', departmentId: qaDept.id },
  ]

  for (const pos of positions) {
    await prisma.position.create({ data: pos })
  }

  console.log(`✅ Created ${positions.length} positions`)

  // Create sample questions
  const questions = [
    // Linux questions
    {
      questionText: 'What command is used to list all files in a directory including hidden files?',
      type: 'MULTIPLE_CHOICE',
      category: 'Linux',
      difficulty: 'EASY',
      choices: [
        { choiceText: 'ls -a', isCorrect: true },
        { choiceText: 'ls -l', isCorrect: false },
        { choiceText: 'list all', isCorrect: false },
        { choiceText: 'dir -hidden', isCorrect: false },
      ],
    },
    {
      questionText: 'Which command is used to change file permissions in Linux?',
      type: 'MULTIPLE_CHOICE',
      category: 'Linux',
      difficulty: 'EASY',
      choices: [
        { choiceText: 'chmod', isCorrect: true },
        { choiceText: 'chown', isCorrect: false },
        { choiceText: 'perm', isCorrect: false },
        { choiceText: 'access', isCorrect: false },
      ],
    },
    {
      questionText: 'What does the command "ps aux" do?',
      type: 'MULTIPLE_CHOICE',
      category: 'Linux',
      difficulty: 'MEDIUM',
      choices: [
        { choiceText: 'Displays all running processes', isCorrect: true },
        { choiceText: 'Shows disk usage', isCorrect: false },
        { choiceText: 'Lists installed packages', isCorrect: false },
        { choiceText: 'Shows network connections', isCorrect: false },
      ],
    },
    // DevOps questions
    {
      questionText: 'What is the purpose of Docker?',
      type: 'MULTIPLE_CHOICE',
      category: 'DevOps',
      difficulty: 'EASY',
      choices: [
        { choiceText: 'Containerization of applications', isCorrect: true },
        { choiceText: 'Database management', isCorrect: false },
        { choiceText: 'Network monitoring', isCorrect: false },
        { choiceText: 'Code compilation', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the difference between CI and CD?',
      type: 'SHORT_ANSWER',
      category: 'DevOps',
      difficulty: 'MEDIUM',
    },
    {
      questionText: 'In Kubernetes, what is a Pod?',
      type: 'MULTIPLE_CHOICE',
      category: 'DevOps',
      difficulty: 'MEDIUM',
      choices: [
        { choiceText: 'The smallest deployable unit that can contain one or more containers', isCorrect: true },
        { choiceText: 'A networking component', isCorrect: false },
        { choiceText: 'A storage volume', isCorrect: false },
        { choiceText: 'A load balancer', isCorrect: false },
      ],
    },
    // Networking questions
    {
      questionText: 'What is the default port for HTTP?',
      type: 'MULTIPLE_CHOICE',
      category: 'Networking',
      difficulty: 'EASY',
      choices: [
        { choiceText: '80', isCorrect: true },
        { choiceText: '443', isCorrect: false },
        { choiceText: '8080', isCorrect: false },
        { choiceText: '22', isCorrect: false },
      ],
    },
    {
      questionText: 'What does DNS stand for and what is its function?',
      type: 'SHORT_ANSWER',
      category: 'Networking',
      difficulty: 'EASY',
    },
    {
      questionText: 'What is the difference between TCP and UDP?',
      type: 'SHORT_ANSWER',
      category: 'Networking',
      difficulty: 'MEDIUM',
    },
    // Programming questions
    {
      questionText: 'What is the time complexity of binary search?',
      type: 'MULTIPLE_CHOICE',
      category: 'Programming',
      difficulty: 'MEDIUM',
      choices: [
        { choiceText: 'O(log n)', isCorrect: true },
        { choiceText: 'O(n)', isCorrect: false },
        { choiceText: 'O(n log n)', isCorrect: false },
        { choiceText: 'O(1)', isCorrect: false },
      ],
    },
    // Code question
    {
      questionText: 'Write a function that reverses a string in Python.',
      type: 'CODE',
      category: 'Programming',
      difficulty: 'EASY',
      codeSnippet: '# Write your solution here\ndef reverse_string(s):\n    pass',
    },
    // Database questions
    {
      questionText: 'What does SQL stand for?',
      type: 'MULTIPLE_CHOICE',
      category: 'Database',
      difficulty: 'EASY',
      choices: [
        { choiceText: 'Structured Query Language', isCorrect: true },
        { choiceText: 'Simple Query Language', isCorrect: false },
        { choiceText: 'Standard Query Language', isCorrect: false },
        { choiceText: 'System Query Language', isCorrect: false },
      ],
    },
    {
      questionText: 'What is the difference between INNER JOIN and LEFT JOIN?',
      type: 'SHORT_ANSWER',
      category: 'Database',
      difficulty: 'MEDIUM',
    },
    // System Design
    {
      questionText: 'What is horizontal scaling?',
      type: 'MULTIPLE_CHOICE',
      category: 'System Design',
      difficulty: 'MEDIUM',
      choices: [
        { choiceText: 'Adding more machines to distribute load', isCorrect: true },
        { choiceText: 'Upgrading hardware of existing machines', isCorrect: false },
        { choiceText: 'Optimizing code efficiency', isCorrect: false },
        { choiceText: 'Using caching mechanisms', isCorrect: false },
      ],
    },
    {
      questionText: 'Explain the CAP theorem in distributed systems.',
      type: 'SHORT_ANSWER',
      category: 'System Design',
      difficulty: 'HARD',
    },
  ]

  for (const q of questions) {
    const { choices, ...questionData } = q
    
    await prisma.question.create({
      data: {
        ...questionData,
        choices: choices ? {
          create: choices
        } : undefined
      }
    })
  }

  console.log(`✅ Created ${questions.length} sample questions`)

  // Create sample quizzes
  const quizzes = [
    {
      name: 'Linux Basics',
      description: 'Fundamental Linux commands and concepts',
      category: 'Linux',
      questionCount: 5
    },
    {
      name: 'Networking Fundamentals',
      description: 'Basic networking concepts and protocols',
      category: 'Networking',
      questionCount: 5
    },
    {
      name: 'DevOps Essentials',
      description: 'Docker, Kubernetes, and CI/CD basics',
      category: 'DevOps',
      questionCount: 5
    },
    {
      name: 'Programming Concepts',
      description: 'JavaScript, algorithms, and data structures',
      category: 'Programming',
      questionCount: 5
    },
    {
      name: 'Database Basics',
      description: 'SQL and database fundamentals',
      category: 'Database',
      questionCount: 5
    },
    {
      name: 'System Design',
      description: 'Scalability and distributed systems',
      category: 'System Design',
      questionCount: 5
    }
  ]

  for (const quiz of quizzes) {
    await prisma.quiz.create({
      data: quiz
    })
  }

  console.log(`✅ Created ${quizzes.length} sample quizzes`)

  // Create sample sessions
  const technicalSession = await prisma.session.create({
    data: {
      name: 'Technical Interview',
      description: 'Comprehensive technical assessment',
      timeLimit: 90,
      quizzes: {
        create: [
          { quizId: 1, order: 1 }, // Linux Basics
          { quizId: 3, order: 2 }, // DevOps Essentials
          { quizId: 4, order: 3 }, // Programming Concepts
        ]
      }
    }
  })

  const networkingSession = await prisma.session.create({
    data: {
      name: 'Infrastructure Assessment',
      description: 'Networking and system administration',
      timeLimit: 60,
      quizzes: {
        create: [
          { quizId: 2, order: 1 }, // Networking Fundamentals
          { quizId: 1, order: 2 }, // Linux Basics
        ]
      }
    }
  })

  const fullStackSession = await prisma.session.create({
    data: {
      name: 'Full Stack Assessment',
      description: 'Full stack developer evaluation',
      timeLimit: 120,
      quizzes: {
        create: [
          { quizId: 4, order: 1 }, // Programming Concepts
          { quizId: 5, order: 2 }, // Database Basics
          { quizId: 6, order: 3 }, // System Design
        ]
      }
    }
  })

  console.log('✅ Created 3 sample sessions:')
  console.log('   - Technical Interview')
  console.log('   - Infrastructure Assessment')
  console.log('   - Full Stack Assessment')

  // Create a sample candidate with sessions assigned
  const seniorDevPosition = await prisma.position.findFirst({
    where: { name: 'Senior Developer' }
  })

  const sampleCandidate = await prisma.candidate.create({
    data: {
      name: 'John Doe',
      phoneNumber: '+1-555-0123',
      email: 'john.doe@example.com',
      departmentId: engineeringDept.id,
      positionId: seniorDevPosition.id,
      notes: 'Strong background in full-stack development',
      sessions: {
        create: [
          {
            sessionId: technicalSession.id,
            timeRemaining: technicalSession.timeLimit * 60
          }
        ]
      }
    }
  })

  console.log(`✅ Created sample candidate: ${sampleCandidate.name}`)
  console.log('✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })