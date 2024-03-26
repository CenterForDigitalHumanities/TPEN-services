import { findLineById } from '../line.mjs'
import { validateID } from '../../utilities/shared.mjs'

describe('Line endpoint functionality unit test', () => {
  describe('findLineById function', () => {
    it('should return null if no ID provided', async () => {
      const line = await findLineById()
      expect(line).toBeNull()
    })

    it('should return null for non-existing ID', async () => {
      const line = await findLineById(-111)
      expect(line).toBeNull()
    })

    it('should return a valid line object for existing ID', async () => {
      const line = await findLineById(123)
      expect(line).not.toBeNull()
    })

    it('should return blob content for ?text=blob', async () => {
      const options = { text: 'blob' }
      const lineBlob = await findLineById(123, options)
      expect(lineBlob).toBeDefined()
      expect(lineBlob.text).toBeDefined()
    })

    it('should return full page URL for ?image=full', async () => {
      const options = { image: 'full' }
      const lineFullImage = await findLineById(123, options)
      expect(lineFullImage).toBeDefined()
      expect(lineFullImage.image).toBeDefined()
    })

    it('should return line image fragment URL for ?image=line', async () => {
      const options = { image: 'line' }
      const lineLineImage = await findLineById(123, options)
      expect(lineLineImage).toBeDefined()
      expect(lineLineImage.image).toBeDefined()
    })

    it('should return project document for ?lookup=project', async () => {
      const options = { lookup: 'project' }
      const lineLookupProject = await findLineById(123, options)
      expect(lineLookupProject).toBeDefined()
    })

    it('should return XML representation for ?view=xml', async () => {
      const options = { view: 'xml' }
      const lineXML = await findLineById(123, options)
      expect(lineXML).toBeDefined()
    })

    it('should return HTML viewer document for ?view=html', async () => {
      const options = { view: 'html' }
      const lineHTML = await findLineById(123, options)
      expect(lineHTML).toBeDefined()
    })

    it('should return expanded document for ?embed=true', async () => {
      const options = { embed: true }
      const lineEmbedded = await findLineById(123, options)
      expect(lineEmbedded).toBeDefined()
    })
  })

  it('No TPEN3 line ID provided. Line ID validation must be false.', () => {
    expect(validateID()).toBe(false)
  })

  it('Detect TPEN3 line does not exist. The query for a TPEN3 line must be null.', async () => {
    const line = await findLineById(-111)
    expect(line).toBe(null)
  })

  it('TPEN3 line does exist. Finding the line results in the line JSON', async () => {
    const line = await findLineById(123)
    expect(line).not.toBe(null)
    expect(line.id).toBe(123)
    expect(line.text).toBe('Hey TPEN Works on 123')
  })
})
