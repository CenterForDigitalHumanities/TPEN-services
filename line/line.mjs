import express from 'express';
import * as utils from '../utilities/shared.mjs';
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

router.route('/:id')
  .get(async (req, res, next) => {
    try {
      let id = req.params.id;

      if (!utils.validateProjectID(id)) {
        utils.respondWithError(res, 400, 'The TPEN3 project ID must be a number');
        return;
      }

      id = parseInt(id);

      const lineObject = await findLineById(id);

      if (lineObject) {
        respondWithLine(res, lineObject);
      } else {
        utils.respondWithError(res, 404, `TPEN 3 line "${id}" does not exist.`);
      }
    } catch (error) {
      console.error(error); 
      utils.respondWithError(res, 500, 'Internal Server Error');
    }
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  });

router.route('/')
  .get((req, res, next) => {
    utils.respondWithError(res, 400, 'Improper request.  There was no project ID.');
  })
  .all((req, res, next) => {
    utils.respondWithError(res, 405, 'Improper request method, please use GET.');
  });

export async function findLineById(id = null) {
  let line = null;

  if (!utils.validateProjectID(id)) {
    return line;
  }

  const mockPause = new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, 1500);
  });

  const linesArray = [
    { id: 123, text: "Hey TPEN Works on 123" },
  ];

  line = linesArray.find((line) => line.id === id);

  if (line === null) {
    line = await mockPause.then((val) => {
      return null;
    });
  }

  return line;
}

function respondWithLine(res, lineObject) {
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json(lineObject);
}

export default router;