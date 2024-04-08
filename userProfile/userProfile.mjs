
import DatabaseDriver from "../database/driver.mjs"

// This module will use the TinyPEN API (RERUM Mongo DB)
const database = new DatabaseDriver("mongo")

export async function findUserById(id = null) {
  try {
    
        let userProfile  = await database.find({ id: id })
      // Needed to be getting from DB as above, but now as we dont have DB connection , just mocking as below
      if(userProfile)
      {
        userProfile = {
        id: id,
        orchid_id: "0000-0000-3245-1188", // Dummy orchid ID
        display_name: "Samply McSampleface" // Dummy display name
        };
      }
      // adding special cases to test the error response
      if(id === 111 || id === 222)
      {
        throw new Error("Internal Server Error");
      }


      return mapUserProfile(userProfile);
  } catch (error) {
    return { status: 500, userId: id, error: error.message, stack: error.stack }
  }
}

function mapUserProfile(userProfile) {
  if (!userProfile || !userProfile.id) {
    return null
  }
  const userProjects = getProjects();
  const publicProjectLinks = userProjects.map(project => `https://api.t-pen.org/project/${project.id}?view=html`);
  return {
    url: `https://store.rerum.io/v1/id/${userProfile.id}`,
    number_of_projects: userProjects.length,
    public_projects: publicProjectLinks,
    profile: {
      "https://orchid.id" : userProfile.orchid_id,
      "display_name" : userProfile.display_name
    }
  };
}


 function getProjects(options= null) 
 {
  
  if(options)
  {
    // This is a mock usally i  need to rtetrive projects from the bellow call
    //return getUserProjects(options);
  }
  else
  {
    // This is a mock usally i  need to rtetrive projects from the bellow call
    //return getUserProjects(options);
  }

  return [ { id: "32333435363738", title: "My Project 1"} , { id: "98979695949392", title: "My Project 2"} ]
 }


