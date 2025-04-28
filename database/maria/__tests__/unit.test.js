/**
    * This should test unit actions against the MariaDB Controller.
    * 
    * @author Bryan Haberberger
    * https://github.com/thehabes 
*/
import DatabaseController from '../controller.mjs'
const database = new DatabaseController()

describe('A MARIADB stub test that is always true. #maria_unit #db',()=>{
    it('MARIA says hello', async () => {
        expect(true).toBeTruthy()
    })
})
