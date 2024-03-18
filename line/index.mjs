import express from 'express';
import * as utils from '../utilities/shared.mjs';
import { findLineById } from './line.mjs';
import cors from 'cors';

const router = express.Router();

// Enable CORS
router.use(cors({
  methods: 'GET', // Allow only GET requests
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
  exposedHeaders: '*', // Expose all headers
  origin: '*', // Allow requests from any origin
  maxAge: '600' // Cache preflight requests for 600 seconds
}));

router.route('/:id')
  .get(async (req, res, next) => {
    try {
      let id = req.params.id;

      // Validate if the TPEN3 line ID is a number
      if (isNaN(id)) {
        return utils.respondWithError(res, 400, 'The TPEN3 Line ID must be a number');
      }

      // Convert id to integer
      id = parseInt(id);

      // Find line by ID
      const lineObject = await findLineById(id);

      // If lineObject is null, return 404
      if (lineObject === null) {
        return utils.respondWithError(res, 404, `TPEN 3 line "${id}" does not exist.`);
      }

      // Return lineObject with status 200
      res.status(200).json(lineObject);
    } catch (error) {
      console.error(error);
      return utils.respondWithError(res, 500, 'Internal Server Error');
    }
  })
  .all((req, res, next) => {
    // Handle all other HTTP methods
    return utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  });

// Handle requests to root route
router.route('/')
  .get((req, res, next) => {
    // Return 400 for requests without line ID
    return utils.respondWithError(res, 400, 'Improper request. There was no line ID.');
  })
  .all((req, res, next) => {
    // Handle all other HTTP methods
    return utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  });

export default router;