function parsePagination(query) {
  const pageValue = query.page ?? "1";
  const limitValue = query.limit ?? "10";

  if (!/^[1-9]\d*$/.test(String(pageValue)) || !/^[1-9]\d*$/.test(String(limitValue))) {
    return { error: "page and limit must be positive integers" };
  }

  const page = Number(pageValue);
  const limit = Math.min(Number(limitValue), 50);
  return { page, limit, skip: (page - 1) * limit };
}

function paginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

module.exports = { parsePagination, paginationMeta };
