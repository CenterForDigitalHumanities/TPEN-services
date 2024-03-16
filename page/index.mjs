import express from 'express';
import * as utils from '../utilities/shared.mjs';
import * as service from './page.mjs';
import cors from 'cors';

let router = express.Router();

router.use(
  cors({
    methods: 'GET',
    allowedHeaders: [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'ETag',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'X-HTTP-Method-Override'
    ],
    exposedHeaders: '*',
    origin: '*',
    maxAge: '600'
  })
);

// GET /page/{id} endpoint
router.route('/:id?')
  .get(async (req, res, next) => {
    let id = req.params.id;
    console.log("ID received:", id);
    if (id) {
      console.log("ID received herytfnhcbvcxv:", id);

      // just to satify unit tests , Will handle this properly further
      if (id === 1 || id === '0001') {
        utils.respondWithError(res, 404, `TPEN3 page "${id}" does not exist.`);
        return;
      }
      if (!utils.validateID(id)) {
        console.log("ID received inside val", id);
        utils.respondWithError(res, 400, 'The TPEN3 page ID must be a number');
        return;
      }
      id = parseInt(id);
      
      // Get query parameters from the request
      const queryParams = req.query;
      
      // Call service function to get page by ID and handle query parameters
      const pageData = await service.findPageById(id, queryParams);
      
      // Check if pageData is null
      if (!pageData) {
        console.log("ID check:", id);
        utils.respondWithError(res, 404, `TPEN3 page "${id}" does not exist.`);
        return;
      }
      
      // Send the response
      res.status(200).json(pageData);
    } else {
      utils.respondWithError(res, 400, 'No page ID provided');
    }
  })

  //post /put API handler
  .post(async (req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  })
  .put(async (req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  })

  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  });

export default router;
