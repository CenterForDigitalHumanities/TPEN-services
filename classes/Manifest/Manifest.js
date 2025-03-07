import { Vault } from "@hyperion-framework/vault"

const vault = new Vault()

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
            throw new Error('Invalid input: must be a valid URI string');
        }

        const requiredProperties = [
            ['@type', 'type'],
            ['@context', 'context'],
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

    load = async () => vault.loadManifest(this.uri)
}

export default Manifest
