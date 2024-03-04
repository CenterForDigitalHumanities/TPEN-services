export const db = {
    getByID: (id) => {
      if (id === 123) { 
        return {
          id: id,
          '@context': 'http://t-pen.org/3/context.json',
          '@type': 'Annotation',
          creator: 'https://store.rerum.io/v1/id/hash',
          textualBody: `content of annotation for ID ${id}`,
          project: '#ProjectId',
          canvas: 'https://example.com/canvas.json',
          layer: '#AnnotationCollectionId',
          viewer: `https://static.t-pen.org/#ProjectId/#PageId/#LineId-${id}`,
          license: 'CC-BY'
        }
      } else {
        return null
      }
    },
  
  
    find: (query) => {
      return [
        {
          id: 1,
          '@context': 'http://t-pen.org/3/context.json',
          '@type': 'Annotation',
          creator: 'https://store.rerum.io/v1/id/hash',
          textualBody: 'content of annotation',
          project: '#ProjectId',
          canvas: 'https://example.com/canvas.json',
          layer: '#AnnotationCollectionId',
          viewer: 'https://static.t-pen.org/#ProjectId/#PageId/#LineId-1',
          license: 'CC-BY'
        },
      ]
    },
  }