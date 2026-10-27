const prisma = require("../db");

const userSummary = { id: true, username: true, fullname: true };
const userCounts = { posts: true, likes: true };

function filtersWhere(options = {}) {
  const where = {};
  if (options.isPrivate !== undefined) where.isPrivate = options.isPrivate;
  if (options.search) {
    where.OR = [
      { username: { contains: options.search } },
      { fullname: { contains: options.search } }
    ];
  }
  if (options.hasPosts !== undefined) {
    where.posts = options.hasPosts ? { some: {} } : { none: {} };
  }
  return where;
}

async function createUser(data) {
  return prisma.user.create({ data });
}

async function listUsers(options = {}) {
  const where = filtersWhere(options);
  const orderBy = { [options.sortBy || "createdAt"]: options.order || "desc" };
  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy,
      skip: options.skip || 0,
      take: options.limit,
      include: { _count: { select: userCounts } }
    }),
    prisma.user.count({ where })
  ]);
  return { data, total };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: { _count: { select: userCounts } }
  });
}

async function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data });
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

async function userExists(id) {
  return Boolean(await prisma.user.findUnique({ where: { id }, select: { id: true } }));
}

async function listUserPosts(userId, options) {
  const where = { authorId: userId };
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.limit,
      include: { _count: { select: { likes: true } } }
    }),
    prisma.post.count({ where })
  ]);
  return { data, total };
}

async function listLikedPosts(userId, options) {
  const where = { likes: { some: { userId } } };
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.limit,
      include: {
        author: { select: userSummary },
        _count: { select: { likes: true } }
      }
    }),
    prisma.post.count({ where })
  ]);
  return { data, total };
}

module.exports = {
  createUser, listUsers, getUserById, updateUser, deleteUser,
  userExists, listUserPosts, listLikedPosts
};
