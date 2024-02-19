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
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            items: this.layer.body || [],
            target: this.layer.target || '',
        }
    }

    create() {
        return Promise.resolve(new Layer())
    }

    remove() {
        return Promise.resolve()
    }

    save() {
        return Promise.resolve()
    }

    fetch() {
        return Promise.resolve(new Layer())
    }
}
