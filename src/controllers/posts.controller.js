const service = require("../services/posts.service");
const usersService = require("../services/users.service");
const likesService = require("../services/likes.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const error = (res, status, message) => res.status(status).json({ error: message });
const idOf = (req) => Number(req.params.id);

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body || {};
  if (!imageUrl || authorId === undefined) return error(res, 400, "imageUrl and authorId are required");
  if (!(await usersService.userExists(Number(authorId)))) return error(res, 404, "User not found");
  return res.status(201).json(await service.createPost({ imageUrl, authorId: Number(authorId), caption, location }));
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) return error(res, 400, pagination.error);
  const allowed = ["createdAt", "updatedAt", "likes"];
  const sortBy = req.query.sortBy || "createdAt";
  if (!allowed.includes(sortBy)) return error(res, 400, "sortBy must be one of: createdAt, updatedAt, likes");
  const order = req.query.order || "desc";
  if (!["asc", "desc"].includes(order)) return error(res, 400, "order must be asc or desc");
  for (const key of ["from", "to"]) {
    if (req.query[key] !== undefined && Number.isNaN(Date.parse(req.query[key]))) {
      return error(res, 400, "from and to must be valid dates");
    }
  }
  const result = await service.listPosts({
    ...pagination, sortBy, order, location: req.query.location,
    search: req.query.search, from: req.query.from, to: req.query.to
  });
  return res.json({ data: result.data, meta: paginationMeta(pagination.page, pagination.limit, result.total) });
}

async function getOne(req, res) {
  const post = await service.getPostById(idOf(req));
  return post ? res.json(post) : error(res, 404, "Post not found");
}

async function update(req, res) {
  const { caption, location } = req.body || {};
  try {
    return res.json(await service.updatePost(idOf(req), { caption, location }));
  } catch (err) {
    if (err.code === "P2025") return error(res, 404, "Post not found");
    throw err;
  }
}

async function remove(req, res) {
  try {
    await service.deletePost(idOf(req));
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return error(res, 404, "Post not found");
    throw err;
  }
}

async function likes(req, res) {
  if (!(await service.postExists(idOf(req)))) return error(res, 404, "Post not found");
  return res.json(await service.listPostLikes(idOf(req)));
}

async function like(req, res) {
  const userId = req.body?.userId;
  if (userId === undefined) return error(res, 400, "userId is required");
  const postId = idOf(req);
  if (!(await service.postExists(postId))) return error(res, 404, "Post not found");
  if (!(await usersService.userExists(Number(userId)))) return error(res, 404, "User not found");
  try {
    return res.status(201).json(await likesService.createLike(postId, Number(userId)));
  } catch (err) {
    if (err.code === "P2002") return error(res, 409, "Already liked");
    throw err;
  }
}

async function unlike(req, res) {
  try {
    await likesService.deleteLike(idOf(req), Number(req.params.userId));
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return error(res, 404, "Like not found");
    throw err;
  }
}

module.exports = { create, list, getOne, update, remove, likes, like, unlike };
