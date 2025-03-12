import { test } from 'node:test'
import assert from 'assert'
import Hotkeys from '../Hotkeys.js'

test('Hotkeys constructor should throw an error if _id is not provided', () => {
    assert.throws(() => new Hotkeys(), { status: 400, message: "_id is required" })
})

test('Hotkeys constructor should initialize with _id and symbols', () => {
    const hotkeys = new Hotkeys('123', ['a', 'b'])
    assert.strictEqual(hotkeys._id, '123')
    assert.strictEqual(hotkeys.data._id, '123')
    assert.deepStrictEqual(hotkeys.data.symbols, ['a', 'b'])
})

test('assign should set symbols and return the instance', () => {
    const hotkeys = new Hotkeys('123')
    hotkeys.assign(['a', 'b'])
    assert.deepStrictEqual(hotkeys.data.symbols, ['a', 'b'])
})

test('assign should throw an error if symbols are not strings', () => {
    const hotkeys = new Hotkeys('123')
    assert.throws(() => hotkeys.assign([1, 2]), { status: 400, message: "All symbols must be strings" })
})

test('add should add a symbol if it does not exist and return the instance', () => {
    const hotkeys = new Hotkeys('123', ['a'])
    hotkeys.add('b')
    assert.deepStrictEqual(hotkeys.data.symbols, ['a', 'b'])
})

test('add should not add a symbol if it already exists', () => {
    const hotkeys = new Hotkeys('123', ['a'])
    hotkeys.add('a')
    assert.deepStrictEqual(hotkeys.data.symbols, ['a'])
})

test('add should throw an error if symbol is not a string', () => {
    const hotkeys = new Hotkeys('123')
    assert.throws(() => hotkeys.add(1), { status: 400, message: "Symbol must be a string" })
})

test('remove should remove a symbol if it exists and return the instance', () => {
    const hotkeys = new Hotkeys('123', ['a', 'b'])
    hotkeys.remove('a')
    assert.deepStrictEqual(hotkeys.data.symbols, ['b'])
})

test('remove should throw an error if symbol is not a string', () => {
    const hotkeys = new Hotkeys('123')
    assert.throws(() => hotkeys.remove(1), { status: 400, message: "Symbol must be a string" })
})
