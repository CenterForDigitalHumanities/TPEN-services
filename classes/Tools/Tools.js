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
        if (!this.data) {
            throw new Error("Project not found")
        }
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

    async addIframeTool(label, toolName, url = "", location, enabled = true) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        const newTool = {
            label,
            toolName,
            url,
            location,
            custom: { enabled }
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
        if (toolIndex === -1) {
            throw new Error("Tool not found")
        }
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
        tool.custom.enabled = !tool.custom.enabled
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

    async checkToolNamePattern(toolName) {
        const toolNamePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
        return toolNamePattern.test(toolName)
    }

    async validateURL(url) {
        try {
            new URL(url)
            return true
        } catch (e) {
            return false
        }
    }

    async validateAllTools(tools) {
        const validTools = []
        for (const tool of tools) {
            if (typeof tool !== "object" || tool === null) break
            const { label, toolName, url, location, custom } = tool
            if (typeof label !== "string") break
            if (typeof toolName !== "string" || !await this.checkToolNamePattern(toolName)) break
            if (url !== undefined && (typeof url !== "string" || (url !== "" && !await this.validateURL(url)))) break
            if (!["dialog", "pane", "drawer", "linked", "sidebar"].includes(location)) break
            if (custom.enabled !== undefined && typeof custom.enabled !== "boolean") break
            validTools.push(tool)
        }
        return validTools
    }

    async validateToolArray(tool) {
        if(typeof tool !== "object" || tool === null) {
            throw { status: 400, message: "Each tool must be an object." }
        }
        const {label, toolName, url, location, enabled} = tool
        if (typeof label !== "string") {
            throw { status: 400, message: "label must be a string." }
        }
        if (typeof toolName !== "string" || !await this.checkToolNamePattern(toolName)) {
            throw { status: 400, message: "toolName must be a string in 'lowercase-with-hyphens' format." }
        }
        if ( url !== undefined && (typeof url !== "string" || url !== "" && !await this.validateURL(url))) {
            throw { status: 400, message: "url must be a valid URL string." }
        }
        if (["dialog", "pane", "drawer", "linked", "sidebar"].indexOf(location) === -1) {
            throw { status: 400, message: "location must be either 'dialog', 'pane', 'drawer', 'linked', or 'sidebar'." }
        }
        if (enabled !== undefined && typeof enabled !== "boolean") {
            throw { status: 400, message: "enabled must be a boolean." }
        }
    }

    static defaultTools = [
        {
            "label": "Inspect",
            "toolName": "inspect",
            "custom": { "enabled": true },
            "url": null,
            "location": "drawer"
        },
        {
            "label": "View Full Page",
            "toolName": "view-fullpage",
            "custom": { "enabled": true },
            "url": null,
            "location": "pane"
        },
        {
            "label": "History Tool",
            "toolName": "history",
            "custom": { "enabled": true },
            "url": null,
            "location": "pane"
        },
        {
            "label": "Preview Tool",
            "toolName": "preview",
            "custom": { "enabled": true },
            "url": null,
            "location": "pane"
        },
        {
            "label": "Line Breaking",
            "toolName": "line-breaking",
            "custom": { "enabled": true },
            "url": null,
            "location": "dialog"
        },
        {
            "label": "Compare Pages",
            "toolName": "compare-pages",
            "custom": { "enabled": true },
            "url": null,
            "location": "pane"
        },
        {
            "label": "Cappelli's Abbreviation",
            "toolName": "cappelli-abbreviation",
            "custom": { "enabled": false },
            "url": "https://centerfordigitalhumanities.github.io/cappelli/",
            "location": "pane"
        },
        {
            "label": "Enigma",
            "toolName": "enigma",
            "url": "https://ciham-digital.huma-num.fr/enigma/",
            "custom": { "enabled": false },
            "location": "pane"
        },
        {
            "label": "Latin Dictionary",
            "toolName": "latin-dictionary",
            "url": "https://www.perseus.tufts.edu/hopper/resolveform?lang=latin",
            "custom": { "enabled": false },
            "location": "pane"
        },
        {
            "label": "Latin Vulgate",
            "toolName": "latin-vulgate",
            "url": "https://vulsearch.sourceforge.net/cgi-bin/vulsearch",
            "custom": { "enabled": false },
            "location": "pane"
        }
    ]
}
