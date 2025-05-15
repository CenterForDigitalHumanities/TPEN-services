/**
 * A MariaDB Controller.  Actions here specifically interact with the set MariaDB Database.
 * @see env.MARIADB
 * 
 * @author Bryan Haberberger
 * https://github.com/thehabes 
 */ 

import mariadb from 'mariadb'
import dotenv from 'dotenv'
let storedEnv = dotenv.config()

// Singleton pattern for MariaDB pool and connection
let sharedClient = null
let sharedConn = null

class DatabaseController {
    constructor(connect=false) {
        if(connect) this.connect()
    }

    async connect() {
        if (!sharedClient) {
            sharedClient = mariadb.createPool({
                host: process.env.MARIADB, 
                user: process.env.MARIADBUSER, 
                password: process.env.MARIADBPASSWORD,
                database: process.env.MARIADBNAME,
                connectionLimit: 55
            })
        }
        if (!sharedConn) {
            try {
                sharedConn = await sharedClient.getConnection()
                console.log("MariaDB Connection Established")
                console.log(process.env.MARIADB)
            } catch (err) {
                sharedConn = null
                console.error("MariaDB Connection Failed")
                console.error(process.env.MARIADB)
                console.error(err)
                throw err
            }
        }
        this.client = sharedClient
        this.conn = sharedConn
        return
    }

    async close() {
        if (sharedConn) {
            await sharedConn.end()
            sharedConn = null
            console.log("MariaDB Connection Closed")
        }
        return
    }

    async create(table, document) {
        // ...implementation or stub...
        const result = { hello: "Bryan" }
        return result
    }

    async read(table, params) {
        // ...implementation or stub...
        const result = { hello: "Bryan" }
        return result
    }

    async update(table, document, matchParams) {
        // ...implementation or stub...
        const result = { hello: "Bryan" }
        return result
    }

    async remove(table, matchParams) {
        // ...implementation or stub...
        const result = { ok: "deleted" }
        return result
    }

    async reserveId(seed) { return seed }
}

export default DatabaseController
