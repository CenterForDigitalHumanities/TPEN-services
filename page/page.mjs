import * as utils from "../utilities/shared.mjs"
import Database from "../database/polyController.mjs"

const database = new Database()
database.chooseController("mongo")

export async function findPageById(id = null) {
    let page = null;
  
    if (!utils.validateID(id)) {
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
  
    page = pageArray.find((page) => page.id === id) || null;
  
    if (page === null) {
        page = await mockPause;
    }
  
    return page;
  }

export async function createPage(page){
  const newPage = await database.create(page)
  return newPage
}