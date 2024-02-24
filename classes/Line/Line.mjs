export class Line {
    constructor(line = {}) {
        this.annotation = line;
        if (!this.annotation.id) {
            this.annotation.id = Date.now().toString(); 
        }
    }

    get id() {
        return this.annotation.id;
    }

    set id(id) {
        this.annotation.id = id;
    }

    asJSON() {
        return {
            type: 'Annotation',
            '@context': 'http://www.w3.org/ns/anno.jsonld',
            body: this.annotation.body ?? '',
            target: this.annotation.target ?? '',
        };
    }

    create() {
        return Promise.resolve(new Line());
    }

    delete() {
        return Promise.resolve();
    }

    save() {
        return Promise.resolve();
    }

    fetch() {
        return Promise.resolve(new Line());
    }
}