import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password.ts";

test("a password verifies against its stored hash", async () => {
  const hash = await hashPassword("correct horse battery staple");

  assert.notEqual(hash, "correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
});

test("the wrong password is rejected", async () => {
  const hash = await hashPassword("demo1234");

  assert.equal(await verifyPassword("demo12345", hash), false);
  assert.equal(await verifyPassword("", hash), false);
});

test("hashes use a fresh salt each time", async () => {
  const first = await hashPassword("demo1234");
  const second = await hashPassword("demo1234");

  assert.notEqual(first, second);
  assert.equal(await verifyPassword("demo1234", first), true);
  assert.equal(await verifyPassword("demo1234", second), true);
});

test("a malformed stored hash is rejected instead of throwing", async () => {
  assert.equal(await verifyPassword("demo1234", "not-a-hash"), false);
  assert.equal(await verifyPassword("demo1234", "scrypt$onlysalt"), false);
});
