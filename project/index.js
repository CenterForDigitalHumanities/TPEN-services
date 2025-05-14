import express from "express"
import cors from "cors"
import common_cors from "../utilities/common_cors.json" with {type: "json"}
import layerRouter from "../layer/index.js"
import pageRouter from "../page/index.js"
import projectCreateRouter from "./projectCreateRouter.js"
import import28Router from "./import28Router.js"
import projectReadRouter from "./projectReadRouter.js"
import memberRouter from "./memberRouter.js"
import customRolesRouter from "./customRolesRouter.js"
import hotkeysRouter from "./hotkeysRouter.js"
import metadataRouter from "./metadataRouter.js"

const router = express.Router({ mergeParams: true })
router.use(cors(common_cors))

// Use split routers
router.use(projectCreateRouter)
router.use(import28Router)
router.use(projectReadRouter)
router.use(memberRouter)
router.use(customRolesRouter)
router.use(hotkeysRouter)
router.use(metadataRouter)

// Nested route for layers within a project
router.use('/:projectId/layer', layerRouter)
router.use('/:projectId/page', pageRouter)

export default router
