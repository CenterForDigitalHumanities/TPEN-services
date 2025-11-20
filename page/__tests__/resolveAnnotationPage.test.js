import { jest } from '@jest/globals'
import { resolveAnnotationPage } from '../resolveAnnotationPage.js'

const ORIGINAL_FETCH = global.fetch

describe('resolveAnnotationPage', () => {
  beforeEach(() => {
    process.env.RERUMIDPREFIX = 'https://devstore.rerum.io/v1/id/'
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'https://devstore.rerum.io/v1/id/anno1',
        type: 'Annotation',
        body: [{ type: 'TextualBody', value: 'hello' }]
      })
    }))
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.fetch = ORIGINAL_FETCH
  })

  it('embeds remote annotations referenced in items', async () => {
    const page = {
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      id: 'https://devstore.rerum.io/v1/id/page1',
      type: 'AnnotationPage',
      items: [{ id: 'https://devstore.rerum.io/v1/id/anno1', type: 'Annotation' }],
      partOf: []
    }

    const resolved = await resolveAnnotationPage(page)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(resolved.items[0].body[0].value).toBe('hello')
  })

  it('throws when a referenced resource cannot be resolved', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 404 }))
    const page = {
      '@context': 'http://www.w3.org/ns/anno.jsonld',
      id: 'https://devstore.rerum.io/v1/id/page1',
      type: 'AnnotationPage',
      items: [{ id: 'https://devstore.rerum.io/v1/id/anno1', type: 'Annotation' }],
      partOf: []
    }

    await expect(resolveAnnotationPage(page)).rejects.toThrow('Failed to resolve resource')
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
