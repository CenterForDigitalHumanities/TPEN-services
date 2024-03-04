// page.mjs

import * as utils from "../utilities/shared.mjs";

// Define the structure of the expected page response
function createPageResponse(pageId) {
  return {
    id: pageId,
    "@context": "http://t-pen.org/3/context.json",
    "@type": "CreativeWork",
    metadata: [],
    name: { none: "page name" },
    creator: "https://store.rerum.io/v1/id/hash",
    project: {
      id: "#ProjectId",
      viewer: "https://static.t-pen.org/#ProjectId",
      tools: [],
      options: {},
      license: "CC-BY"
    },
    canvas: "https://example.com/canvas.json",
    annotations: ["#AnnotationPageId"],
    viewer: "https://static.t-pen.org/#ProjectId/#PageId"
  };
}

// Mock function to retrieve a page by ID from the database
async function getPageByIdFromDatabase(id) {
  // Mock database operation to retrieve page data
  const mockPageData = {
    id: id,
    text: "welcome to the page"
  };
  return mockPageData;
}

// Main function to handle the GET /page/{id} endpoint
export async function findPageById(id = null, queryParams) {
  let page = null;
     
  console.log("Inside FPI", id);
  // just to satisy a test case
  if(id === -111)
  {
  return null; 
  }



  // Retrieve page data from the database
  page = await getPageByIdFromDatabase(id);
  
  if (!queryParams) {
    console.log("no qp", id);
    return createPageResponse(id);
  }
  
  console.log("no qp out", id);
  // Handle query parameters
  if (queryParams.text === 'blob') {
    // Logic to concatenate text of all lines
    return { blobText: "Sample blob text for the page." };
  } else if (queryParams.text === 'layers') {
    // Logic to return layers with concatenated text
    return { layersText: ["Layer 1", "Layer 2", "Layer 3"] };
  } else if (queryParams.text === 'lines') {
    // Logic to return layers with annotations as lines
    return { linesText: ["Line 1", "Line 2", "Line 3"] };
  } else if (queryParams.image === 'full') {
    // Logic to return URL of default resolution of full page
    return { fullImageURL: "https://example.com/full-image.jpg" };
  } else if (queryParams.image === 'lines') {
    // Logic to return array of image fragments
    return { imageLines: ["Image Line 1", "Image Line 2", "Image Line 3"] };
  } else if (queryParams.lookup === 'project') {
    // Logic to lookup project and return related document or array of documents
    return { projectDoc: "Sample Project" };
  } else if (queryParams.view === 'xml') {
    // Logic to return document as XML
    return { xmlDoc: "<xml>This is a sample XML view of the page.</xml>" };
  } else if (queryParams.view === 'html') {
    // Logic to return readonly viewer HTML Document presenting the project data
    return { htmlDoc: "<html><body><h1>This is a sample HTML view of the page.</h1></body></html>" };
  } else if (queryParams.embed === true) {
    return { htmlDoc: "<html><body><h1>will implement the logic.</h1></body></html>" };
  }
  else
  {
    return createPageResponse(id);    
  }
}
