import express from "express"
import { respondWithError } from "../utilities/shared.js"
import cookieParser from "cookie-parser"
import auth0Middleware from "../auth/index.js"
import cors from "cors"
import validateURL from "../utilities/validateURL.js"
import ProjectFactory from "../classes/Project/ProjectFactory.js"

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
            const firstLevel = await fetch(
                `${process.env.TPEN28URL}/TPEN/projects?uid=${uid}`,
                {
                    method: "GET",
                    headers: { 
                        "Content-Type": "application/json; charset=utf-8",
                        "Cookie": `JSESSIONID=${jsessionid}` 
                    },
                    credentials: "include"
                }
            )
            .then(resp => {
                if(!resp.ok) throw resp
                return resp.json()
            })
            .catch(err => {throw err})

            let parsedData = {}
            parsedData = Object.fromEntries(
                Object.entries(firstLevel).map(([key, value]) => {
                    try {
                        return [key, JSON.parse(value)]
                    } catch {
                        return [key, value]
                    }
                })
            )

            return res.status(200).json({
                message: "Select a Project to Import : ",
                data: parsedData
            })
        } catch (error) {
            return respondWithError(res, error.status ?? 500, error.statusText ?? "Error fetching project data")
        }
    }
).all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
})

router.route("/import28/selectedproject/:selectedProjectId").get(
    cors(corsOptions),
    cookieParser(),
    patchTokenFromQuery,
    auth0Middleware(),
    async (req, res) => {
        const user = req.user
        const jsessionid = req.cookies?.JSESSIONID
        const selectedProjectId = req.params?.selectedProjectId

        if (!user) return respondWithError(res, 401, "Unauthenticated request")
        if (!jsessionid) return respondWithError(res, 400, "Missing jsessionid in query")
        if (!selectedProjectId) return respondWithError(res, 400, "Missing selectedProjectId in query")

        try {
            const importResponse = await fetch(
                `${process.env.TPEN28URL}/TPEN/getProjectTPENServlet?projectID=${selectedProjectId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Cookie": `JSESSIONID=${jsessionid}`
                    },
                    credentials: "include"
                }
            )
            .then(resp => {
                if(!resp.ok) throw resp
                return resp.json()
            })
            .catch(err => {throw err})

            let parsedData = {}
            parsedData = Object.fromEntries(
                Object.entries(importResponse).map(([key, value]) => {
                    try {
                        return [key, JSON.parse(value)]
                    } catch {
                        return [key, value]
                    }
                })
            )

            const manifestURL = `${process.env.TPEN28URL}/TPEN/manifest/${selectedProjectId}`
            let checkURL = await validateURL(manifestURL)
            let importData
            if (!checkURL.valid)
                return res.status(checkURL.status).json({message: checkURL.message, resolvedPayload: checkURL.resolvedPayload})
            try {
                importData = await ProjectFactory.fromManifestURL(manifestURL, user.agent.split('/').pop(), true)
            } catch (error) {
                res.status(error.status ?? 500).json({
                    status: error.status ?? 500,
                    message: error.message,
                    data: error.resolvedPayload
                })
            }

            await ProjectFactory.importTPEN28(parsedData, importData, req.cookies.userToken, req.protocol)
            res.status(201).json({
                message: "Project imported successfully",
                project: { parsedData, importData }
            })
        } catch (error) {
            return respondWithError(res, error.status ?? 500, error.statusText ?? "Error fetching project data")
        }
    }
).all((req, res) => {
    respondWithError(res, 405, "Improper request method. Use GET instead")
})

export default router
