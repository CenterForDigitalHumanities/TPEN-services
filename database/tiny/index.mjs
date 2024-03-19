import fetch from 'node-fetch'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

class DatabaseController{

    constructor() {
        // Establish constants
        this.URLS = {}
        this.URLS.CREATE = "https://dev.tiny.t-pen.org/create"
        this.URLS.UPDATE = "https://dev.tiny.t-pen.org/update"
        this.URLS.OVERWRITE = "https://dev.tiny.t-pen.org/overwrite"
        this.URLS.QUERY = "https://dev.tiny.t-pen.org/query"
        this.URLS.DELETE = "https://dev.tiny.t-pen.org/delete"
    }
    
    /** Other modules do not connect or close */
    async connect() {
        // No need for this, but maybe we can stub it to be like "no no no not here good try tho"
    }

    /** Other modules do not connect or close */
    async close() {
        // No need for this, but maybe we can stub it to be like "no no no not here good try tho"
    }

    async connected() {
        // Send a /query to ping TinyPen
    }

    /**
     * Use the TinyPEN query endpoint to find JSON objects matching the supplied property values.
     * @return the found JSON as an Array or Error
     */ 
    async query(data) {
        return await fetch(this.URLS.QUERY,{
            method: 'post',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
        .then(resp => resp.json())
        .catch(err => {
            console.error(err)
            throw err
        })
    }

    /**
     * Use the TinyPEN create endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the created JSON or Error
     */ 
    async create(data) {
        return await fetch(this.URLS.CREATE,{
            method: 'post',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
        .then(resp => resp.json())
        .catch(err => {
            console.error(err)
            throw err
        })
    }

    /**
     * Use the TinyPEN update endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the updated JSON or Error
     */ 
    async update(data) {
        return await fetch(this.URLS.UPDATE,{
            method: 'put',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
        .then(resp => resp.json())
        .catch(err => {
            console.error(err)
            throw err
        })
    }

    /**
     * Use the TinyPEN overwrite endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the updated JSON or Error
     */ 
    async overwrite(data) {
        return await fetch(this.URLS.OVERWRITE,{
            method: 'put',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
        .then(resp => resp.json())
        .catch(err => {
            console.error(err)
            throw err
        })
    }

    /**
     * Use the TinyPEN delete endpoint to create the supplied JSON object.
     * TODO Pass forward the user bearer token from the Interfaced to TinyPEN?
     * @return the created JSON or Error
     */ 
    async remove(data) {
        return await fetch(this.URLS.DELETE,{
            method: 'delete',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
        .then(resp => {
            if(!resp.ok) throw new Error("Could not delete data")
        })
        .catch(err => {
            console.error(err)
            throw err
        })
    }

}

export default DatabaseController