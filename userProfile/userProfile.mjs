import DatabaseDriver from "../database/driver.mjs"

/**
Represents a database driver for the TPEN MongoDB database.
This driver interacts with the private TPEN Mongo Database (users collection).
*/
//const database = new DatabaseDriver("mongo")

/**
 * Retrieves a user profile by ID.
 * 
 * @param {string|null} id - The ID of the user profile to retrieve.
 * @returns {Object} The retrieved user profile object.
 * @throws {Error} If the user profile is not found.
 */
export async function findUserById(id = null) {
  // Mocking user object directly instead of fetching from the database
  if (id === 111 || id === 222) {
    throw new Error("Internal Server Error");
  }
  const userProfile = {
    id: id,
    orchid_id: "0000-0000-3245-1188", // Dummy orchid ID
    display_name: "Samply McSampleface" // Dummy display name
  };
  return mapUserProfile(userProfile);
}
/**
 * Maps a user profile object to a standardized format.
 * 
 * @param {Object} userProfile - The user profile object to be mapped.
 * @returns {Object} The mapped user profile object.
 */
function mapUserProfile(userProfile) {
  if (!userProfile || !userProfile.id) {
    return null
  }
  const userProjects = getProjects()
  const publicProjectLinks = userProjects.map(project => `https://api.t-pen.org/project/${project.id}?view=html`)
  return {
    url: `https://store.rerum.io/v1/id/${userProfile.id}`,
    number_of_projects: userProjects.length,
    public_projects: publicProjectLinks,
    profile: {
      "https://orchid.id" : userProfile.orchid_id,
      "display_name" : userProfile.display_name
    }
  }
}

/**
 * Retrieves user projects based on specified options.
 * 
 * @param {Object} options - The options for filtering user projects (optional).
 * @returns {Array} An array of user projects.
 */
 function getProjects(options= null) 
 {
  
  if(options)
  {
    // This is a mock usally i  need to rtetrive projects from the bellow call
    //return getUserProjects(options)
  }
  else
  {
    // This is a mock usally i  need to rtetrive projects from the bellow call
    //return getUserProjects(options)
  }

  return [ { id: "32333435363738", title: "My Project 1"} , { id: "98979695949392", title: "My Project 2"} ]
 }


