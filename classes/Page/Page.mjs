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
            //label: this.page.label ?? '',
            //summary: this.page.summary ?? '',
            //thumbnail: this.page.thumbnail ?? '',
            //navDate:this.page.navDate ?? '',
            //placeHolderCanvas:this.page.placeHolderCanvas ?? '',
            //accompanyingCanvas:this.accompanyingCanvas ?? '',
            //duration:this.duration ?? '',
            //start:this.start ?? '',
            //rendering:this.rendering ?? '',
            //items:this.items ?? [],
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
    addMembershipToManifest(manifest) {
    // Assuming manifest is a reference to the Manifest container object
    // Add the current page to the manifest's membership reference
    manifest.addPageMembership(this.page);
    
    // Return a promise indicating that the operation is complete
    return Promise.resolve();
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
    handleTextBlob(lines) {
    // Assuming lines is an array of Line objects
    // If you want to return a continuous concatenated string
    const continuousText = lines.map(line => line.body).join('');
    // If you want to return an array of Line.body strings
    const lineBodies = lines.map(line => line.body);
    // Depending on your desired behavior, you can choose which one to return
    return Promise.resolve(continuousText);
    // Or return Promise.resolve(lineBodies);
    }

    // Method to handle image annotation
    // Method to handle image annotation
    handleImageAnnotation(url) {
    // Assuming url is the URL of the image being annotated
    // Here you would process the annotation and determine how to handle it
    // For now, let's just return the URL as it is
    return Promise.resolve(url);
    }

    // Method to get sibling pages
    getSiblingPages() {
        return Promise.resolve('sibling pages retrieved')
    }


    // Method to get project
    getProject() {
        return Promise.resolve('Project retrieved')
    }

    // Method to get parent/sibling/children/project information
    getPageInfo(type) {
        switch(type) {
            case 'siblings':
                return Promise.resolve('Sibling pages information retrieved')
            case 'project':
                return Promise.resolve('Project information retrieved')
            default:
                throw new Error('Invalid type specified. Valid types are: parent, siblings, children, project');
        }
    }



    // Method to retrieve metadata only
    getMetadata() {
        return Promise.resolve('Metadata of the page');
    }

    // Method to retrieve as HTML document
    asHTML() {
        return Promise.resolve('<html><body>This is the HTML document content.</body></html>')
    }

}