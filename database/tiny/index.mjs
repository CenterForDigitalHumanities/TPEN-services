import fetch from 'node-fetch'

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
let storedEnv = dotenv.config()
dotenvExpand.expand(storedEnv)

export async function connected() {
    // Send a ping to confirm a successful connection
    await db.collection(process.env.TPENPROJECTS).command({ ping: 1 }).catch(err => {return false})
    return true
}

export async function create(collection, data) {
    console.log("MONGODB CREATING...")
    const result = await db.collection(collection).insertOne(data)
    console.log(result)
    data["@id"] = process.env.SERVERURL+"created/"+result.insertedId
    return data
}

export async function update(collection, query, update) {
    const result = await db.collection(collection).updateOne(query, { $set: update })
    return result
}

export async function remove(collection, id) {
    const result = await db.collection(collection).deleteOne(query, { $set: update })
    return result
}

/**
 * Get by property matches and return all objects that match
 */ 
export async function query(collection, params={"bryan_says_you_will_find":"nothing"}){
    const results = await db.collection(collection).find(params)
    return results
}