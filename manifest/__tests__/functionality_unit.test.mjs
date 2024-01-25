//need to import app for coverage, not for actual testing tho.
import app from '../../app.mjs'
// This is specifically the Manifest router and related util functions
import {validateProjectID, findTheManifestById} from '../index.mjs'

// You can mock the import of the functions in the index.js manifest router without bringing in the functions

describe('Detect missing id number', () => {
  it('Project validation must be false.', () => {
    expect(validateProjectID()).toBe(false)
  })
})

describe('Detect TPEN3 project does not exist', () => {
  it('The query for a TPEN3 project must be null.', async () => {
    expect(findTheManifestById(-111)).toBe(null)
  })
})

describe('TPEN3 project does exist', () => {
  it('Finding the manifest results in the manifest JSON', async () => {
    let json = findTheManifestById(7085)
    try{
      json = JSON.parse(JSON.stringify(json))
    }
    catch(err){
      json = null
    }
    expect(json).not.toBe(null)
  })
})


