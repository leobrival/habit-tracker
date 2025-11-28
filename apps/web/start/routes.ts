import router from "@adonisjs/core/services/router";

const DashboardController = () => import("#controllers/dashboard_controller");

router.get("/", [DashboardController, "index"]);
router.get("/boards", [DashboardController, "boards"]);
router.get("/boards/:id", [DashboardController, "board"]);
router.get("/settings", [DashboardController, "settings"]);
