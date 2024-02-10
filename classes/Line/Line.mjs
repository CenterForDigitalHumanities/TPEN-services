export class Line {
    constructor(line = {}) {
        this.annotation = line
        if(!this.annotation.id) {
            this.annotation.id = Date.now() // ticket to replace with MongoDB ObjectID()
        }
    }
    
    get id() {
        return this.annotation.id
    }

    set id(id) {
        this.annotation.id = id
    }
}
