/**
    * The DB unit actions themselves are tested elsewhere.
    * This should test that the Poly is put together and its pices
    * map to the correct controller functionality.
*/

import PolyController from "../polyController.mjs"

describe('POLY CRUD and query is registered.  #poly_unit',()=>{
    const p = new PolyController()
    it('create', async () => {
        expect(typeof p.create).toBe("function")
    })
    it('update', async () => {
        expect(typeof p.update).toBe("function")
    })
    it('remove', async () => {
        expect(typeof p.remove).toBe("function")
    })
    it('read', async () => {
        expect(typeof p.read).toBe("function")
    })
    it('choose controller', async () => {
        expect(typeof p.chooseController).toBe("function")
    })
    it('connected', async () => {
        expect(typeof p.connected).toBe("function")
    })
    it('close', async () => {
        expect(typeof p.close).toBe("function")
    })
})

describe('Can connect to all registered controllers.  #poly_unit',()=>{
    it('Tiny Connection', async () => {
        const p = new PolyController()
        await p.chooseController("tiny")
        expect(await p.connected()).toBe(true)
    })
    it('Mongo Connection', async () => {
        const p = new PolyController()
        await p.chooseController("mongo")
        expect(await p.connected()).toBe(true)
    })
    it('Maria Connection Stub', async () => {
        expect(true).toBeTruthy()
    })
})

describe('Can connect to all registered controllers with applied parameter.  #poly_unit',()=>{
    it('Tiny Connection Parameter', async () => {
        const p = new PolyController("tiny")
        expect(await p.connected()).toBe(true)
    })
    it('Mongo Connection Parameter', async () => {
        const p = new PolyController("mongo")
        expect(await p.connected()).toBe(true)
    })
    it('Maria Connection Parameter Stub', async () => {
        expect(true).toBeTruthy()
    })
})
