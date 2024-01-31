
// This function is an internal util, but we may want to test it in tests so we export it here for now.
export function isValidJSON(input=""){
   if(input){
      try{
         const json = (typeof input === "string") ? JSON.parse(input) : JSON.parse(JSON.stringify(input))
         return true
      }  
      catch(no){} 
   }
   return false
}

export function validateProjectID(id){
   if(id){
      try{
         id = parseInt(id)
         return true   
      }
      catch(no){}
   } 
   return false
}

// Send a failure response with the proper code and message
export function respondWithError(res, status, message ){
   res.status(status).send(message)
   res.end()
}

// Send a successful response with the appropriate JSON
export function respondWithJSON(res, status, json){
   const id = manifest["@id"] ?? manifest.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.status(status)
   res.json(json)
   res.end()
}