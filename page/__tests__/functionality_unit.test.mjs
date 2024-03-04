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
      const page = await findPageById(1);
      expect(page).toBe(null);
    });
  
    it('TPEN3 page id provided as 0001. Should return null.', async () => {
      const page = await findPageById(0001);
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
      expect(page).toBeDefined();
      // Add assertions to validate the default page data
    });
  
    it('GET request with ?text=blob query param. Should return blob text.', async () => {
      const page = await findPageById(123, { text: 'blob' });
      expect(page.blobText).toBeDefined();
      // Add assertions to validate the blob text response
    });
  
    it('GET request with ?text=layers query param. Should return layers text.', async () => {
      const page = await findPageById(123, { text: 'layers' });
      expect(page.layersText).toBeDefined();
      // Add assertions to validate the layers text response
    });
  
  });
  
})
