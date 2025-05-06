import vault from "../../utilities/vault.js"

class Manifest {

    manifest = null
    uri = null

    constructor(manifestOrUri) {

        if (typeof manifestOrUri !== 'string' && typeof manifestOrUri !== 'object') {
            throw new Error('Invalid input: must be a manifest object or a URI string')
        }
        let id = manifestOrUri['@id'] ?? manifestOrUri.id ?? manifestOrUri

        if (!id) {
            throw new Error('Invalid input: manifest object must have an @id or id property')
        }

        try {
            new URL(id);
            this.uri = id;
        } catch (_) {
            throw new Error('Invalid input: must be a valid URI string')
        }

        const requiredProperties = [
            ['@context', 'context'],
            ['@type', 'type'],
            ['sequences', 'items']
        ]

        try {
            for (const [prop1, prop2] of requiredProperties) {
                if (!manifestOrUri[prop1] && !manifestOrUri[prop2]) {
                    throw new Error(`Invalid input: manifest object must have either ${prop1} or ${prop2} property`)
                }
            }
        } catch (err) {
            console.warn(err, Object.keys(manifestOrUri))
            return
        }

        this.manifest = manifestOrUri
    }

    async load() {
        return vault.loadManifest(this.uri).then(manifest => {
            // load canvases
            manifest.items = vault.get(manifest.items)
            manifest.items = manifest.items.map(item => {
                // Load canvas content
                if (item.items) {
                    item.items = vault.get(item.items)
                }
                // Load Canvas AnnotationPages
                if (item.annotations) {
                    item.annotations = vault.get(item.annotations)
                }
                return item
            })
            return manifest
        })
    }
}

export default Manifest
