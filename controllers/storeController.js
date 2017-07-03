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
  req.body.author = req.user._id
  // Set location data to be a point
  req.body.location.type = 'Point'
  const store = await (new Store(req.body)).save()
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
  // Set location data to be a point
  req.body.location.type = 'Point'
  const store = await Store.findOne({_id: req.params.id})
  // Update store values
  store.name = req.body.name
  store.description = req.body.name
  store.location = req.body.location
  store.tags = req.body.tags
  await store.save()
  req.flash('success', `Successfully Updated ${store.name}. <a href="/store/${store.slug}">View store >></a>`)
  res.redirect(`/store/${store.id}/edit`)
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
