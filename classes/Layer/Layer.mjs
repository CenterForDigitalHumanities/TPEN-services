export class Layer {
    constructor(layer = {}) {
        this.layer = layer
        if(!this.layer.id) {
            this.layer.id = Date.now() // ticket to replace with MongoDB ObjectID()
        }
    }
    
    get id() {
        return this.layer.id
    }

    set id(id) {
        this.layer.id = id
    }

    asJSON() {
        return {
            type: 'Range',
            '@context': 'https://iiif.io/api/presentation/3.0/',
            items: this.layer.body ?? [],
            target: this.layer.target ?? '',
        }
    }

    create() {
        return Promise.resolve(new Layer())
    }

    delete() {
        return Promise.resolve()
    }

    save() {
        return Promise.resolve()
    }

    fetch() {
        return Promise.resolve(new Layer())
    }

    getPages() {
        return Promise.resolve('Array of Page objects')
    }

    getLines() {
        return Promise.resolve('Array of Line objects in all pages')
    }

    getImageLinks() {
        return Promise.resolve('Array of image links in all pages')
    }

    getTextBlob() {
        return Promise.resolve('Text contents of pages')
    }

    fetchHTMLDocuments() {
        return Promise.resolve('HTML documents of pages')
    }

    // Method to add a page to the layer
    addPage(page) {
        return Promise.resolve()
    }
}
