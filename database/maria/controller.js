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

class DatabaseController {
    constructor(connect=false) {
        // try to establish the client and connect
        if(connect) this.connect()
    }

    async connect() {
        try{
            this.client = mariadb.createPool({
                host: process.env.MARIADB, 
                user: process.env.MARIADBUSER, 
                password: process.env.MARIADBPASSWORD,
                database: process.env.MARIADBNAME,
                connectionLimit: 55
            })
        }
        catch(err){
            console.error(err)
            throw new Error(`Cannot establish MariaDB client to connect to.`)
        }
        try {
            this.conn = await this.client.getConnection()
            console.log("MariaDB Connection Established")
            console.log(process.env.MARIADB)
            return
        } 
        catch (err) {
            this.conn = null
            console.error("MariaDB Connection Failed")
            console.error(process.env.MARIADB)
            console.error(err)
            throw err
        } 
    }

    async close() {
        await this.conn.end()
        return
    }

    async create(table, document) {
        // TODO insert statement
        //const result = await this.conn.query(`INSERT INTO ${table} value (${document})`)
        const result = {"hello" : "Bryan"}
        return result
    }

    async read(table, params) {
        // TODOD select statement
        //const result = await this.conn.query(`SELECT * FROM ${table} WHERE ${params}`)
        const result = {"hello" : "Bryan"}
        return result
    }

    async update(table, document, matchParams) {
        // TODO update statement
        //const result = await this.conn.query(`UPDATE ${table} SET (${document}) WHERE $matchParams`)
        const result = {"hello" : "Bryan"}
        return result
    }

    async remove(table, matchParams) {
        // TODO update statement
        //const result = await this.conn.query(`UPDATE ${table} SET (${document}) WHERE $matchParams`)
        const result = {"ok" : "deleted"}
        return result
    }

    async reserveId(seed) { return seed }
}

export default DatabaseController
