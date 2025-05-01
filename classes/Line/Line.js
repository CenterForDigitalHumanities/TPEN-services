export class Line {
    constructor(line = {}) {
        this.annotation = line
        if (!this.annotation.id) {
            this.annotation.id = Date.now().toString()
        }
    }

    static build({ id, body, target }) {
        if (!id) {
            throw new Error('Line ID is required to create a Line instance.')
        }
        return new Line({ id, body, target })
    }

    get id() {
        return this.annotation.id
    }

    set id(id) {
        this.annotation.id = id
    }

    async load() {
        // Simulate fetching line data from RERUM or temporary storage
        return this
    }

    async save() {
        // Simulate saving the line to RERUM
        return this
    }

    async update(data) {
        Object.assign(this.annotation, data)
        return this.save()
    }

    async updateText(text) {
        if (typeof text !== 'string') {
            throw new Error('Text content must be a string')
        }
        this.annotation.body = text
        return this.save()
    }

    async updateBounds(xywh) {
        if (!xywh) {
            throw new Error('Bounds (xywh) must be provided')
        }
        this.annotation.target = xywh
        return this.save()
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

    // Create a line
    create() {
        return Promise.resolve(new Line())
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

    // To get metadata only
    getMetadata() {
        return Promise.resolve('Get only metadata of the page')
    }

    // Fetch metadata only
    fetchMetadata() {
        // Calling the internal getMetadata method
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
