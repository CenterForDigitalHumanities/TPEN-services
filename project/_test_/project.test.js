let request = require("supertest")
//Fun fact, if you don't require app, you don't get coverage even though the tests run just fine.
let app = require('../../app')
request = request("http://localhost:3333")

/**
 * All the routes that work for GET requests or paths to HTML pages.
 */ 

describe('Make sure the /project route exists', function() {

  it('/project/ -- TODO ', function(done) {
    done()
  })

  // it('/project/ -- Call to this without an _id.  Returns "Bad Request". ', function(done) {
  //   request
  //     .get("/project/")
  //     .expect(400, done)
  // })

  // it('/project/1111 -- Returns a Manifest object. ', function(done) {
  //   request
  //     .get("/project/1111")
  //     .expect(200)
  //     .then(response => {
  //       expect(response.body["@id"]).toBeTruthy()
  //       done()
  //     })
  // })

})