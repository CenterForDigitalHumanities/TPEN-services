import express from 'express'
let router = express.Router()

router
  .get('/', function(req, res, next) {
    res.type("text")
    res.status(200).send('TPEN3 SERVICES BABY!!!')
  }) 
  .all((req, res, next) => {
    res.status(404).send('There is nothing for you here.')
 })

export {router as default}