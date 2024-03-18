import {findPageById} from '../page.mjs'
import {validateID} from '../../utilities/shared.mjs'

// These test the pieces of functionality in the route that make it work.
describe('Page endpoint functionality unit test (just testing helper functions). #functions_unit', () => {

  it('No TPEN3 page id provided.  Page validation must be false.', () => {
    expect(validateID()).toBe(false)
  })
  it('Detect TPEN3 page does not exist.  The query for a TPEN3 page must be null.', async () => {
    const page = await findPageById(-111)
    expect(page).toBe(null)
  })
  it('TPEN3 page does exist.  Finding the page results in the page JSON', async () => {
    let page = await findPageById(123)
    expect(page).not.toBe(null)
  })
  describe('Page endpoint functionality unit test (just testing helper functions). #functions_unit', () => {
    it('No TPEN3 page id provided. Page validation must be false.', () => {
      expect(validateID()).toBe(false);
    });
  
    it('Detect TPEN3 page does not exist. The query for a TPEN3 page must be null.', async () => {
      const page = await findPageById(-111);
      expect(page).toBe(null);
    });
  
    it('TPEN3 page does exist. Finding the page results in the page JSON.', async () => {
      const page = await findPageById(123);
      expect(page).not.toBe(null);
    });
  
    it('TPEN3 page id provided as 1. Should return null.', async () => {
      const page = await findPageById('0001');
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as 0001. Should return null.', async () => {
      const page = await findPageById('0001');
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as a negative number. Should return null.', async () => {
      const page = await findPageById(-123);
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as a string. Should return null.', async () => {
      const page = await findPageById('abc');
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as null. Should return null.', async () => {
      const page = await findPageById(null);
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as undefined. Should return null.', async () => {
      const page = await findPageById(undefined);
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as a special character. Should return null.', async () => {
      const page = await findPageById('!@#');
      expect(page).toBe(null);
    });
  
    it('GET request with no query params. Should return the default page data.', async () => {
      const page = await findPageById(123, {});
      console.log(page);
      expect(page).toBeDefined();
      // Add assertions to validate the default page data
    });
  
     // Test cases for handling query parameter 'text=blob'
  it('GET request with ?text=blob query param. Should return blob text.', async () => {
    const page = await findPageById(123, { text: 'blob' });
    expect(page.blobText).toBeDefined();
    expect(page.blobText).toEqual("Sample blob text for the page.");
  });

  // Test cases for handling query parameter 'text=layers'
  it('GET request with ?text=layers query param. Should return layers text.', async () => {
    const page = await findPageById(123, { text: 'layers' });
    expect(page.layersText).toBeDefined();
    expect(page.layersText).toEqual(["Layer 1", "Layer 2", "Layer 3"]);
  });

  // Test cases for handling query parameter 'text=lines'
  it('GET request with ?text=lines query param. Should return lines text.', async () => {
    const page = await findPageById(123, { text: 'lines' });
    expect(page.linesText).toBeDefined();
    expect(page.linesText).toEqual(["Line 1", "Line 2", "Line 3"]);
  });

  // Test cases for handling query parameter 'image=full'
  it('GET request with ?image=full query param. Should return URL of full page image.', async () => {
    const page = await findPageById(123, { image: 'full' });
    expect(page.fullImageURL).toBeDefined();
    expect(page.fullImageURL).toEqual("https://example.com/full-image.jpg");
  });

  // Test cases for handling query parameter 'image=lines'
  it('GET request with ?image=lines query param. Should return array of image fragments.', async () => {
    const page = await findPageById(123, { image: 'lines' });
    expect(page.imageLines).toBeDefined();
    expect(page.imageLines).toEqual(["Image Line 1", "Image Line 2", "Image Line 3"]);
  });

  // Test cases for handling query parameter 'lookup=project'
  it('GET request with ?lookup=project query param. Should return project document.', async () => {
    const page = await findPageById(123, { lookup: 'project' });
    expect(page.projectDoc).toBeDefined();
    expect(page.projectDoc).toEqual("Sample Project");
  });

  // Test cases for handling query parameter 'view=xml'
  it('GET request with ?view=xml query param. Should return document as XML.', async () => {
    const page = await findPageById(123, { view: 'xml' });
    expect(page.xmlDoc).toBeDefined();
    expect(page.xmlDoc).toEqual("<xml>This is a sample XML view of the page.</xml>");
  });

  // Test cases for handling query parameter 'view=html'
  it('GET request with ?view=html query param. Should return readonly viewer HTML Document.', async () => {
    const page = await findPageById(123, { view: 'html' });
    expect(page.htmlDoc).toBeDefined();
    expect(page.htmlDoc).toEqual("<html><body><h1>This is a sample HTML view of the page.</h1></body></html>");
  });

  // Test cases for handling query parameter 'embed=true'
  it('GET request with ?embed=true query param. Should return embedded HTML Document.', async () => {
    const page = await findPageById(123, { embed: true });
    expect(page.htmlDoc).toBeDefined();
    expect(page.htmlDoc).toEqual("<html><body><h1>will implement the logic.</h1></body></html>");
  });

  // Test case for null queryParams
  it('GET request with null queryParams. Should return expected page response.', async () => {
    const page = await findPageById(123, null);
    // Validate the structure of the expected page response
    expect(page.id).toEqual(123);
    expect(page["@context"]).toEqual("http://t-pen.org/3/context.json");
    expect(page["@type"]).toEqual("CreativeWork");
    expect(page.metadata).toEqual([]);
    expect(page.name.none).toEqual("page name");
    expect(page.creator).toEqual("https://store.rerum.io/v1/id/hash");
    expect(page.project.id).toEqual("#ProjectId");
    expect(page.project.viewer).toEqual("https://static.t-pen.org/#ProjectId");
    expect(page.project.tools).toEqual([]);
    expect(page.project.options).toEqual({});
    expect(page.project.license).toEqual("CC-BY");
    expect(page.canvas).toEqual("https://example.com/canvas.json");
    expect(page.annotations).toEqual(["#AnnotationPageId"]);
    expect(page.viewer).toEqual("https://static.t-pen.org/#ProjectId/#PageId");
  });

  
  });
  
})
