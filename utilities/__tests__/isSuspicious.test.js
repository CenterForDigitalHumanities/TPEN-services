import { isSuspiciousValueString, isSuspiciousJSON } from "../checkIfSuspicious.js"

describe("Suspicious string library. #suspiciousStrings", () => {
     const notations = [
          "<>",
          "{}",
          "()",
          "[]",
          "< >",
          "{ }",
          "( )",
          "[ ]",
          "=[",
          "= [",
          "==",
          "==="
     ]

     const declarations = [
          "<html",
          "<head",
          "<style",
          "<body",
          "<script",
          "<?php",
          "<%",
          "%>",
          "#!",
          "javascript:"
     ]

     const rhel = [
          "sudo ",
          "service httpd",
          "service mongod",
          "service node",
          "pm2 ",
          "nvm ",
          "systemctl",
          "rm -",
          "mv -",
          "cp -",
          "cd -",
          "ls -",
          "ssh ",
          "sftp "
     ]

     const functiony = [
          "if(",
          "if (",
          "for(",
          "for (",
          "forEach(",
          "forEach (",
          "while(",
          "while (",
          "do{",
          "do {",
          "fetch(",
          "fetch (",
          "function(",
          "function (",
          "eval(",
          "eval (",
          "get(",
          "get (",
          "set(",
          "set (",
          "new Function(",
          "=>{",
          "=> {",
          "==",
          "==="
     ]

     const mongoy = [
          "db.anything"
     ]

     const all = [...notations, ...declarations, ...rhel, ...functiony, ...mongoy]
     const safeString = "This (string) is [safe] b/c no code!  #sosafe. Have $1.00."
     const safeJSON = { "value": "This (JSON) is [safe] b/c no code!  #sosafe. Have $1.00." }

     it('returns suspicious warnings for all string values.', () => {
          for (const value of all) {
               if (!isSuspiciousValueString(value)) console.log(value)
               expect(isSuspiciousValueString(value)).toBe(true)
          }
     })

     it('returns suspicious warnings for all JSON values', () => {
          for (const value of all) {
               const common_keys = ["label", "name", "displayName", "value", "body", "target", "text"]
               for (const key of common_keys) {
                    const json1 = {}
                    json1[key] = value
                    const json2 = {}
                    const inner2 = {}
                    inner2[key] = value
                    json2[key] = inner2
                    const json3 = { "label": { "none": value } }
                    expect(isSuspiciousJSON(json1)).toBe(true)
                    expect(isSuspiciousJSON(json2)).toBe(true)
                    expect(isSuspiciousJSON(json3)).toBe(true)
               }
          }

     })

     it('Does not return supicious warning for safe value string.', () => {
          expect(isSuspiciousValueString(safeString)).toBe(false)
     })

     it('Does not return supicious warning for safe JSON.', () => {
          expect(isSuspiciousJSON(safeJSON)).toBe(false)
     })

})
