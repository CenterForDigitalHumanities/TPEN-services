import dbDriver from "../../database/driver.js"
const database = new dbDriver("mongo")

export default class Tools {
    constructor(projectId) {
        this._id = projectId
        this.data = null
        this.tools = null
    }

    async #loadFromDB() {
        this.data = await database.getById(this._id, process.env.TPENPROJECTS)
        this.tools = this.data.tools
        return this
    }

    async save() {
        this.data.tools = this.tools
        return database.save(this.data, process.env.TPENPROJECTS)
    }

    async update() {
        this.data.tools = this.tools
        return database.update(this.data, process.env.TPENPROJECTS)
    }

    async addIframeTool(label, toolName, url, location, state = true) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        const newTool = {
            label,
            toolName,
            url,
            location,
            custom: { state }
        }
        this.tools.push(newTool)
        await this.update()
        return newTool
    }

    async removeTool(toolName) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        const toolIndex = this.tools.findIndex(t => t.toolName === toolName)
        const removedTool = this.tools.splice(toolIndex, 1)[0]
        await this.update()
        return removedTool
    }

    async toggleTool(toolName) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        const tool = this.tools.find(t => t.toolName === toolName)
        if (!tool) {
            throw new Error("Tool not found")
        }
        tool.custom.state = !tool.custom.state
        await this.update()
        return tool
    }

    async checkIfToolExists(toolName) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        return this.tools.some(t => t.toolName === toolName)
    }

    async checkIfInDefaultTools(toolName) {
        return Tools.defaultTools.some(t => t.toolName === toolName)
    }

    static defaultTools = [
        {
            "label":"Inspect",
            "toolName":"inspect",
            "custom": { "state": true },
            "url": null,
            "location": "drawer"
        },
        {
            "label":"View Full Page", 
            "toolName":"view-fullpage",
            "custom": { "state": true },
            "url": null,
            "location": "pane"
        },
        {
            "label":"History Tool", 
            "toolName":"history",
            "custom": { "state": true },
            "url": null,
            "location": "pane"
        },
        {
            "label":"Preview Tool", 
            "toolName":"preview",
            "custom": { "state": true },
            "url": null,
            "location": "pane"
        },
        {
            "label":"Line Breaking", 
            "toolName":"line-breaking",
            "custom": { "state": true },
            "url": null,
            "location": "dialog"
        },
        {
            "label":"Compare Pages", 
            "toolName":"compare-pages",
            "custom": { "state": true },
            "url": null,
            "location": "pane"
        },
        {
            "label": "Cappelli's Abbreviation",
            "toolName": "cappelli-abbreviation",
            "custom": { "state": false },
            "url": "https://centerfordigitalhumanities.github.io/cappelli/",
            "location": "pane"
        },
        {
            "label": "Enigma",
            "toolName": "enigma",
            "url": "https://ciham-digital.huma-num.fr/enigma/",
            "custom": { "state": false },
            "location": "pane"
        },
        {
            "label": "Latin Dictionary",
            "toolName": "latin-dictionary",
            "url": "https://www.perseus.tufts.edu/hopper/resolveform?lang=latin",
            "custom": { "state": false },
            "location": "pane"
        },
        {
            "label": "Latin Vulgate",
            "toolName": "latin-vulgate",
            "url": "https://vulsearch.sourceforge.net/cgi-bin/vulsearch",
            "custom": { "state": false },
            "location": "pane"
        }
    ]
}
