/** Logic for the /projects endpoint */

// Mock projects list for now
// User -1 for failure, 404 for none found, other for success
class User {
  constructor(id = -1) {
    this.id = id
  }
  getProjects() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        switch (this.id) {
          case -1: return reject()
          case 404: return resolve([])
          default: return resolve([{
            "id": "#ProjectId",
            "title": "ProjectTitle",
            "creator": this.id,
            "group": "#GroupId",
            "layers": [
              "#LayerId"
            ],
            "created": 1,
            "lastModified": "#PageId",
            "viewer": "https://static.t-pen.org/#ProjectId",
            "license": "CC-BY",
            "manifest": "https://example.com/manifest.json",
            "tools": [],
            "options": {}
          }])
        }
      }, 1500)
    })
  }
}

export async function getUserProjects(user) {
  const u = new User(user)
  const projects = await u.getProjects()
  return projects
}
