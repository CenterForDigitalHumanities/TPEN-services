/**
 * A TinyPEN Controller.  Actions here specifically fetch to the set TinyPEN API URLS.
 * @see this.URLS
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */ 

import fetch from 'node-fetch'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

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

    /** Other modules do not connect or close */
    async connect() {
        console.log("No need to connect().  The API awaits you!")
        return
    }

    /** Other modules do not connect or close */
    async close() {
        console.log("No need to close().  The API awaits you!")
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
            const theone = await this.read({ "_id": "11111" })
            return theone.length === 1    
        } catch(err){
            console.error(err)
            return false
        }
    }

    /**
     * Use the TinyPEN query endpoint to find JSON objects matching the supplied property values.
     * @param query JSON from an HTTP POST request.  It must contain at least one property.
     * @return the found JSON as an Array or Error
     */
    async read(query) {
        return await fetch(this.URLS.QUERY, {
                method: 'post',
                body: JSON.stringify(query),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (resp.ok) return resp.json()
                else {
                    console.error(`${resp.status} - ${resp.statusText}`)
                    return { "endpoint_error": this.URLS.QUERY, "status": resp.status, "message": resp.statusText }
                }
            })
            .catch(err => {
                console.error(err)
                return { "endpoint_error": this.URLS.QUERY, "status": 500, "message": "There was an error querying through TinyPen" }
            })
    }

    /**
     * Use the TinyPEN create endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the created JSON or Error
     */
    async create(data) {
        return await fetch(this.URLS.CREATE, {
                method: 'post',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (resp.ok) return resp.json()
                else {
                    console.error(`${resp.status} - ${resp.statusText}`)
                    return { "endpoint_error": this.URLS.CREATE, "status": resp.status, "message": resp.statusText }
                }
            })
            .catch(err => {
                console.error(err)
                return { "endpoint_error": this.URLS.CREATE, "status": 500, "message": "There was an error creating through TinyPen" }
            })
    }

    /**
     * Use the TinyPEN update endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the updated JSON or Error
     */
    async update(data) {
        return await fetch(this.URLS.UPDATE, {
                method: 'put',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (resp.ok) return resp.json()
                else {
                    console.error(`${resp.status} - ${resp.statusText}`)
                    return { "endpoint_error": this.URLS.UPDATE, "status": resp.status, "message": resp.statusText }
                }
            })
            .catch(err => {
                console.error(err)
                return { "endpoint_error": this.URLS.UPDATE, "status": 500, "message": "There was an error updating through TinyPen" }
            })
    }

    /**
     * Use the TinyPEN overwrite endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the updated JSON or Error
     */
    async overwrite(data) {
        return await fetch(this.URLS.OVERWRITE, {
                method: 'put',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (resp.ok) return resp.json()
                else {
                    console.error(`${resp.status} - ${resp.statusText}`)
                    return { "endpoint_error": this.URLS.OVERWRITE, "status": resp.status, "message": resp.statusText }
                }
            })
            .catch(err => {
                console.error(err)
                return { "endpoint_error": this.URLS.OVERWRITE, "status": 500, "message": "There was an error overwriting through TinyPen" }
            })
    }

    /**
     * Use the TinyPEN delete endpoint to delete the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the created JSON or Error
     */
    async remove(data) {
        return { "endpoint_error": "deleteOne", "status": 501, "message": `Not yet implemented.  Stay tuned.` }
        return await fetch(this.URLS.DELETE, {
                method: 'delete',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                }
            })
            .then(resp => {
                if (!resp.ok) {
                    console.error(`${resp.status} - ${resp.statusText}`)
                    return { "endpoint_error": this.URLS.DELETE, "status": resp.status, "message": resp.statusText }
                }
            })
            .catch(err => {
                console.error(err)
                return { "endpoint_error": this.URLS.DELETE, "status": 500, "message": "There was an error deleting through TinyPen" }
            })
    }
}

export default DatabaseController