const router = require("express").Router();
const controller = require("../controllers/users.controller");

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id/posts", controller.posts);
router.get("/:id/liked-posts", controller.likedPosts);
router.get("/:id", controller.getOne);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
