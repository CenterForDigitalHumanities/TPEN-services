import {User} from "../User.mjs"

const user = new User("6602dd2314cd575343f513bc")
const userObj = user._fetchUser()

describe("user Class appears and behaves as expected #user_exists_test", () => {
  it("Imports user", () => {
    expect(User.constructor).toBeInstanceOf(Function)
  })

  it("Fetches user object from db", () => {
    expect(user._fetchUser).toBeInstanceOf(Function)
    expect(userObj).toBeInstanceOf(Object)
  })

  it("Has required methods", () => {
    expect(user.getSelf).toBeInstanceOf(Function)
    expect(user.getUserById).toBeInstanceOf(Function)
    expect(user.updateRecord).toBeInstanceOf(Function) 
    expect(user.getProjects).toBeInstanceOf(Function)
    expect(user.createProject).toBeInstanceOf(Function)
  }) 
})
