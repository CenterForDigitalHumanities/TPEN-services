import { validateProjectPayload } from '../validatePayload.js'
import { describe, test, expect } from '@jest/globals'

describe('validateProjectPayload', () => {
  describe('basic validation', () => {
    test('should return invalid for null or undefined payload', () => {
      expect(validateProjectPayload(null).isValid).toBe(false)
      expect(validateProjectPayload(undefined).isValid).toBe(false)
      expect(validateProjectPayload(null).errors).toBe("Project cannot be created from an empty object")
    })

    test('should return invalid for empty object', () => {
      const result = validateProjectPayload({})
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Missing required elements")
    })

    test('should return invalid for missing required fields', () => {
      const payload = {
        label: "Test Project"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Missing required elements")
      expect(result.errors).toContain("metadata")
      expect(result.errors).toContain("layers")
      expect(result.errors).toContain("manifest")
      expect(result.errors).toContain("creator")
      expect(result.errors).toContain("group")
    })
  })

  describe('label validation', () => {
    test('should return invalid for non-string label', () => {
      const payload = {
        label: 123,
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("label must be a non-empty string")
    })

    test('should return invalid for empty string label', () => {
      const payload = {
        label: "",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("label must be a non-empty string")
    })

    test('should accept valid string label', () => {
      const payload = {
        label: "Valid Project Name",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })
  })

  describe('metadata validation', () => {
    test('should return invalid for non-array metadata', () => {
      const payload = {
        label: "Test Project",
        metadata: "metadata",
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("metadata must be an array")
    })

    test('should accept empty array metadata', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })

    test('should accept valid metadata array', () => {
      const payload = {
        label: "Test Project",
        metadata: [
          { label: "Author", value: "John Doe" },
          { label: "Date", value: "2023" }
        ],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })

    test('should return invalid for metadata array containing non-objects', () => {
      const payload = {
        label: "Test Project",
        metadata: ["metadata"], // Array of strings instead of objects
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("metadata item at index 0 must be an object")
    })

    test('should return invalid for metadata objects missing label property', () => {
      const payload = {
        label: "Test Project",
        metadata: [
          { value: "John Doe" } // Missing label
        ],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("metadata item must have label and value properties")
    })

    test('should return invalid for metadata objects missing value property', () => {
      const payload = {
        label: "Test Project",
        metadata: [
          { label: "Author" } // Missing value
        ],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("metadata item must have label and value properties")
    })

    test('should return invalid for metadata with empty label', () => {
      const payload = {
        label: "Test Project",
        metadata: [
          { label: "", value: "John Doe" }
        ],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
    })

    test('should return invalid for metadata with extra properties', () => {
      const payload = {
        label: "Test Project",
        metadata: [
          { label: "Author", value: "John Doe", extra: "should not be here" }
        ],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
    })
  })

  describe('layers validation', () => {
    test('should return invalid for non-array layers', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: "layers",
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("layers must be an array")
    })

    test('should accept empty array layers', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })

    test('should validate layer objects in array', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: []
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })

    test('should return invalid for malformed layer objects', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1"
            // missing label and pages
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("layer must have id, label, and pages properties")
    })

    test('should return invalid for non-array layer pages', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: "not-an-array"
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("layer pages must be an array")
    })

    test('should return invalid for malformed page objects', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                "no": "page" // missing id and target
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("page must have id and target properties")
    })

    test('should return invalid for page with empty id', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                id: "",
                target: "http://example.com/canvas1"
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("page id must be a non-empty string")
    })

    test('should return invalid for page with empty target', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                id: "http://example.com/page1",
                target: ""
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("page target must be a non-empty string")
    })

    test('should return invalid for page with invalid label', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                id: "http://example.com/page1",
                label: "",
                target: "http://example.com/canvas1"
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("page label must be a non-empty string when present")
    })

    test('should return invalid for page with non-array items', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                id: "http://example.com/page1",
                target: "http://example.com/canvas1",
                items: "not-an-array"
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("page items must be an array when present")
    })

    test('should accept valid layer with properly structured pages', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                id: "http://example.com/page1",
                label: "Page 1",
                target: "http://example.com/canvas1",
                items: []
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })
  })

  describe('manifest validation', () => {
    test('should return invalid for non-array manifest', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: {"type":"Manifest"},
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("manifest must be an array")
    })

    test('should return invalid for empty array manifest', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: [],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("manifest array cannot be empty")
    })

    test('should accept valid manifest array with URIs', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest1", "http://example.com/manifest2"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })

    test('should return invalid for non-URI strings in manifest array', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["not-a-url"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("manifest array must contain valid URIs")
    })
  })

  describe('creator validation', () => {
    test('should return invalid for non-string creator', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: 123,
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("creator must be a non-empty string")
    })

    test('should return invalid for empty string creator', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("creator must be a non-empty string")
    })

    test('should accept valid creator string', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })
  })

  describe('group validation', () => {
    test('should return invalid for non-string group', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: true
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("group must be a non-empty string")
    })

    test('should return invalid for empty string group', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: ""
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("group must be a non-empty string")
    })

    test('should accept valid group string', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123def456"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })
  })

  describe('tools validation', () => {
    test('should accept valid payload without tools property', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })

    test('should return invalid for non-array tools', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: "tools" // String instead of array
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tools must be an array when present")
    })

    test('should return invalid for tools array containing non-objects', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: ["not-an-object"]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool at index 0 must be an object")
    })

    test('should return invalid for tool missing required properties', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool"
            // Missing toolName, location, custom
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool must have label, toolName, location, and custom properties")
    })

    test('should return invalid for tool with invalid toolName pattern', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool",
            toolName: "InvalidToolName", // Should be lowercase with hyphens
            location: "dialog",
            custom: { enabled: true }
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool toolName must be in lowercase-with-hyphens format")
    })

    test('should return invalid for tool with invalid location', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool",
            toolName: "test-tool",
            location: "invalid-location",
            custom: { enabled: true }
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool location must be one of: dialog, pane, drawer, linked, sidebar")
    })

    test('should return invalid for tool with invalid URL', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool",
            toolName: "test-tool",
            url: "not-a-valid-url",
            location: "dialog",
            custom: { enabled: true }
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool url must be a valid URL when not empty")
    })

    test('should return invalid for tool with non-object custom', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool",
            toolName: "test-tool",
            location: "dialog",
            custom: "not-an-object"
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool custom must be an object")
    })

    test('should return invalid for tool with invalid custom.enabled', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool",
            toolName: "test-tool",
            location: "dialog",
            custom: { enabled: "not-a-boolean" }
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toBe("tool custom.enabled must be a boolean when present")
    })

    test('should accept valid tools array', () => {
      const payload = {
        label: "Test Project",
        metadata: [],
        layers: [],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123",
        tools: [
          {
            label: "Test Tool",
            toolName: "test-tool",
            url: "https://example.com/tool.js",
            location: "dialog",
            custom: {
              enabled: true,
              tagName: "test-element"
            }
          },
          {
            label: "Another Tool",
            toolName: "another-tool",
            url: "",
            location: "pane",
            custom: {
              enabled: false,
              tagName: ""
            }
          }
        ]
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
    })
  })

  describe('complete validation scenarios', () => {
    test('should return invalid for payload missing required elements', () => {
      const payload = {
        "metadata": "metadata",
        "label": "Some Label",
        "layers": "layers",
        "manifest": {"type":"Manifest"},
        "tools": "tools",
        "group": true
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Missing required elements: creator")
    })

    test('should return invalid for the malformed example from the issue with all fields present', () => {
      const payload = {
        "metadata": "metadata",
        "label": "Some Label",
        "layers": "layers",
        "manifest": {"type":"Manifest"},
        "creator": "user123",
        "group": true
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(false)
      // Since we now return the first error encountered, we only expect the first validation error
      expect(result.errors).toBe("metadata must be an array")
    })

    test('should accept valid complete project payload', () => {
      const payload = {
        label: "Test Project",
        metadata: [
          { label: "Author", value: "John Doe" },
          { label: "Date", value: "2023" }
        ],
        layers: [
          {
            id: "http://example.com/layer1",
            label: "Layer 1",
            pages: [
              {
                id: "http://example.com/page1",
                label: "Page 1",
                target: "http://example.com/canvas1"
              }
            ]
          }
        ],
        manifest: ["http://example.com/manifest"],
        creator: "http://example.com/user",
        group: "abc123def456"
      }
      const result = validateProjectPayload(payload)
      expect(result.isValid).toBe(true)
      expect(result.errors).toBe(null)
    })
  })
})