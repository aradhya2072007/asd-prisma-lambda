const router = require("express").Router();
const controller = require("../controllers/posts.controller");

router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id/likes", controller.likes);
router.post("/:id/likes", controller.like);
router.delete("/:id/likes/:userId", controller.unlike);
router.get("/:id", controller.getOne);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
