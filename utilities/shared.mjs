/**
 * Check if the supplied input is valid JSON or not.
 * @param input A string or Object that should be JSON conformant.
 * @return boolean For whether or not the supplied input was JSON conformant.
 */ 
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

/**
 * Check if the supplied input is a valid integer TPEN Project ID
 * @param input A string which should be a valid Integer number
 * @return boolean For whether or not the supplied string was a valid Integer number
 */ 
export function validateID(id){
   if(!isNaN(id)){
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
}

// Send a successful response with the appropriate JSON
export function respondWithJSON(res, status, json){
   const id = manifest["@id"] ?? manifest.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.status(status)
   res.json(json)
}