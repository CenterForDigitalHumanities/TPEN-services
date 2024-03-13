import {default as DatabaseController} from '../index.mjs'
// If tests run independent of app.js, then the test needs to register the .env middleware
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

const dbController = new DatabaseController(process.env.MARIADB)

beforeAll(async () => {
   return await dbController.connect()
})

afterAll(async () => {
   return await dbController.close()
})

describe('A MARIADB stub test that is always true.  #exists_unit #db',()=>{
    it('Says hello', async () => {
        expect(true).toBeTruthy()
    })
})


// Add more tests for the remaining methods...
