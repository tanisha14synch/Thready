import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed communities
  const communities = [
    {
      id: 'the_bar_wardrobe',
      name: 'r/The_Bar_Wardrobe',
      description: 'A community for lawyers to discuss professional attire and courtroom excellence',
      headerImage: '/images/communities/bar_wardrobe_header.jpg',
      icon: '/images/communities/bar_wardrobe_icon.jpg',
      members: 12500,
      online: 235,
      tags: ['lawyers', 'community'],
      moderators: [{ username: 'Euphoric_Dog3935', avatar: 'https://i.pravatar.cc/50?img=1' }]
    },
    {
      id: 'gaming',
      name: 'r/Gaming',
      description: 'All about games, builds, and tips.',
      headerImage: '/images/communities/gaming_header.jpg',
      icon: '/images/communities/gaming_icon.jpg',
      members: 2150000,
      online: 15230,
      tags: ['gaming', 'pc', 'console'],
      moderators: [{ username: 'Mod_Gamer', avatar: 'https://i.pravatar.cc/50?img=2' }]
    },
    {
      id: 'movies',
      name: 'r/Movies',
      description: 'Discuss movies, reviews, and recommendations.',
      headerImage: '/images/communities/movies_header.jpg',
      icon: '/images/communities/movies_icon.jpg',
      members: 1850000,
      online: 9320,
      tags: ['movies', 'reviews'],
      moderators: [{ username: 'FilmBuff', avatar: 'https://i.pravatar.cc/50?img=3' }]
    }
  ]

  for (const c of communities) {
    await prisma.community.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        description: c.description,
        headerImage: c.headerImage,
        icon: c.icon,
        members: c.members,
        online: c.online,
        isPublic: true,
        tags: JSON.stringify(c.tags),
        moderators: {
          create: c.moderators
        }
      }
    })
  }

  // Seed posts
  const posts = [
    {
      id: 'p-gaming-1',
      communityId: 'gaming',
      title: 'Welcome to the Gaming community',
      content: 'Share your latest builds, wins, or game recommendations.',
      user: 'Moderator',
      userId: 'legacy',
      avatar: '/images/avatars/default-avatar.jpg',
      upvotes: 12,
      downvotes: 1
    },
    {
      id: 'p-movies-1',
      communityId: 'movies',
      title: 'Best movies of the year?',
      content: 'Drop your must-watch picks.',
      user: 'FilmBuff',
      userId: 'legacy',
      avatar: '/images/avatars/default-avatar.jpg',
      upvotes: 5,
      downvotes: 0
    },
    {
      id: 'p-bar-1',
      communityId: 'the_bar_wardrobe',
      title: 'Outfit inspo thread',
      content: 'Share your fits and styling tips.',
      user: 'Stylist',
      userId: 'legacy',
      avatar: '/images/avatars/default-avatar.jpg',
      upvotes: 9,
      downvotes: 2
    }
  ]

  for (const p of posts) {
    await prisma.post.upsert({
      where: { id: p.id },
      update: {},
      create: {
        ...p
      }
    })
  }

  // Seed demo users for testing (useful for local testing of /api/user/me once you have a token)
  // NOTE: This assumes the User model exists in Prisma schema and migrations are applied.
  const demoUsers = [
    {
      shopifyCustomerId: 'shopify_demo_user_001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      username: 'johndoe',
      profileImage: null,
      avatarColor: '#E9D386',
      communityId: 'the_bar_wardrobe',
    },
    {
      shopifyCustomerId: 'shopify_demo_user_002',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      username: 'janesmith',
      profileImage: null,
      avatarColor: '#D4C070',
      communityId: 'gaming',
    },
    {
      shopifyCustomerId: 'shopify_demo_user_003',
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob.johnson@example.com',
      username: 'bobjohnson',
      profileImage: null,
      avatarColor: '#C4B060',
      communityId: 'movies',
    }
  ]

  const createdUserIds: string[] = []
  
  for (const userData of demoUsers) {
    try {
      const user = await prisma.user.upsert({
        where: { shopifyCustomerId: userData.shopifyCustomerId },
        update: {},
        create: userData,
      })
      createdUserIds.push(user.id)
      console.log(`✓ Created/Updated user: ${user.username} (ID: ${user.id})`)
    } catch (e) {
      console.warn(`Skipping user seed for ${userData.email} (User model not migrated yet).`)
    }
  }

  // Seed dummy comments for testing comment deletion ownership
  // Comments are organized by user ID for easy testing
  if (createdUserIds.length >= 3) {
    const [user1Id, user2Id, user3Id] = createdUserIds
    
    const testComments = [
      // User 1's comments (can be deleted by user1 only)
      {
        id: 'comment-user1-001',
        postId: 'p-gaming-1',
        userId: user1Id,
        user: 'johndoe',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'This is a comment by User 1 (johndoe). Only user1 can delete this.',
      },
      {
        id: 'comment-user1-002',
        postId: 'p-movies-1',
        userId: user1Id,
        user: 'johndoe',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'Another comment by User 1. Test deletion with user1 token.',
      },
      {
        id: 'comment-user1-003',
        postId: 'p-bar-1',
        userId: user1Id,
        user: 'johndoe',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'Third comment by User 1 for testing multiple deletions.',
      },
      
      // User 2's comments (can be deleted by user2 only)
      {
        id: 'comment-user2-001',
        postId: 'p-gaming-1',
        userId: user2Id,
        user: 'janesmith',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'This is a comment by User 2 (janesmith). Only user2 can delete this.',
      },
      {
        id: 'comment-user2-002',
        postId: 'p-movies-1',
        userId: user2Id,
        user: 'janesmith',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'Another comment by User 2. Test deletion with user2 token.',
      },
      
      // User 3's comments (can be deleted by user3 only)
      {
        id: 'comment-user3-001',
        postId: 'p-bar-1',
        userId: user3Id,
        user: 'bobjohnson',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'This is a comment by User 3 (bobjohnson). Only user3 can delete this.',
      },
      {
        id: 'comment-user3-002',
        postId: 'p-gaming-1',
        userId: user3Id,
        user: 'bobjohnson',
        avatar: '/images/avatars/default-avatar.jpg',
        text: 'Another comment by User 3. Test deletion with user3 token.',
      },
    ]

    for (const comment of testComments) {
      try {
        await prisma.comment.upsert({
          where: { id: comment.id },
          update: {
            userId: comment.userId,
            user: comment.user,
            text: comment.text,
          },
          create: comment,
        })
        console.log(`✓ Created/Updated comment: ${comment.id} (Owner: ${comment.user}, UserID: ${comment.userId})`)
      } catch (e: any) {
        console.warn(`Failed to seed comment ${comment.id}: ${e.message}`)
      }
    }

    console.log('\n📝 Test Comments Summary:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`User 1 (${user1Id} - johndoe):`)
    console.log('  - comment-user1-001 (on p-gaming-1)')
    console.log('  - comment-user1-002 (on p-movies-1)')
    console.log('  - comment-user1-003 (on p-bar-1)')
    console.log(`\nUser 2 (${user2Id} - janesmith):`)
    console.log('  - comment-user2-001 (on p-gaming-1)')
    console.log('  - comment-user2-002 (on p-movies-1)')
    console.log(`\nUser 3 (${user3Id} - bobjohnson):`)
    console.log('  - comment-user3-001 (on p-bar-1)')
    console.log('  - comment-user3-002 (on p-gaming-1)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🧪 Testing Instructions:')
    console.log('1. Get JWT token for user1 (johndoe)')
    console.log('2. Try to delete comment-user1-001 → Should succeed (200 OK)')
    console.log('3. Try to delete comment-user2-001 → Should fail (403 Forbidden)')
    console.log('4. Try to delete comment-user3-001 → Should fail (403 Forbidden)')
    console.log('5. Repeat with user2 and user3 tokens\n')
  } else {
    console.warn('Not enough users created. Skipping comment seed.')
  }

  console.log('\n✅ Seeded communities, posts, users, and test comments')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
