import { findLineById } from '../line.mjs'
import { validateID } from '../../utilities/shared.mjs'

describe('Line endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
  it('No TPEN3 line ID provided. Line ID validation must be false.', () => {
    expect(validateID()).toBe(false)
  });

  it('findLineById should return null for non-existing ID', async () => {
    const line = await findLineById(-111)
    expect(line).toBe(null)
  });

  it('findLineById should return a valid line object for existing ID', async () => {
    const line = await findLineById(123)
    expect(line).not.toBeNull()
    expect(line).toHaveProperty('id', 123)
    expect(line).toHaveProperty('@context', 'http://t-pen.org/3/context.json')
    expect(line).toHaveProperty('@type', 'Annotation')
    expect(line).toHaveProperty('creator', 'https://store.rerum.io/v1/id/hash')
    expect(line).toHaveProperty('textualBody')
    expect(line).toHaveProperty('project', '#ProjectId')
    expect(line).toHaveProperty('canvas', 'https://example.com/canvas.json')
    expect(line).toHaveProperty('layer', '#AnnotationCollectionId')
    expect(line).toHaveProperty('viewer', `https://static.t-pen.org/#ProjectId/#PageId/#LineId-123`)
    expect(line).toHaveProperty('license', 'CC-BY')
  })

  it('findLineById with ?text=blob should return blob content', async () => {
    const options = { text: 'blob' }
    const lineBlob = await findLineById(123, options)
    expect(lineBlob).toBeDefined()
  })

  it('findLineById with ?image=full should return full page URL', async () => {
    const options = { image: 'full' }
    const lineFullImage = await findLineById(123, options)
    expect(lineFullImage).toBeDefined()
  })
  it('findLineById with ?image=line should return line image fragment URL', async () => {
    const options = { image: 'line' }
    const lineLineImage = await findLineById(123, options)
    expect(lineLineImage).toBeDefined()
  })
  it('findLineById with ?lookup=project should return related project document', async () => {
    const options = { lookup: 'project' }
    const lineLookupProject = await findLineById(123, options)
    expect(lineLookupProject).toBeDefined()
  })
  it('findLineById with unsupported combination should return an error', async () => {
    const options = { view: 'html', embed: true }
    try {
      await findLineById(123, options)
    } catch (error) {
      expect(error).toBeDefined()
      expect(error.message).toBe('Invalid combination of parameters')
    }
  })
})