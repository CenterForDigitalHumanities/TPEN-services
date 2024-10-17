import {User} from "../User.mjs"

const user = new User() 

describe("user Class appears and behaves as expected #user_exists_test #user_class", () => {
  it("Imports user", () => {
    expect(User.constructor).toBeInstanceOf(Function)
  }) 

  it("Has required methods", () => {
    expect(user.getSelf).toBeInstanceOf(Function)
    expect(user.getProjects).toBeInstanceOf(Function) 
    expect(user.getPublicInfo).toBeInstanceOf(Function)
    expect(user.getByEmail).toBeInstanceOf(Function)
    expect(User.create).toBeInstanceOf(Function)
  }) 
})
