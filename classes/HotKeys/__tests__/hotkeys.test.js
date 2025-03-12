import { test, beforeEach, afterEach } from 'node:test'
import assert from 'assert'
import sinon from 'sinon'
import Hotkeys from '../Hotkeys.js'
import dbDriver from '../../../database/driver.mjs'

const database = new dbDriver("mongo")

beforeEach(() => {
    sinon.stub(database, 'getById')
    sinon.stub(database, 'findOne')
    sinon.stub(database, 'update')
    sinon.stub(database, 'delete')
})

afterEach(() => {
    sinon.restore()
})

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

test('getByProjectId should throw an error if _id is not provided', async () => {
    await assert.rejects(() => Hotkeys.getByProjectId(), { status: 400, message: "projectId is required" })
})

test('getByProjectId should return hotkeys for a project', async () => {
    database.findOne.resolves({ _id: '123', symbols: ['a', 'b'] })
    const hotkeys = await Hotkeys.getByProjectId('123')
    assert.deepStrictEqual(hotkeys, { _id: '123', symbols: ['a', 'b'] })
})

test('setSymbols should update the hotkeys in the database', async () => {
    const hotkeys = new Hotkeys('123', ['a', 'b'])
    database.update.resolves()
    await hotkeys.setSymbols()
    assert(database.update.calledWith({ _id: '123', symbols: ['a', 'b'] }))
})

test('setSymbols should throw an error if _id or symbols are not provided', async () => {
    const hotkeys = new Hotkeys('123')
    await assert.rejects(() => hotkeys.setSymbols(), { status: 400, message: "Cannot create a detached or empty set of hotkeys. Consider DELETE." })
})

test('delete should delete the hotkeys from the database', async () => {
    const hotkeys = new Hotkeys('123')
    database.delete.resolves()
    await hotkeys.delete()
    assert(database.delete.calledWith('123'))
})

test('delete should throw an error if _id is not provided', async () => {
    const hotkeys = new Hotkeys()
    await assert.rejects(() => hotkeys.delete(), { status: 400, message: "Id is required" })
})
