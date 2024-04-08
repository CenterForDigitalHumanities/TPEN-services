export async function getUserProjects(userAgent, options) {
  try {
    // Implemented the logic to filter projects based on options  
    let projectList = [{id : "123", "title" : "MyProj"}]

    // Create Project JSON objects for each project
    return projectList
  } catch (error) {
    
    return {status : 500, message : 'Error retrieving user projects from the database',error : error.message}
  }
}
export async function responseMapping(projects){
  
  const projectList = projects.map(project => ({
    id: project.id,
    title: project.title
  }))

  return projectList

}
export async function respondWithProjects(user, options, res){
   let projects = await logic.getUserProjects(user)

  if (hasRoles !== 'ALL') {
    projects = projects.filter(project => (
      project.roles.some(role => hasRoles.includes(role))
    ))
  }
  if (exceptRoles !== 'NONE') {
    projects = projects.filter(project => {
      !project.roles.some(role => exceptRoles.includes(role))
    })
  }

  if (createdBefore === 'NOW') {
    createdBefore = Date.now()
  }
  projects = projects.filter(project => createdAfter < project.created && project.crated < createdBefore)

  if (modifiedBefore === 'NOW') {
    modifiedBefore = Date.now()
  }
  projects = projects.filter(project => modifiedAfter < project.lastModified && project.lastModified < modifiedAfter)

  if (count) {
    projects = projects.length
  } else {
    projects = projects.map(project => ({"id": project.id, "title": project.title})) 
  }
  res.status(200).send(projects)
}

