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
}
