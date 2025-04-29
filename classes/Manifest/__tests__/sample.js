import Manifest from '../Manifest.js'

// Examples for a v3 and v2 Manifest on the way in from a third party source
// let m = new Manifest('https://tpen-project-examples.habesoftware.app/transcription-project/manifest.json')
// let m = new Manifest('https://tpen-project-examples.habesoftware.app/transcription-project-v2/manifest.json')

let m = new Manifest('https://tpen-project-examples.habesoftware.app/transcription-project-v2/manifest.json')
m.load().then(manifest => {
    // manifest is now the loaded and regularized Manifest JSON.
    console.log(manifest)
})
