import * as utils from '../utilities/shared.mjs'
import dbController from 'path_to_db_controller' // will update the db path once the pull request of db controller is accepted

// To fetch projects based on user ID
export const getUserProjects = async (userId) => {
  try {
  // dbController to fetch projects
    const projects = await dbController.getUserProjects(userId)
    return projects
  } catch (error) {
    console.error(error)
    throw new Error('Error fetching user projects')
  }
}
export async function findLineById(id = null) {
  let line = null
  if (!utils.validateID(id)) {
    return line
  }
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Mocking the data for lines
  const linesArray = [
    { id: 123, text: "Hey TPEN Works on 123" },
  ]
  line = linesArray.find((line) => line.id === id) || null

  return line
}
