export class Page {
    constructor(page = {}) {
        this.page = page
        if(!this.page.id) {
            this.page.id = Date.now().toString();  // ticket to replace with MongoDB ObjectID()
        }
    }
    
    get id() {
        return this.page.id
    }

    set id(id) {
        this.page.id = id
    }


    asCanvas() {
        return {
            type: 'Annotation',
            '@context': 'http://iiif.io/api/presentation/3/context.json',
            height: this.page.height || 0,
            width: this.page.width || 0,
        };
    }

    

    create() {
        return Promise.resolve(new Page())
    }

    remove() {
        return Promise.resolve()
    }

    save() {
        return Promise.resolve()
    }

    fetch() {
        return Promise.resolve(new Page())
    }
}