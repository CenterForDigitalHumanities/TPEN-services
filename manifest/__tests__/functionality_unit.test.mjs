/** 
 * Test the various pieces of logic contained within the /manifest endpoint.
 * This should not spin up Express and should not perform end to end tests by calling the endpoint.
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 * 
 * */

import * as logic from '../manifest.mjs'
import {validateID} from '../../utilities/shared.mjs'

describe('Manifest endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
  it('Need to redo tests to account for new db controller', () => {
    expect(true).toBe(false)
  })

  // await logic.createManifest(manifestJSON)
  // await logic.updateManifest(manifestJSON)
  // await logic.queryForManifest(manifestJSON)

}) 
