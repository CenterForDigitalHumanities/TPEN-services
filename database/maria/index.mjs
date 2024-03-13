import { default as mariadb } from 'mariadb'

class DatabaseController {
    constructor(uri, name=process.env.MONGODBNAME) {
        this.client = mariadb.createPool({
             host: process.env.MARIADB, 
             user: process.env.MARIADBUSER, 
             password: process.env.MARIADBPASSWORD,
             database: process.env.MARIADBNAME,
             connectionLimit: 55
        })
    }

    async connect() {
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

    // Project methods

}

export default DatabaseController
