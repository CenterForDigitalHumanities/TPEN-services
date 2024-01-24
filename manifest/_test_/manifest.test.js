let request = require("supertest")
//Fun fact, if you don't require app, you don't get coverage even though the tests run just fine.
const app = require('../../app')
//const call = require("../index.js")

// You can mock the import of the functions in the index.js manifest router

describe('Manifest endpoint without a TPEN3 project number.', () => {
  it('The status should be 400 with a message', async () => {
    const res = await request(app)
      .get('/manifest')
      expect(res.statusCode).toEqual(400)
      expect(res.text).toBeTruthy()
  })
})

describe('Manifest endpoint with a TPEN3 project number.', () => {
  it('The status should be 200 with a Manifest JSON object in the body.', async () => {
    const res = await request(app)
      .get('/manifest/1')
    const objType = res.body.type ?? res.body["@type"] ?? ""
      expect(res.statusCode).toEqual(200)
      expect(res.type).toEqual('application/json')
      expect(res.body).toBeTruthy()
  })
})

describe('Manifest endpoint called via the incorrect method.', () => {
  it('That status should be 405 with a message.', async () => {
    const res = await request(app)
      .post('/manifest')
      expect(res.statusCode).toEqual(405)
      expect(res.text).toBeTruthy()
  })
})
