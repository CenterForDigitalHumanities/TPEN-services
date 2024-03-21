import fetch from 'node-fetch'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

class DatabaseController{

    /** Basic constructor to establish constant class properties */ 
    constructor() {
        this.URLS = {}
        this.URLS.CREATE = "https://dev.tiny.t-pen.org/create"
        this.URLS.UPDATE = "https://dev.tiny.t-pen.org/update"
        this.URLS.OVERWRITE = "https://dev.tiny.t-pen.org/overwrite"
        this.URLS.QUERY = "https://dev.tiny.t-pen.org/query"
        this.URLS.DELETE = "https://dev.tiny.t-pen.org/delete"
        console.log("TINY API established")
        console.log(this.URLS)
    }
    
    /** Other modules do not connect or close */
    async connect() {
        console.log("No need to connect().  The API awaits you!")
    }

    /** Other modules do not connect or close */
    async close() {
        console.log("No need to close().  The API awaits you!")
    }

    /** 
     * Generally check that the TinyPEN API is running.
     * Perform a query for an object we know is there.
     * @return boolean
     * */
    async connected() {
        // Send a /query to ping TinyPen
        const theone = await query({"_id": "11111"})
        console.log("the one")
        console.log(theone)
        return theone.length === 1
    }

    /**
     * Use the TinyPEN query endpoint to find JSON objects matching the supplied property values.
     * @param query JSON from an HTTP POST request.  It must contain at least one property.
     * @return the found JSON as an Array or Error
     */ 
    async read(query) {
        return await fetch(this.URLS.QUERY,{
            method: 'post',
            body: JSON.stringify(query),
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.QUERY, "status":resp.status, "message": resp.statusText }
            }
        })
        .catch(err => {
            return { "endpoint_error":this.URLS.QUERY, "status":500, "message": "There was an error querying through TinyPen" }
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
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.CREATE, "status":resp.status, "message": resp.statusText }
            }
        })
        .catch(err => {
            return { "endpoint_error":this.URLS.CREATE, "status":500, "message": "There was an error creating through TinyPen" }
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
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.UPDATE, "status":resp.status, "message": resp.statusText }
            }
        })
        .catch(err => {
            return { "endpoint_error":this.URLS.UPDATE, "status":500, "message": "There was an error updating through TinyPen" }
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
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.OVERWRITE, "status":resp.status, "message": resp.statusText }
            }
        })
        .catch(err => {
            return { "endpoint_error":this.URLS.OVERWRITE, "status":500, "message": "There was an error overwriting through TinyPen" }
        })
    }

    /**
     * Use the TinyPEN delete endpoint to delete the supplied JSON object.
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
            if(!resp.ok) return { "endpoint_error":this.URLS.DELETE, "status":resp.status, "message": resp.statusText }
        })
        .catch(err => {
            return { "endpoint_error":this.URLS.DELETE, "status":500, "message": "There was an error deleting through TinyPen" }
        })
    }
}

export default DatabaseController