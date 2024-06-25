 import { jest } from '@jest/globals';
import ImportProject from '../ImportProject.mjs';

describe('ImportProject.fetchManifest #importTests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return a manifest object', async () => {
    const mockManifest = {
      "@id": "http://example.com/manifest/1",
      "label": "Example Manifest",
      "metadata": {},
      "items": []
    };

    global.fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockManifest)
    });

    const manifestId = '1';
    const result = await ImportProject.fetchManifest(manifestId);

    expect(global.fetch).toHaveBeenCalledWith(`https://t-pen.org/TPEN/project/${manifestId}`);
    expect(result).toEqual(mockManifest);
  });
});


 
describe('ImportProject.processManifest/processLayerFromCanvas #importTests', () => {
  it('should process the manifest correctly with layers', async () => {
    const mockManifest = {
      "@id": "http://example.com/manifest/1",
      "label": "Example Manifest",
      "metadata": [{ "label": "Author", "name": "Voo Onoja" }],
      "items": [
        {
          "@id": "http://example.com/canvas/1",
          "otherContent": [
            {
              "on": "http://example.com/canvas/1",
              "resources": [
                {
                  "@id": "http://example.com/line/1",
                  "type": "Line",
                  "value": "Sample Text"
                }
              ]
            }
          ]
        }
      ]
    };

    jest.spyOn(ImportProject, 'processLayerFromCanvas').mockResolvedValue([
      {
        "@id": "http://example.com/canvas/1",
        "@type": "Layer",
        "pages": [
          {
            "canvas": "http://example.com/canvas/1",
            "lines": [
              {
                "@id": "http://example.com/line/1",
                "type": "Line",
                "value": "Sample Text"
              }
            ]
          }
        ]
      }
    ]);

    const expectedProject = {
      title: "Example Manifest",
      metadata: [{ "label": "Author", "name": "Voo Onoja" }],
      "@context": "http://t-pen.org/3/context.json",
      manifest: "http://example.com/manifest/1",
      layers: [
        {
          "@id": "http://example.com/canvas/1",
          "@type": "Layer",
          "pages": [
            {
              "canvas": "http://example.com/canvas/1",
              "lines": [
                {
                  "@id": "http://example.com/line/1",
                  "type": "Line",
                  "value": "Sample Text"
                }
              ]
            }
          ]
        }
      ]
    };

    const result = await ImportProject.processManifest(mockManifest);

    expect(result).toEqual(expectedProject);
    expect(ImportProject.processLayerFromCanvas).toHaveBeenCalledWith(mockManifest.items);
  });

});
