import Manifest from '../Manifest.js'

let m = new Manifest('https://dms-data.stanford.edu/data/manifests/Parker/bc854fy5899/manifest.json')
console.log(m.uri)
console.log(m.manifest)
m.load().then(manifest => console.log(manifest))
// Output:
// https://dms-data.stanford.edu/data/manifests/Parker/bc854fy5899/manifest.json
// null
// {
//     "@context": "http://iiif.io/api/presentation/3/context.json",
//     "id": "https://static.t-pen.org/010101010101010101010101/manifest.json",
//     "type": "Manifest",
//     ...
