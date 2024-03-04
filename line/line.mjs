import * as utils from '../utilities/shared.mjs'
import { db } from './db.js'

export async function findLineById(id = null, options = {}) {
  let line = null

  if (!utils.validateID(id)) {
    return line
  }

  line = db.getByID(id) || null

  if (line !== null) {
    if (options.text === 'blob') {
      return { text: line.textualBody }
    } else if (options.image === 'full') {
      return { image: line.canvas }
    } else if (options.image === 'line') {
      return { image: `some line image URL for id ${id}` }
    } else if (options.lookup === 'project') {
      return { projectDocument: `some project document for id ${id}` }
    } else {
      const jsonResponse = {
        '@context': line['@context'],
        id: line.id,
        '@type': line['@type'],
        creator: line.creator,
        textualBody: line.textualBody,
        project: line.project,
        canvas: line.canvas,
        layer: line.layer,
        viewer: line.viewer,
        license: line.license
      }
      return jsonResponse;
    }
  }

  return line
}