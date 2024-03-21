import fetch from 'node-fetch'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

class DatabaseController{

    constructor() {
        // Establish constants
        this.URLS = {}
        this.URLS.CREATE = "https://dev.tiny.t-pen.org/createx"
        this.URLS.UPDATE = "https://dev.tiny.t-pen.org/updatex"
        this.URLS.OVERWRITE = "https://dev.tiny.t-pen.org/overwritex"
        this.URLS.QUERY = "https://dev.tiny.t-pen.org/queryx"
        this.URLS.DELETE = "https://dev.tiny.t-pen.org/deletex"
        console.log("TINY API established")
    }
    
    /** Other modules do not connect or close */
    async connect() {
        console.log("No need to connect().  The API awaits you!")
    }

    /** Other modules do not connect or close */
    async close() {
        console.log("No need to close().  The API awaits you!")
    }

    async connected() {
        // Send a /query to ping TinyPen
        const theone = await query({"_id": "11111"})
        console.log("the one")
        console.log(theone)
        return theone.length === 1
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
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.CREATE, "status":resp.status, "message": resp.statusText }
            }
        })
        .catch(err => {
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
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.CREATE, "status":resp.status, "message": resp.statusText }
            }
        })
        .catch(err => {
            return err
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
        .then(resp => {
            if(resp.ok) resp.json()
            else{
                return { "endpoint_error":this.URLS.OVERWRITE, "status":resp.status, "message": resp.statusText }
            }
        })
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
            if(!resp.ok) return { "endpoint_error":this.URLS.DELETE, "status":resp.status, "message": resp.statusText }
        })
        .catch(err => {
            console.error(err)
            throw err
        })
    }

}

export default DatabaseController