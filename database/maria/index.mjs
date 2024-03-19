import { default as mariadb } from 'mariadb'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

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
                database: name,
                connectionLimit: 55
            })
        }
        catch(err){
            console.error(err)
            throw new Error(`Cannot establish MariaDB client to connect to.`)
        }
        try {
            this.conn = await this.client.getConnection()
            console.log("MariaDB Connection Estabsliehd")
            console.log(process.env.MARIADB)
        } 
        catch (err) {
            this.conn = null
            console.log("MariaDB Connection Failed")
            console.log(process.env.MARIADB)
            console.error(err)
            throw err
        } 
    }

    async close() {
        await this.conn.end()
    }

    async create(table, document) {
        // TODO insert statement
        //const result = await this.conn.query(`INSERT INTO ${table} value (${document})`);
        console.log("MARIADB CREATING...")
        const result = {"hello" : "Bryan"}
        console.log(result)
        return result
    }

    async read(table, params) {
        // TODOD select statement
        //const result = await this.conn.query(`SELECT * FROM ${table} WHERE ${params}`);
        const result = {"hello" : "Bryan"}
        console.log(result)
        return result
    }

    async update(table, document, matchParams) {
        //const result = await this.conn.query(`UPDATE ${table} SET (${document}) WHERE $matchParams`);
        const result = {"hello" : "Bryan"}
        console.log(result)
        return result
    }

}

export default DatabaseController
