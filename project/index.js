import express from "express"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" with {type: "json"}
import layerRouter from "../layer/index.js"
import projectCreateRouter from "./projectCreateRouter.js"
import import28Router from "./import28Router.js"
import projectReadRouter from "./projectReadRouter.js"
import memberRouter from "./memberRouter.js"
import customRolesRouter from "./customRolesRouter.js"
import hotkeysRouter from "./hotkeysRouter.js"
import metadataRouter from "./metadataRouter.js"
import projectToolsRouter from "./projectToolsRouter.js"
import memberUpgradeRouter from "./memberUpgradeRouter.js"

const router = express.Router({ mergeParams: true })
router.use(cors(common_cors))

// Use split routers
router.use(memberUpgradeRouter) // Contains unauthenticated route!
router.use(projectCreateRouter)
router.use(import28Router)
router.use(projectReadRouter)
router.use(memberRouter)
router.use(customRolesRouter)
router.use(hotkeysRouter)
router.use(metadataRouter)
router.use(projectToolsRouter)

// Nested route for layers within a project
router.use('/:projectId/layer', layerRouter)

export default router
