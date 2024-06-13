import express from "express"
import cors from "cors"  
import ImportProject from "../classes/Project/ImportProject.mjs"
 
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
  const manifestId = "4080"  
  ImportProject.fromManifest(manifestId)
    .then((savedProject) => {
     res.status(200).json(savedProject)
    })
    .catch((error) => {
     res.status(error.status??500).json({message:error?.message})
      console.error("Error importing project:", error)
    })
})

export default router
