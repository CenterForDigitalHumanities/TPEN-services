/**
 * A TinyPEN Controller.  Actions here specifically fetch to the set TinyPEN API URLS.
 * @see this.URLS
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */ 

import dotenv from 'dotenv'
import { ObjectId } from 'mongodb'
let storedEnv = dotenv.config()
let err_out = Object.assign(new Error(), {"status":123, "message":"N/A", "_dbaction":"N/A"})

class DatabaseController {

    /** Basic constructor to establish constant class properties */
    constructor() {
        this.URLS = {}
        this.URLS.CREATE = process.env.TINYPEN+"create"
        this.URLS.UPDATE = process.env.TINYPEN+"update"
        this.URLS.OVERWRITE = process.env.TINYPEN+"overwrite"
        this.URLS.QUERY = process.env.TINYPEN+"query"
        this.URLS.DELETE = process.env.TINYPEN+"delete"
        console.log("TINY API established")
        console.log(this.URLS)
    }

    /** 
     * Set the client for the controller and open a connection.
     * Note TinyPEN is an open API on the internet.  This controller has no connect().
     * */
    async connect() {
        return 
    }

    /** 
     * Close the connection to the client.
     * Note TinyPEN is an open API on the internet.  This controller has no close().
     * */
    async close() {
        return
    }

    /** 
     * Generally check that the TinyPEN API is running.
     * Perform a query for an object we know is there.
     * @return boolean
     * */
    async connected() {
        // Send a /query to ping TinyPen
        try{
            // FIXME something less expensive
            const theone = await this.find({ "_id": "11111" })
            return theone.length === 1    
        } catch(err){
            console.error(err)
            return false
        }
    }

    async reserveId(seed) {
        try {
            return ObjectId(seed).toHexString()
        } catch (err) {
            return new ObjectId().toHexString()
        }
    }

    /**
     * Use the TinyPEN query endpoint to find JSON objects matching the supplied property values.
     * @param query JSON from an HTTP POST request.  It must contain at least one property.
     * @return the found JSON as an Array or Error
     */
    async find(query) {
        err_out._dbaction = this.URLS.QUERY
        return await fetch(this.URLS.QUERY, {
                method: 'post',
                body: JSON.stringify(query),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (!resp.ok) {
                    err_out.message = resp.statusText ?? `TinyPEN Query sent a bad response`
                    err_out.status = resp.status ?? 500
                    throw err_out
                }
                return resp.json()
            })
            .catch(err => {
                // Specifically account for unexpected fetch()y things.  
                if(!err?.message) err.message = err.statusText ?? `TinyPEN Query did not complete successfully`
                if(!err?.status) err.status = err.status ?? 500
                if(!err?._dbaction) err._dbaction = this.URLS.QUERY
                throw err
            })
    }

    /**
     * Use the TinyPEN create endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the created JSON or Error
     */
    async save(data) {
        err_out._dbaction = this.URLS.CREATE
        return await fetch(this.URLS.CREATE, {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (!resp.ok) {
                    err_out.message = resp.statusText ?? `TinyPEN Create sent a bad response`
                    err_out.status = resp.status ?? 500
                    throw err_out
                }
                return resp.json()
            })
            .catch(err => {
                // Specifically account for unexpected fetch()y things. 
                if(!err?.message) err.message = err.statusText ?? `TinyPEN Create did not complete successfully`
                if(!err?.status) err.status = err.status ?? 500
                if(!err?._dbaction) err._dbaction = this.URLS.CREATE
                throw err
            })
    }

    /**
     * Use the TinyPEN update endpoint to update the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the updated JSON or Error
     */
    async update(data) {
        err_out._dbaction = this.URLS.UPDATE
        return await fetch(this.URLS.UPDATE, {
                method: 'put',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (!resp.ok) {
                    err_out.message = resp.statusText ?? `TinyPEN Update sent a bad response`
                    err_out.status = resp.status ?? 500
                    throw err_out
                }
                return resp.json()
            })
            .catch(err => {
                // Specifically account for unexpected fetch()y things. 
                if(!err?.message) err.message = err.statusText ?? `TinyPEN Update did not complete successfully`
                if(!err?.status) err.status = err.status ?? 500
                if(!err?._dbaction) err._dbaction = this.URLS.UPDATE
                throw err
            })
    }

    /**
     * Use the TinyPEN overwrite endpoint to overwrite the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the updated JSON or Error
     */
    async overwrite(data) {
        err_out._dbaction = this.URLS.OVERWRITE
        return await fetch(this.URLS.OVERWRITE, {
                method: 'put',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (!resp.ok) {
                    err_out.message = resp.statusText ?? `TinyPEN Overwrite sent a bad response`
                    err_out.status = resp.status ?? 500
                    throw err_out
                }
                return resp.json()
            })
            .catch(err => {
                // Specifically account for unexpected fetch()y things. 
                if(!err?.message) err.message = err.statusText ?? `TinyPEN Overwrite did not complete successfully`
                if(!err?.status) err.status = err.status ?? 500
                if(!err?._dbaction) err._dbaction = this.URLS.OVERWRITE
                throw err
            })
    }

    /**
     * Use the TinyPEN delete endpoint to delete the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the created JSON or Error
     */
    async remove(data) {
        err_out._dbaction = this.URLS.DELETE
        err_out.message = `Not yet implemented.  Stay tuned.`
        err_out.status = 501
        throw err_out
        // TODO
        return await fetch(this.URLS.DELETE, {
                method: 'delete',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (!resp.ok) {
                    err_out.message = resp.statusText ?? `TinyPEN DELETE sent a bad response`
                    err_out.status = resp.status ?? 500
                    throw err_out
                }
                return resp.text()
            })
            .catch(err => {
                // Specifically account for unexpected fetch()y things. 
                if(!err?.message) err.message = err.statusText ?? `TinyPEN DELETE did not complete successfully`
                if(!err?.status) err.status = err.status ?? 500
                if(!err?._dbaction) err._dbaction = this.URLS.DELETE
                throw err
            })
    }
}

export default DatabaseController
