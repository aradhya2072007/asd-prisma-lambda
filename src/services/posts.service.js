const prisma = require("../db");

const userSummary = { id: true, username: true, fullname: true };
const postInclude = {
  author: { select: userSummary },
  _count: { select: { likes: true } }
};

function filtersWhere(options = {}) {
  const where = {};
  if (options.location) {
    const location = String(options.location);
    where.OR = [
      { location: { contains: location.toLowerCase() } },
      { location: { contains: location.toUpperCase() } },
      { location: { contains: location[0].toUpperCase() + location.slice(1).toLowerCase() } }
    ];
  }
  if (options.search) {
    const search = [
      { caption: { contains: options.search } },
      { location: { contains: options.search } }
    ];
    where.AND = [{ OR: search }];
  }
  if (options.from || options.to) {
    where.createdAt = {};
    if (options.from) where.createdAt.gte = new Date(options.from);
    if (options.to) where.createdAt.lte = new Date(options.to);
  }
  return where;
}

async function createPost(data) {
  return prisma.post.create({ data });
}

async function listPosts(options = {}) {
  const where = filtersWhere(options);
  let orderBy;
  if (options.sortBy === "likes") {
    orderBy = [
      { likes: { _count: options.order || "desc" } },
      { createdAt: "desc" }
    ];
  } else {
    orderBy = { [options.sortBy || "createdAt"]: options.order || "desc" };
  }
  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy,
      skip: options.skip || 0,
      take: options.limit,
      include: postInclude
    }),
    prisma.post.count({ where })
  ]);
  return { data, total };
}

async function getPostById(id) {
  return prisma.post.findUnique({ where: { id }, include: postInclude });
}

async function updatePost(id, data) {
  return prisma.post.update({ where: { id }, data, include: postInclude });
}

async function deletePost(id) {
  return prisma.post.delete({ where: { id } });
}

async function postExists(id) {
  return Boolean(await prisma.post.findUnique({ where: { id }, select: { id: true } }));
}

async function listPostLikes(postId) {
  const rows = await prisma.like.findMany({
    where: { postId },
    orderBy: { user: { username: "asc" } },
    select: { user: { select: userSummary } }
  });
  return rows.map(({ user }) => user);
}

module.exports = {
  createPost, listPosts, getPostById, updatePost, deletePost,
  postExists, listPostLikes
};
