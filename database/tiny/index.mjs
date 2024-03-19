import fetch from 'node-fetch'

class DatabaseController{

    constructor() {
        // Establish constants
        
    }
    
    /** Other modules do not connect or close */
    async function connect() {
        // No need for this, but maybe we can stub it to be like "no no no not here good try tho"
    }

    /** Other modules do not connect or close */
    async close() {
        // No need for this, but maybe we can stub it to be like "no no no not here good try tho"
    }

    async connected() {
        // Send a /query to ping TinyPen
    }

    async create(collection, data) {
        // tinypen/create
    }

    async update(collection, query, update) {
        // tinypen/update
    }

    async remove(collection, id) {
        // tinypen/delete
    }

    /**
     * Get by property matches and return all objects that match
     */ 
    async query(collection, params={"bryan_says_you_will_find":"nothing"}){
        // tinypen/query
    }   

}