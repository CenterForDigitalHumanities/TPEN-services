import express from "express"
import cors from "cors" 
import { ImportProject } from "./index.mjs"

const router = express.Router()
router.use(
  cors({
    methods: "GET",
    allowedHeaders: [
      "Content-Type",
      "Content-Length",
      "Allow",
      "Authorization",
      "Location",
      "ETag",
      "Connection",
      "Keep-Alive",
      "Date",
      "Cache-Control",
      "Last-Modified",
      "Link",
      "X-HTTP-Method-Override"
    ],
    exposedHeaders: "*",
    origin: "*",
    maxAge: "600"
  })
)

router.get("/", async (req, res) => {
  const projectId = "4080"

  ImportProject.processManifest()
    .then((savedProject) => {
      res.status(200).json(savedProject)
    })
    .catch((error) => {
      res.status(error.Status ?? 500).json({message: error?.message})
      console.error("Error importing project:", error)
    })

    
  // Project.fetchManifest(projectId)
  //   .then((savedProject) => {
  //    res.status(200).json(savedProject)
  //   })
  //   .catch((error) => {
  //    res.status(error.status??500).json({message:error?.message})
  //     console.error("Error importing project:", error)
  //   })
})

export default router
