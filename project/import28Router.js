import express from "express"
import { respondWithError } from "../utilities/shared.js"
import cookieParser from "cookie-parser"
import auth0Middleware from "../auth/index.js"
import cors from "cors"

function patchTokenFromQuery(req, res, next) {
  if (!req.headers.authorization && req.cookies.userToken) {
    req.headers.authorization = `Bearer ${req.cookies.userToken}`
  }
  next()
}

const corsOptions = {
  origin(origin, callback) {
    if (origin) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true
}

const router = express.Router({ mergeParams: true })

router.route("/import28/:uid").get(
    cors(corsOptions),
    cookieParser(),
    patchTokenFromQuery,
    auth0Middleware(),
    async (req, res) => {
        const user = req.user
        const jsessionid = req.cookies?.JSESSIONID
        const uid = req.params?.uid

        if (!user) return respondWithError(res, 401, "Unauthenticated request")
        if (!jsessionid) return respondWithError(res, 400, "Missing jsessionid in query")
        if (!uid) return respondWithError(res, 400, "Missing uid in query")

        try {
            const response = await fetch(
                `${process.env.TPEN28URL}/TPEN/projects?uid=${uid}`,
                {
                    method: "GET",
                    headers: { Cookie: `JSESSIONID=${jsessionid}` },
                    credentials: "include"
                }
            )

            if (response.status === 500)
                return res.status(500).json({ message: "The project cannot be imported." })

            const rawText = await response.text()
            let parsedData = {}

            try {
                const firstLevel = JSON.parse(rawText)
                parsedData = Object.fromEntries(
                    Object.entries(firstLevel).map(([key, value]) => {
                        try {
                            return [key, JSON.parse(value)]
                        } catch {
                            return [key, value]
                        }
                    })
                )
            } catch (err) {
                console.error("Failed to parse project response:", err)
                return respondWithError(res, 500, "Invalid project response format")
            }

            return res.status(200).json({
                message: "Select a Project to Import : ",
                data: parsedData
            })
        } catch (error) {
            console.error("Error fetching project data:", error)
            return respondWithError(res, 500, "Error fetching project data")
        }
    }
).all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router
