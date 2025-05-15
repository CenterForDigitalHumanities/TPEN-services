import User from "../User.js";
import { test } from "node:test";
import assert from "node:assert";

const user = new User();

test("user Class appears and behaves as expected #user_exists_test #user_class", (t) => {
  t.test("Imports user", () => {
    assert.strictEqual(typeof User.constructor, "function");
  });

  t.test("Has required methods", () => {
    assert.strictEqual(typeof user.getSelf, "function");
    assert.strictEqual(typeof user.getProjects, "function");
    assert.strictEqual(typeof user.getPublicInfo, "function");
    assert.strictEqual(typeof user.getByEmail, "function");
    assert.strictEqual(typeof User.create, "function");
  });
});
