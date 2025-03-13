import Hotkeys from '../Hotkeys.js'

test('Hotkeys constructor should throw an error if _id is not provided', () => {
    expect(() => new Hotkeys()).toThrowError(new Error("_id is required"))
})

test('Hotkeys constructor should initialize with _id and symbols', () => {
    const hotkeys = new Hotkeys('123', ['a', 'b'])
    expect(hotkeys._id).toBe('123')
    expect(hotkeys.data._id).toBe('123')
    expect(hotkeys.data.symbols).toEqual(['a', 'b'])
})

test('assign should set symbols and return the instance', () => {
    const hotkeys = new Hotkeys('123')
    hotkeys.assign(['a', 'b'])
    expect(hotkeys.data.symbols).toEqual(['a', 'b'])
})

test('assign should throw an error if symbols are not strings', () => {
    const hotkeys = new Hotkeys('123')
    expect(() => hotkeys.assign([1, 2])).toThrowError(new Error("All symbols must be strings"))
})

test('add should add a symbol if it does not exist and return the instance', () => {
    const hotkeys = new Hotkeys('123', ['a'])
    hotkeys.add('b')
    expect(hotkeys.data.symbols).toEqual(['a', 'b'])
})

test('add should not add a symbol if it already exists', () => {
    const hotkeys = new Hotkeys('123', ['a'])
    hotkeys.add('a')
    expect(hotkeys.data.symbols).toEqual(['a'])
})

test('add should throw an error if symbol is not a string', () => {
    const hotkeys = new Hotkeys('123')
    expect(() => hotkeys.add(1)).toThrowError(new Error("Symbol must be a string"))
})

test('remove should remove a symbol if it exists and return the instance', () => {
    const hotkeys = new Hotkeys('123', ['a', 'b'])
    hotkeys.remove('a')
    expect(hotkeys.data.symbols).toEqual(['b'])
})

test('remove should throw an error if symbol is not a string', () => {
    const hotkeys = new Hotkeys('123')
    expect(() => hotkeys.remove(1)).toThrowError(new Error("Symbol must be a string"))
})
