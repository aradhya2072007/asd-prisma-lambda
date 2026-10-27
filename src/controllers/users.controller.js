const service = require("../services/users.service");
const { parsePagination, paginationMeta } = require("../utils/pagination");

const error = (res, status, message) => res.status(status).json({ error: message });
const idOf = (req) => Number(req.params.id);
const parseBoolean = (value) => value === "true" ? true : value === "false" ? false : undefined;

async function create(req, res) {
  const { username, email, fullname, bio } = req.body || {};
  if (!username || !email || !fullname) return error(res, 400, "username, email and fullname are required");
  try {
    const user = await service.createUser({ username, email, fullname, bio });
    return res.status(201).json(user);
  } catch (err) {
    if (err.code === "P2002") return error(res, 409, "username or email already taken");
    throw err;
  }
}

async function list(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) return error(res, 400, pagination.error);
  const allowed = ["createdAt", "username", "fullname"];
  const sortBy = req.query.sortBy || "createdAt";
  if (!allowed.includes(sortBy)) return error(res, 400, "sortBy must be one of: createdAt, username, fullname");
  const order = req.query.order || "desc";
  if (!["asc", "desc"].includes(order)) return error(res, 400, "order must be asc or desc");
  let isPrivate;
  if (req.query.isPrivate !== undefined) {
    isPrivate = parseBoolean(req.query.isPrivate);
    if (isPrivate === undefined) return error(res, 400, "isPrivate must be true or false");
  }
  let hasPosts;
  if (req.query.hasPosts !== undefined) {
    hasPosts = parseBoolean(req.query.hasPosts);
    if (hasPosts === undefined) return error(res, 400, "hasPosts must be true or false");
  }
  const result = await service.listUsers({ ...pagination, sortBy, order, isPrivate, hasPosts, search: req.query.search });
  return res.json({ data: result.data, meta: paginationMeta(pagination.page, pagination.limit, result.total) });
}

async function getOne(req, res) {
  const user = await service.getUserById(idOf(req));
  return user ? res.json(user) : error(res, 404, "User not found");
}

async function update(req, res) {
  const { fullname, bio, isPrivate } = req.body || {};
  try {
    const user = await service.updateUser(idOf(req), { fullname, bio, isPrivate });
    return res.json(user);
  } catch (err) {
    if (err.code === "P2025") return error(res, 404, "User not found");
    throw err;
  }
}

async function remove(req, res) {
  try {
    await service.deleteUser(idOf(req));
    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") return error(res, 404, "User not found");
    throw err;
  }
}

async function posts(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) return error(res, 400, pagination.error);
  if (!(await service.userExists(idOf(req)))) return error(res, 404, "User not found");
  const result = await service.listUserPosts(idOf(req), pagination);
  return res.json({ data: result.data, meta: paginationMeta(pagination.page, pagination.limit, result.total) });
}

async function likedPosts(req, res) {
  const pagination = parsePagination(req.query);
  if (pagination.error) return error(res, 400, pagination.error);
  if (!(await service.userExists(idOf(req)))) return error(res, 404, "User not found");
  const result = await service.listLikedPosts(idOf(req), pagination);
  return res.json({ data: result.data, meta: paginationMeta(pagination.page, pagination.limit, result.total) });
}

module.exports = { create, list, getOne, update, remove, posts, likedPosts };
