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

  // Seed a demo Shopify user (useful for local testing of /api/user/me once you have a token)
  // NOTE: This assumes the User model exists in Prisma schema and migrations are applied.
  try {
    await prisma.user.upsert({
      where: { shopifyCustomerId: 'shopify_demo_12345' },
      update: {},
      create: {
        shopifyCustomerId: 'shopify_demo_12345',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        username: 'johndoe',
        profileImage: null,
        avatarColor: '#E9D386',
        communityId: 'the_bar_wardrobe',
      },
    })
  } catch (e) {
    // If migrations aren't applied yet, don't fail seeding communities/posts
    console.warn('Skipping demo user seed (User model not migrated yet).')
  }

  console.log('Seeded communities, posts, and (optionally) demo user')
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
