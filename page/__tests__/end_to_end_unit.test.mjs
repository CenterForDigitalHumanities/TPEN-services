import pageRouter from '../index.mjs'
import express from 'express'
import request from 'supertest'
import { findPageById } from '../page.mjs';
import { createPageResponse } from '../page.mjs';

const routeTester = new express()
routeTester.use("/page", pageRouter)

describe('page endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {

  it('POST instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .post('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PUT instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .put('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('PATCH instead of GET.  That status should be 405 with a message.', async () => {
    const res = await request(routeTester)
      .patch('/page/')
      expect(res.statusCode).toBe(405)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page without a TPEN3 page ID.  The status should be 400 with a message.', async () => {
    const res = await request(routeTester)
      .get('/page/')
      expect(res.statusCode).toBe(400)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page with a TPEN3 page ID that does not exist.  The status should be 404 with a message.', async () => {
    const res = await request(routeTester)
      .get('/page/0001')
      expect(res.statusCode).toBe(404)
      expect(res.body).toBeTruthy()
  })

  it('Call to /page with a TPEN3 page ID that does  exist.  The status should be 200 with a JSON page in the body.', async () => {
    const res = await request(routeTester)
      .get('/page/123')
      let json = res.body
      try{
        json = JSON.parse(JSON.stringify(json))
      }
      catch(err){
        json = null
      }
      expect(json).not.toBe(null)
  })
  



  describe('page endpoint end to end unit test (spinning up the endpoint and using it). #end2end_unit', () => {
    it('GET request with no query params. Should return the default page data.', async () => {
      const res = await request(routeTester)
        .get('/page/123')
        expect(res.statusCode).toBe(200)
        //expect(res.body).toBeTruthy()
    })
  
    it('GET request with ?text=blob query param. Should return blob text.', async () => {
      const res = await request(routeTester)
        .get('/page/123?text=blob')
        expect(res.statusCode).toBe(200)
        expect(res.body.blobText).toBeTruthy()
        // Add assertions to validate the blob text response
    })
  
    it('GET request with ?text=layers query param. Should return layers text.', async () => {
      const res = await request(routeTester)
        .get('/page/123?text=layers')
        expect(res.statusCode).toBe(200)
    })
  


    it('GET request with ?text=lines query param. Should return lines text.', async () => {
      const queryParams = { text: 'lines' };
      const page = await findPageById(123, queryParams);
      expect(page[0].textualBody).toBeTruthy();
      // Add assertions to validate the lines text response
    });
  
    it('GET request with ?image=full query param. Should return full image URL.', async () => {
      const queryParams = { image: 'full' };
      const page = await findPageById(123, queryParams);
      expect(page.fullImageURL).toBeTruthy();
      // Add assertions to validate the full image URL response
    });
  
    it('GET request with ?image=lines query param. Should return image lines array.', async () => {
      const queryParams = { image: 'lines' };
      const page = await findPageById(123, queryParams);
      expect(page.imageLines).toBeTruthy();
      // Add assertions to validate the image lines array response
    });
  
    it('GET request with ?lookup=project query param. Should return project document.', async () => {
      const queryParams = { lookup: 'project' };
      const page = await findPageById(123, queryParams);
      expect(page.id).toBeTruthy();
    });
  
    it('GET request with ?view=xml query param. Should return XML document.', async () => {
      const queryParams = { view: 'xml' };
      const page = await findPageById(123, queryParams);
      expect(page).toBeTruthy();
      // Add assertions to validate the XML document response
    });
  
    it('GET request with ?view=html query param. Should return HTML document.', async () => {
      const queryParams = { view: 'html' };
      const page = await findPageById(123, queryParams);
      expect(page).toBeTruthy();
      // Add assertions to validate the HTML document response
    });
  
    it('GET request with ?embed=true query param. Should return embedded HTML document.', async () => {
      const queryParams = { embed: true };
      const page = await findPageById(123, queryParams);
      expect(page).toBeTruthy();
      // Add assertions to validate the embedded HTML document response
    });
  })
  
})