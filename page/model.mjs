import * as utils from "../utilities/shared.mjs"

export async function findPageById(id = null) {
    let page = null;
  
    if (!utils.validateProjectID(id)) {
      return page;
    }
  
    const mockPause = new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, 1500);
    });
  
    const pageArray = [
      { id: 123, text: "welcome to the page" }
    ];
  
    page = pageArray.find((page) => page.id === id);
  
    if (page === null) {
        page = await mockPause.then((val) => {
        return null;
      });
    }
  
    return page;
  }
