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

    async addIframeTool(label, toolName, url = "", location, enabled = true, tagname = "") {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        const newTool = {
            label,
            toolName,
            url,
            location,
            custom: { enabled },
            tagname
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

    async checkIfToolLabelExists(label) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        return this.tools.some(t => t.label === label)
    }

    async checkIfTagNameExists(tagname) {
        if (!this.tools || !Array.isArray(this.tools)) {
            await this.#loadFromDB()
        }
        return this.tools.some(t => t.tagname === tagname)
    }

    async checkIfInDefaultTools(toolName) {
        return Tools.defaultTools.some(t => t.toolName === toolName)
    }

    async checkToolPattern(toolValue) {
        const toolPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
        return toolPattern.test(toolValue)
    }

    async getTagnameFromScript(url) {
        try {
            const text = await (await fetch(url)).text()
            const match = text.match(/customElements\.define\s*\(\s*['"]([^'"]+)['"]/)
            return match ? match[1] : null
        } catch (e) {
            console.error("Error fetching tagname:", e)
            return null
        }
    }

    async validateURL(url) {
        try {
            new URL(url)
            return true
        } catch (e) {
            return false
        }
    }

    async checkIfURLisJSScript(url) {
        return url.endsWith(".js") || url.includes(".js?")
    }

    async validateAllTools(tools) {
        const validTools = []
        const toolPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/
        for (const tool of tools) {
            if (typeof tool !== "object" || tool === null) continue
            let { label, toolName, url = "", location, enabled = true, tagname = "" } = tool
            if (Tools.defaultTools.some(t => t.toolName === toolName)) continue
            if (Tools.defaultTools.some(t => t.label === label)) continue
            if (!toolPattern.test(toolName)) continue
            if (!toolPattern.test(tagname)) continue
            if (typeof label !== "string") continue
            if (typeof toolName !== "string" || !await this.checkToolPattern(toolName)) continue
            if (url !== undefined && (typeof url !== "string" || (url !== "" && !await this.validateURL(url)))) continue
            if (url !== undefined && url !== "" && !await this.checkIfURLisJSScript(url) && tagname !== "") { tagname = "" }
            if (tagname !== undefined && tagname !== "" && !await this.checkIfTagNameExists(tagname)) continue
            if (url !== undefined && url !== "" && await this.checkIfURLisJSScript(url)) {
                tagname = await this.getTagnameFromScript(url)
                if (Tools.defaultTools.some(t => t.tagname === tagname)) continue
                if (!tagname || !await this.checkToolPattern(tagname)) continue
            }
            if (!["dialog", "pane", "drawer", "linked", "sidebar"].includes(location)) continue
            if (enabled !== undefined && typeof enabled !== "boolean") continue
            validTools.push({
                label,
                toolName,
                url,
                location,
                custom: { enabled },
                tagname
            })
        }
        return validTools
    }

    async validateToolArray(tool) {
        if(typeof tool !== "object" || tool === null) {
            throw { status: 400, message: "Each tool must be an object." }
        }
        const {label, toolName, url, location, enabled, tagname} = tool
        if (typeof label !== "string") {
            throw { status: 400, message: "label must be a string." }
        }
        if (typeof toolName !== "string" || !await this.checkToolPattern(toolName)) {
            throw { status: 400, message: "toolName must be a string in 'lowercase-with-hyphens' format." }
        }
        if (url !== undefined && (typeof url !== "string" || (url !== "" && !await this.validateURL(url)))) {
            throw { status: 400, message: "url must be a valid URL string." }
        }
        if (url !== undefined && url !== "" && !await this.checkIfURLisJSScript(url) && tagname !== "") {
            throw { status: 400, message: "If url is not a JavaScript file, tagname must be empty." }
        }
        if (tagname !== undefined && tagname !== "" && !await this.checkIfTagNameExists(tagname)) {
            throw { status: 400, message: "tagname must be unique and not already in use." }
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
            "url": "",
            "location": "drawer",
            "tagname": ""
        },
        {
            "label": "View Full Page",
            "toolName": "view-fullpage",
            "custom": { "enabled": true },
            "url": "",
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "History Tool",
            "toolName": "history",
            "custom": { "enabled": true },
            "url": "",
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "Preview Tool",
            "toolName": "preview",
            "custom": { "enabled": true },
            "url": "",
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "Line Breaking",
            "toolName": "line-breaking",
            "custom": { "enabled": true },
            "url": "",
            "location": "dialog",
            "tagname": ""
        },
        {
            "label": "Compare Pages",
            "toolName": "compare-pages",
            "custom": { "enabled": true },
            "url": "",
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "Cappelli's Abbreviation",
            "toolName": "cappelli-abbreviation",
            "custom": { "enabled": false },
            "url": "https://centerfordigitalhumanities.github.io/cappelli/",
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "Enigma",
            "toolName": "enigma",
            "url": "https://ciham-digital.huma-num.fr/enigma/",
            "custom": { "enabled": false },
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "Latin Dictionary",
            "toolName": "latin-dictionary",
            "url": "https://www.perseus.tufts.edu/hopper/resolveform?lang=latin",
            "custom": { "enabled": false },
            "location": "pane",
            "tagname": ""
        },
        {
            "label": "Latin Vulgate",
            "toolName": "latin-vulgate",
            "url": "https://vulsearch.sourceforge.net/cgi-bin/vulsearch",
            "custom": { "enabled": false },
            "location": "pane",
            "tagname": ""
        }
    ]
}
