import * as utils from '../utilities/shared.mjs'
import * as fs from 'fs'

export async function findTheProjectByID(id = null) {
  let project = null
  if (!utils.validateID(id)) return project
  const mockPause = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null)
    }, 1500)
  })

  if (id && id === 7085) {
    let projectFileBuffer = fs.readFileSync('./public/project.json', (err, data) => {
      if (err) throw err
    })
    project = projectFileBuffer !== null && JSON.parse(projectFileBuffer.toString())
  }
  if (project === null) {
    project = await mockPause
  }
  return project
}

export async function findTheProjectUsingID(id = null) {
  return await mongoDatabase.find({_id : id,"@type": "Project"})
}

export async function saveAnnotationCollection(annotationCollection) {
  return await database.save(annotationCollection)
}

export async function updateProjectLayers(project, annotationCollectionId){
project.layers.push(annotationCollectionId)
return await mongoDatabase.update(project)
}

export async function AnnotationCollectionFactory(label, creator, items) {
const id = generateUniqueID()
const context = "http://www.w3.org/ns/anno.jsonld"
const type = "AnnotationCollection"
const total = items.length
//For now just considering part of as is hex, further implemenation is to check for isstub/hex
const partOf = generatePartOf(false)
const annotationPages = items.map(item => AnnotationPageFactory(item.id, item.target, item.items))
const annotationCollection = {
  "@context": context,
  "id": id,
  "type": type,
  "label": label,
  "creator": creator,
  "total": total,
  "partOf": partOf,
  "items": annotationPages
}
return annotationCollection
}

function generateUniqueID() {
const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const idLength = 16
let id = ''
for (let i = 0 ;i < idLength; i++) {
  id += characters.charAt(Math.floor(Math.random() * characters.length))
}
return `https://store.rerum.io/v1/id/${id}`
}

function generatePartOf(isStud) {
const projectType = isStud ? 'stud' : 'hex'
const partOf = `https://static.t-pen.org/${projectType}/project.json`
return partOf
}

function AnnotationPageFactory(id, target, items) {
const pageId = generateUniqueID()
const nextPage = items.length > 1 ? generateUniqueID() : null
const annotations = items.map(item => AnnotationFactory(item.body, item.target))
const annotationPage = {
    '@context': 'http://www.w3.org/ns/anno.jsonld',
    id: pageId,
    type: 'AnnotationPage',
    partOf: id,
    target: target,
    next: nextPage,
    items: annotations
}
return annotationPage
}

function AnnotationFactory(body, target) {
const id = generateUniqueID()
const context = "http://www.w3.org/ns/anno.jsonld"
const type = "Annotation"
if (!isValidURL(target)) {
    throw new Error("Invalid target URL")
}
const annotation = {
    "@context": context,
    "@id": id,
    "type": type,
    "body": body,
    "target": target
}
return annotation
}

function isValidURL(str) {
const pattern = new RegExp('^(https?:\\/\\/)?' +
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
    '((\\d{1,3}\\.){3}\\d{1,3}))' +
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
    '(\\?[;&a-z\\d%_.~+=-]*)?' +
    '(\\#[-a-z\\d_]*)?$', 'i')
return !!pattern.test(str)
}