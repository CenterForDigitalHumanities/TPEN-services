import express from 'express'
let router = express.Router()

// Send a successful response with a text message (not an HTML page yet)
export function respondWithText(res){
  res.type("text")
  res.status(200)
  res.send('TPEN3 SERVICES BABY!!!')
}

// Send a failure response with the proper code and message
export function respondWithError(res, status, message){
   res.status(status).send(message)
}

router
  .get('/', function(req, res, next) {
    respondWithText(res)
  }) 
  .all((req, res, next) => {
    respondWithError(res, 404, 'There is nothing for you here.')
 })

export {router as default}