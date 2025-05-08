import Project from "../classes/Project/Project.js"
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
export function validateID(id, type="mongo"){
   if(type == "mongo"){
      return new DatabaseController().isValidId(id)
   }else{
      if(!isNaN(id)){
      try{
         id = parseInt(id)
         return true   
      }
      catch(no){}
   } 
   return false 
   }
  
}

// Send a failure response with the proper code and message
export function respondWithError(res, status, message ){
   res.status(status).json({message})
}

// Send a successful response with the appropriate JSON
export function respondWithJSON(res, status, json){
   const id = manifest["@id"] ?? manifest.id ?? null
   res.set("Content-Type", "application/json; charset=utf-8")
   res.status(status)
   res.json(json)
}

// Log modifications for recent changes
export async function recordModification(res) {
    const { projectId, pageId } = req.params
    const userId = req.user?.id ?? null

    if (!projectId || !pageId) {
      // silent failure of logging
      return
      }

      try {
      const project = await getProjectById(projectId)
      // set _lastModified for the Project for "recent project"
            const { id: pageId, partOf: projectId = this.partOf } = this
            database.
                .collection(process.env.TPENPROJECTS)
                .updateOne(
                    { _id: projectId },
                    {
                        $set: {
                            _lastModified: pageId,
                            _modifiedAt: new Date()
                        }
                    }
                )

            if (userId) {
                await databaseMongo.controller.db
                    .collection(process.env.TPENUSERS)
                    .updateOne(
                        { _id: userId },
                        {
                            $set: {
                                _lastModified: pageId,
                                _modifiedAt: new Date()
                            }
                        }
                    )
            }
        } catch (err) {
            console.error("recordModification failed", err)
        }
    }
