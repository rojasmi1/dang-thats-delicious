const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter (req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    if (isPhoto) {
      next(null, true)
    } else {
      next({message: 'That filetype isn\'nt allowed!'}, false)
    }
  }
}

exports.homePage = (req, res) => {
  res.render('index')
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if (!req.file) {
    next() // skip to next middleware
    return
  }
  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}`
  // Now we resize
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO)
  await photo.write(`./public/uploads/${req.body.photo}`)
  // Once we have written the photo to our filesystem, keep going
  next()
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.createStore = async (req, res) => {
  const body = req.body
  body.author = req.user._id
  // Set location data to be a point
  body.location.type = 'Point'
  // Parse lat and lng to numbers
  body.location.coordinates = body.location.coordinates.map(parseFloat)

  const store = await (new Store(body)).save()
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`)
  res.redirect(`/store/${store.slug}`)
}


exports.getStores = async (req, res) => {
  const stores = await Store.find()
  res.render('stores', {title: 'Stores', stores})
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({_id: req.params.id})
  confirmOwner(store, req.user)
  res.render('editStore', {title: `Edit ${store.name}`, store})
}

const confirmOwner = (store, user) => {
  if (!store.author.equals(user._id)) {
    throw Error('You must own a store in order to edit it!')
  }
}

exports.updateStore = async (req, res) => {
  const body = req.body
  // Set location data to be a point
  body.location.type = 'Point'
  // Parse lat and lng to numbers
  body.location.coordinates = body.location.coordinates.map(parseFloat)

  const store = await Store.findOne({_id: req.params.id})
  // Update store values
  store.name = body.name
  store.description = body.name
  store.location = body.location
  store.tags = body.tags
  await store.save()
  req.flash('success', `Successfully Updated ${store.name}. <a href="/store/${store.slug}">View store >></a>`)
  res.redirect(`/stores/${store.id}/edit`)
}

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({slug: req.params.slug})
    .populate('author')
  if (!store) {
    return next()
  }
  res.render('store', {title: `${store.name}`, store})
}

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag
  const tagQuery = tag || {$exists: true}
  const tagsPrimise = Store.getTagsList()
  const storesPromise = Store.find({tags: tagQuery})
  const [tags, stores] = await Promise.all([tagsPrimise, storesPromise])
  res.render('tags', {tags, title: 'Tags', tag, stores})
}

exports.searchStores = async (req, res) => {
  const query = req.query.q
  const stores = await Store.find({
    $text: {
      $search: query
    }
  }, {
    score: {$meta: 'textScore'}
  })
  .sort({
    score: {$meta: 'textScore'}
  })
  .limit(5)

  res.json(stores)
}

exports.mapStores = async (req, res) => {
  const coordinates = [req.query.lng, req.query.lat].map(parseFloat)
  const q = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: 10000
      }
    }
  }

  const stores = await Store.find(q)
    .select('slug name description location photo')
    .limit(10)
  res.json(stores)
}

exports.mapPage = async (req, res) => {
  res.render('map', {title: 'Map'})
}
