import { findLineById } from '../line.mjs'
import { validateID } from '../../utilities/shared.mjs'

describe('Line endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
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