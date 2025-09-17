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

    const user1 = await prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        passwordHash: passwordHash
      }
    });

    const user2 = await prisma.user.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com', 
        passwordHash: passwordHash
      }
    });

    const user3 = await prisma.user.create({
      data: {
        name: 'Carol Davis',
        email: 'carol@example.com',
        passwordHash: passwordHash
      }
    });

    console.log('✅ Created sample users');

    // Create sample polls
    const poll1 = await prisma.poll.create({
      data: {
        question: 'What is your favorite programming language?',
        isPublished: true,
        creatorId: user1.id,
        options: {
          create: [
            { text: 'JavaScript' },
            { text: 'Python' },
            { text: 'Java' },
            { text: 'Go' },
            { text: 'Rust' }
          ]
        }
      },
      include: {
        options: true
      }
    });

    const poll2 = await prisma.poll.create({
      data: {
        question: 'Which framework do you prefer for frontend development?',
        isPublished: true,
        creatorId: user2.id,
        options: {
          create: [
            { text: 'React' },
            { text: 'Vue.js' },
            { text: 'Angular' },
            { text: 'Svelte' }
          ]
        }
      },
      include: {
        options: true
      }
    });

    const poll3 = await prisma.poll.create({
      data: {
        question: 'What is the best time to have team meetings?',
        isPublished: false,
        creatorId: user3.id,
        options: {
          create: [
            { text: 'Morning (9 AM - 11 AM)' },
            { text: 'Afternoon (1 PM - 3 PM)' },
            { text: 'Late afternoon (3 PM - 5 PM)' }
          ]
        }
      },
      include: {
        options: true
      }
    });

    console.log('✅ Created sample polls');

    // Create some sample votes
    await prisma.vote.create({
      data: {
        userId: user2.id,
        pollOptionId: poll1.options[0].id // JavaScript
      }
    });

    await prisma.vote.create({
      data: {
        userId: user3.id,
        pollOptionId: poll1.options[1].id // Python
      }
    });

    await prisma.vote.create({
      data: {
        userId: user1.id,
        pollOptionId: poll2.options[0].id // React
      }
    });

    await prisma.vote.create({
      data: {
        userId: user3.id,
        pollOptionId: poll2.options[0].id // React
      }
    });

    console.log('✅ Created sample votes');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users created: 3`);
    console.log(`📝 Polls created: 3 (2 published, 1 draft)`);
    console.log(`🗳️  Votes created: 4`);
    console.log('\n👤 Sample users (password: password123):');
    console.log(`  - alice@example.com`);
    console.log(`  - bob@example.com`);
    console.log(`  - carol@example.com`);

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