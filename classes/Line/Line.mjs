export class Line {
    constructor(line = {}) {
        this.annotation = line
        if (!this.annotation.id) {
            this.annotation.id = Date.now().toString()
        }
    }

    get id() {
        return this.annotation.id
    }

    set id(id) {
        this.annotation.id = id
    }
    embedReferencedDocuments() {
        console.log('Referenced documents embedded.')
        return Promise.resolve();
      }
  
      asJSON() {
        this.embedReferencedDocuments();
        return {
            type: 'Annotation',
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            body: this.annotation.body ?? '',
            target: this.annotation.target ?? '',
        };
    }

 // Set text content
 setTextContent(text) {
    if (typeof text !== 'string') {
        throw new Error('Text content must be a string')
    }
    this.annotation.body = text
}

    // Set image link
   setImageLink(url) {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
        throw new Error('Image link must be a valid URL')
    }
    this.annotation.target = url
}
    //create a line 
    create() {
        return Promise.resolve(new Line())
    }
    //Save the line 
    save() {
        return Promise.resolve()
    }

    // Fetch the parent Annotation Page
    getParentPage() {
        return Promise.resolve(new AnnotationPage())
    }

    // Fetch previous line
    getPreviousLine() {
        return Promise.resolve(new Line())
    }

    // Fetch next line
    getNextLine() {
        return Promise.resolve(new Line())
    }

    // Fetch parent Annotation Collection (Layer)
    getParentCollection() {
        return Promise.resolve(new AnnotationCollection())
    }

    // to get metadata only
    getMetadata() {
        return Promise.resolve('Get only metadata of the page')
    }
    //Fetch metadata only
    fetchMetadata() {
        // Calling  the internal getMetadata method
        return this.getMetadata();
    }
    asHTML() {
        return Promise.resolve('<html><body>This is the HTML document content.</body></html>')
    }

    // Update the line
    update() {
        return Promise.resolve(new Line())
    }

    // Delete the line
    delete() {
        return Promise.resolve()
    }
}