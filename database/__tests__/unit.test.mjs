/**
    * This should test that the Driver is put together and that its pices
    * map to the correct controllers.
    * 
    * @author Bryan Haberberger
    * https://github.com/thehabes 
*/

import DatabaseDriver from "../driver.mjs"

describe('POLY CRUD and query is registered.  #poly_unit #db',()=>{
    const d = new DatabaseDriver()
    it('create', async () => {
        expect(typeof d.create).toBe("function")
    })
    it('update', async () => {
        expect(typeof d.update).toBe("function")
    })
    it('remove', async () => {
        expect(typeof d.remove).toBe("function")
    })
    it('read', async () => {
        expect(typeof d.read).toBe("function")
    })
    it('choose controller', async () => {
        expect(typeof d.chooseController).toBe("function")
    })
    it('connected', async () => {
        expect(typeof d.connected).toBe("function")
    })
    it('close', async () => {
        expect(typeof d.close).toBe("function")
    })
})

describe('Can connect to all registered controllers.  #poly_unit #db',()=>{
    it('Tiny Connection', async () => {
        const d = new DatabaseDriver()
        await d.chooseController("tiny")
        expect(await d.connected()).toBe(true)
    })
    it('Mongo Connection', async () => {
        const d = new DatabaseDriver()
        await d.chooseController("mongo")
        expect(await d.connected()).toBe(true)
    })
    it('Maria Connection Stub', async () => {
        expect(true).toBeTruthy()
    })
})

describe('Can connect to all registered controllers with applied parameter.  #poly_unit #db',()=>{
    it('Tiny Connection Parameter', async () => {
        const p = new dbDriver("tiny")
        expect(await p.connected()).toBe(true)
    })
    it('Mongo Connection Parameter', async () => {
        const p = new dbDriver("mongo")
        expect(await p.connected()).toBe(true)
    })
    it('Maria Connection Parameter Stub', async () => {
        expect(true).toBeTruthy()
    })
})

// TODO should we test that each CRUD and query action functions, or is that test downstream good enough