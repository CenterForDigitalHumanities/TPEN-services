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

    // Method to represent the page as a canvas with annotation page layer
    asCanvas() {
        return {
            type: 'Canvas',
            '@context': 'http://iiif.io/api/presentation/3/context.json',
            id:this.page.id ?? 0,
            height: this.page.height ?? 0,
            width: this.page.width ?? 0,
            label: this.page.label ?? '',
            summary: this.page.summary ?? '',
            thumbnail: this.page.thumbnail ?? '',
            navDate:this.page.navDate ?? '',
            placeHolderCanvas:this.page.placeHolderCanvas ?? '',
            accompanyingCanvas:this.accompanyingCanvas ?? '',
            duration:this.duration ?? '',
            start:this.start ?? '',
            rendering:this.rendering ?? '',
            items:this.items ?? [],
        };
    }

    // Method to create a new page
    create() {
        return Promise.resolve(new Page())
    }

    // Method to remove a page
    remove() {
        return Promise.resolve()
    }
    
    // Method to save changes to a page
    save() {
        return Promise.resolve()
    }
    
    // Method to fetch a page
    fetch() {
        return Promise.resolve(new Page())
    }

    // Method to add membership reference to manifest
    addMembershipToManifest() {
        return Promise.resolve()
    }

    // Method to get the previous page
    getPreviousPage() {
        return Promise.resolve(new Page())
    }

    // Method to get the next page
    getNextPage() {
        return Promise.resolve(new Page())
    }


    // Method to handle text blob
    handleTextBlob(blob) {
        return Promise.resolve('Text blob handled')
    }

    // Method to handle image annotation
    handleImageAnnotation(url) {
        return Promise.resolve('image annotation handled')
    }

    // Method to get parent page
    getParentPage() {
        return Promise.resolve('Parent page retrieved')
    }

    // Method to get sibling pages
    getSiblingPages() {
        return Promise.resolve('sibling pages retrieved')
    }

    // Method to get children pages
    getChildrenPages() {
        return Promise.resolve('children pages retrieved')
    }

    // Method to get project
    getProject() {
        return Promise.resolve('Project retrieved')
    }

    // Method to get parent/sibling/children/project information
    getPageInfo(type) {
        switch(type) {
            case 'parent':
                return Promise.resolve('Parent page information retrieved')
            case 'siblings':
                return Promise.resolve('Sibling pages information retrieved')
            case 'children':
                return Promise.resolve('Children pages information retrieved')
            case 'project':
                return Promise.resolve('Project information retrieved')
            default:
                throw new Error('Invalid type specified. Valid types are: parent, siblings, children, project');
        }
    }

    // Method to embed referenced documents
    embedDocuments() {
        return Promise.resolve('Documents embedded')
    }

    // Method to retrieve metadata only
    getMetadata() {
        return Promise.resolve('Metadata of the page');
    }

    // Method to retrieve HTML document
    getHTMLDocument() {
        return Promise.resolve('<html><head><title>Page HTML Document</title></head><body><h1>Hello, World!</h1></body></html>');
    }

}