export class Page {
    constructor(page = {}) {
        this.page = page
        if(!this.page.id) {
            this.page.id = Date.now() // ticket to replace with MongoDB ObjectID()
        }
    }
    
    get id() {
        return this.page.id
    }

    set id(id) {
        this.page.id = id
    }
}
