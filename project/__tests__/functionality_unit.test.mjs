import * as logic from '../project.mjs'
<<<<<<< HEAD

=======
import {validateID} from '../../utilities/shared.mjs'

let test_project = { "type": "Project", "title": "test project" }

// These test the pieces of functionality in the route that make it work.
>>>>>>> 4d18bbd4a8b898df58e3faaf86eddddb139ced9e
describe('Project endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
  it('Detect TPEN3 project does not exist.  The query for a TPEN3 project must be null.', async () => {
    const project = await logic.findTheProjectByID(-111)
<<<<<<< HEAD
    expect(project).not.toBe(null)
  })
  it('TPEN3 project does exist.  Finding the project results in the project JSON', async () => {
    let project = await logic.findTheProjectByID(7085)
    expect(project).not.toBe(null)
  })
  it('checking the project', async () => {
    const projectId = "abcdefg111222333"
    let project = await logic.findTheProjectByID(projectId)
    expect(project).not.toBe(null)
  })
  it('should generate an annotation collection object with correct properties', () => {
    const label = 'Test Annotation Collection'
    const creator = 'Test Creator'
    const items = [
      {
        id: 'annotation1',
        target: 'http://example.com/target1',
        items: [{ body: 'Body 1', target: 'http://example.com/target1' }],
      },
      {
        id: 'annotation2',
        target: 'http://example.com/target2',
        items: [{ body: 'Body 2', target: 'http://example.com/target2' }],
      },
    ]
    const annotationCollection = logic.AnnotationCollectionFactory(label, creator, items)
    expect(annotationCollection).toBeTruthy()
  })
  it('Saving an annotation collection', async () => {
    const annotationCollection = {
      label: 'Test Label',
      creator: 'Test Creator',
      items: []
    }
    const savedAnnotationCollection = await logic.saveAnnotationCollection(annotationCollection)
    expect(savedAnnotationCollection).toBeTruthy()
  })
  it('Updating project layers', async () => {
    const project = {
      layers: []
    }
    const annotationCollectionId = 'validAnnotationCollectionId'
    await logic.updateProjectLayers(project, annotationCollectionId)
    expect(project.layers).toContain(annotationCollectionId)
  })
})
=======
    expect(project).toBe(null)
  })
  it('TPEN3 project does exist.  Finding the project results in the project JSON', async () => {
    let project = await logic.findTheProjectByID(7085)
    expect(project).not.toBe(null)
  })

  it('Saves a project to the database', async () => {
    test_project = await logic.saveProject(test_project)
    expect(test_project["_id"]).toBeTruthy()
  })
})
>>>>>>> 4d18bbd4a8b898df58e3faaf86eddddb139ced9e
