const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Make seeding idempotent by clearing existing data (development only)
    await prisma.$transaction([
      prisma.vote.deleteMany(),
      prisma.pollOption.deleteMany(),
      prisma.poll.deleteMany(),
      prisma.user.deleteMany()
    ]);

    // Create sample users
    const passwordHash = await bcrypt.hash('password123', 12);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          passwordHash: passwordHash
        }
      }),
      prisma.user.create({
        data: {
          name: 'Bob Smith',
          email: 'bob@example.com', 
          passwordHash: passwordHash
        }
      }),
      prisma.user.create({
        data: {
          name: 'Carol Davis',
          email: 'carol@example.com',
          passwordHash: passwordHash
        }
      }),
      prisma.user.create({
        data: {
          name: 'David Wilson',
          email: 'david@example.com',
          passwordHash: passwordHash
        }
      }),
      prisma.user.create({
        data: {
          name: 'Emma Brown',
          email: 'emma@example.com',
          passwordHash: passwordHash
        }
      }),
      prisma.user.create({
        data: {
          name: 'Frank Miller',
          email: 'frank@example.com',
          passwordHash: passwordHash
        }
      })
    ]);

    console.log('✅ Created sample users');

    // Create sample polls with more variety
    const polls = await Promise.all([
      prisma.poll.create({
        data: {
          question: 'What is your favorite programming language?',
          isPublished: true,
          creatorId: users[0].id,
          options: {
            create: [
              { text: 'JavaScript' },
              { text: 'Python' },
              { text: 'Java' },
              { text: 'Go' },
              { text: 'Rust' },
              { text: 'TypeScript' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'Which frontend framework do you prefer?',
          isPublished: true,
          creatorId: users[1].id,
          options: {
            create: [
              { text: 'React' },
              { text: 'Vue.js' },
              { text: 'Angular' },
              { text: 'Svelte' },
              { text: 'Next.js' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'What is your preferred database?',
          isPublished: true,
          creatorId: users[2].id,
          options: {
            create: [
              { text: 'PostgreSQL' },
              { text: 'MySQL' },
              { text: 'MongoDB' },
              { text: 'Redis' },
              { text: 'SQLite' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'Which cloud provider do you use most?',
          isPublished: true,
          creatorId: users[3].id,
          options: {
            create: [
              { text: 'AWS' },
              { text: 'Google Cloud' },
              { text: 'Azure' },
              { text: 'DigitalOcean' },
              { text: 'Vercel' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'What is your preferred development environment?',
          isPublished: true,
          creatorId: users[4].id,
          options: {
            create: [
              { text: 'VS Code' },
              { text: 'IntelliJ IDEA' },
              { text: 'Vim/Neovim' },
              { text: 'Sublime Text' },
              { text: 'Atom' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'Which mobile development approach do you prefer?',
          isPublished: true,
          creatorId: users[5].id,
          options: {
            create: [
              { text: 'React Native' },
              { text: 'Flutter' },
              { text: 'Native iOS' },
              { text: 'Native Android' },
              { text: 'Ionic' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'What is your favorite testing framework?',
          isPublished: true,
          creatorId: users[0].id,
          options: {
            create: [
              { text: 'Jest' },
              { text: 'Mocha' },
              { text: 'Cypress' },
              { text: 'Playwright' },
              { text: 'Vitest' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'Which containerization tool do you use?',
          isPublished: true,
          creatorId: users[1].id,
          options: {
            create: [
              { text: 'Docker' },
              { text: 'Podman' },
              { text: 'Kubernetes' },
              { text: 'Docker Compose' },
              { text: 'None' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'What is your preferred API design style?',
          isPublished: true,
          creatorId: users[2].id,
          options: {
            create: [
              { text: 'REST' },
              { text: 'GraphQL' },
              { text: 'gRPC' },
              { text: 'WebSocket' },
              { text: 'Server-Sent Events' }
            ]
          }
        },
        include: { options: true }
      }),
      prisma.poll.create({
        data: {
          question: 'Which team meeting time works best for you?',
          isPublished: false, // Draft poll
          creatorId: users[3].id,
          options: {
            create: [
              { text: 'Morning (9 AM - 11 AM)' },
              { text: 'Afternoon (1 PM - 3 PM)' },
              { text: 'Late afternoon (3 PM - 5 PM)' },
              { text: 'Evening (5 PM - 7 PM)' }
            ]
          }
        },
        include: { options: true }
      })
    ]);

    console.log('✅ Created sample polls');

    // Create realistic vote distribution
    const votes = [];
    
    // Poll 1: Programming Languages (most popular)
    votes.push(
      { userId: users[1].id, pollOptionId: polls[0].options[0].id }, // JavaScript
      { userId: users[2].id, pollOptionId: polls[0].options[1].id }, // Python
      { userId: users[3].id, pollOptionId: polls[0].options[0].id }, // JavaScript
      { userId: users[4].id, pollOptionId: polls[0].options[5].id }, // TypeScript
      { userId: users[5].id, pollOptionId: polls[0].options[1].id }, // Python
    );

    // Poll 2: Frontend Frameworks
    votes.push(
      { userId: users[0].id, pollOptionId: polls[1].options[0].id }, // React
      { userId: users[2].id, pollOptionId: polls[1].options[0].id }, // React
      { userId: users[3].id, pollOptionId: polls[1].options[1].id }, // Vue.js
      { userId: users[4].id, pollOptionId: polls[1].options[4].id }, // Next.js
    );

    // Poll 3: Databases
    votes.push(
      { userId: users[0].id, pollOptionId: polls[2].options[0].id }, // PostgreSQL
      { userId: users[1].id, pollOptionId: polls[2].options[0].id }, // PostgreSQL
      { userId: users[3].id, pollOptionId: polls[2].options[2].id }, // MongoDB
      { userId: users[4].id, pollOptionId: polls[2].options[1].id }, // MySQL
      { userId: users[5].id, pollOptionId: polls[2].options[0].id }, // PostgreSQL
    );

    // Poll 4: Cloud Providers
    votes.push(
      { userId: users[0].id, pollOptionId: polls[3].options[0].id }, // AWS
      { userId: users[1].id, pollOptionId: polls[3].options[1].id }, // Google Cloud
      { userId: users[2].id, pollOptionId: polls[3].options[0].id }, // AWS
      { userId: users[4].id, pollOptionId: polls[3].options[4].id }, // Vercel
    );

    // Poll 5: Development Environment
    votes.push(
      { userId: users[0].id, pollOptionId: polls[4].options[0].id }, // VS Code
      { userId: users[1].id, pollOptionId: polls[4].options[0].id }, // VS Code
      { userId: users[2].id, pollOptionId: polls[4].options[2].id }, // Vim
      { userId: users[3].id, pollOptionId: polls[4].options[1].id }, // IntelliJ
      { userId: users[5].id, pollOptionId: polls[4].options[0].id }, // VS Code
    );

    // Poll 6: Mobile Development
    votes.push(
      { userId: users[0].id, pollOptionId: polls[5].options[0].id }, // React Native
      { userId: users[1].id, pollOptionId: polls[5].options[1].id }, // Flutter
      { userId: users[2].id, pollOptionId: polls[5].options[0].id }, // React Native
    );

    // Poll 7: Testing Frameworks
    votes.push(
      { userId: users[1].id, pollOptionId: polls[6].options[0].id }, // Jest
      { userId: users[2].id, pollOptionId: polls[6].options[0].id }, // Jest
      { userId: users[3].id, pollOptionId: polls[6].options[2].id }, // Cypress
      { userId: users[4].id, pollOptionId: polls[6].options[3].id }, // Playwright
    );

    // Poll 8: Containerization
    votes.push(
      { userId: users[0].id, pollOptionId: polls[7].options[0].id }, // Docker
      { userId: users[1].id, pollOptionId: polls[7].options[0].id }, // Docker
      { userId: users[2].id, pollOptionId: polls[7].options[2].id }, // Kubernetes
      { userId: users[3].id, pollOptionId: polls[7].options[3].id }, // Docker Compose
      { userId: users[4].id, pollOptionId: polls[7].options[0].id }, // Docker
    );

    // Poll 9: API Design
    votes.push(
      { userId: users[0].id, pollOptionId: polls[8].options[0].id }, // REST
      { userId: users[1].id, pollOptionId: polls[8].options[1].id }, // GraphQL
      { userId: users[2].id, pollOptionId: polls[8].options[0].id }, // REST
      { userId: users[4].id, pollOptionId: polls[8].options[1].id }, // GraphQL
      { userId: users[5].id, pollOptionId: polls[8].options[0].id }, // REST
    );

    // Create all votes
    await prisma.vote.createMany({
      data: votes
    });

    console.log('✅ Created sample votes');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: ${users.length}`);
    console.log(`📝 Polls created: ${polls.length} (${polls.filter(p => p.isPublished).length} published, ${polls.filter(p => !p.isPublished).length} draft)`);
    console.log(`🗳️  Votes created: ${votes.length}`);
    console.log('\n👤 Sample users (password: password123):');
    users.forEach(user => console.log(`  - ${user.email}`));
    console.log('\n📋 Sample polls:');
    polls.forEach((poll, index) => {
      console.log(`  ${index + 1}. ${poll.question} (${poll.isPublished ? 'Published' : 'Draft'})`);
    });

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });