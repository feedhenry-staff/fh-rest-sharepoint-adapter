# fh-rest-sharepoint-adapter

An adapter that can be used with the *fh-rest-express-router* to expose a
RESTful API to a Sharepoint list. Can also be coupled with *fh-rest-sync-proxy*
and FH.Sync to Synchronise a list directly to a device!

## Install

```
npm install feedhenry-staff/fh-rest-sharepoint-adapter
```

## Red Hat Mobile MBaaS Service Usage

```js
'use strict';

var express = require('express')
  , mbaasApi = require('fh-mbaas-api')
  , mbaasExpress = mbaasApi.mbaasExpress()
  , app = module.exports = express()
  , log = require('fh-bunyan').getLogger(__filename);

log.info('starting application');

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys([]));
app.use('/mbaas', mbaasExpress.mbaas);

// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());

// Module used to create RESTful router instances
var fhRestExpressRouter = require('fh-rest-express-router');

// Module that RESTful router will use to retrieve data
// Note: this is not yet developed
var fhRestSharepointAdapter = require('fh-rest-sharepoint-adapter');

// Expose a RESTful API to orders list data, e.g:
// GET /orders/12345
app.use(fhRestExpressRouter(
  'orders',
  fhRestSharepointAdapter({
    sharepoint: {
      // See: // See: https://github.com/cianclarke/sharepointer#parameters for examples
      // of options you can pass and valid values
      username : 'someusername',
      password : 'somepassword',
      type : 'ntlm',
      url : 'https://some-sharepoint-hostname.com',
    },

    // List to expose
    guid: 'some-list-guid-1234567890',
  })
));

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.VCAP_APP_PORT || 8001;
app.listen(port, function() {
  log.info('app started on port: %s', port);
});
```

## Programmatic Usage

```js
var sp = require('fh-rest-sharepoint-adapter')({
  sharepoint: {
    // See: https://github.com/cianclarke/sharepointer#parameters for examples
    // of options you can pass and valid values
    username : 'someusername',
    password : 'somepassword',
    type : 'ntlm',
    url : 'https://some-sharepoint-hostname.com',
  },

  // List to expose
  guid: 'some-list-guid-1234567890',
});

sp.list({
  /* no options supported yet */
}, function (err, items) {
  if (err) {
    console.error('some error occurred', err);
  } else {
    console.log(items);
    // Response format
    // {
    //   'id-0': {
    //     itemId: 'id-0'
    //     name: 'jane'
    //   }
    //   'id-1': {
    //     itemId: 'id-1'
    //     name: 'john'
    //   }
    // }
  }
});
```

## API

#### module(opts)
This module behaves as a factory function. Each call must be passed a list of
Sharepoint options and an "adapter" will be returned for use.

For a list of options that can be passed checkout this repo, [cianclarke/sharepointer](https://github.com/cianclarke/sharepointer#parameters).

```js
var spUsers = require('fh-rest-sharepoint-adapter')({
  sharepoint: {
    // See: https://github.com/cianclarke/sharepointer#parameters for examples
    // of options you can pass and valid values
    username : 'someusername',
    password : 'somepassword',
    type : 'ntlm',
    url : 'https://some-sharepoint-hostname.com',
  },

  // List to expose
  guid: 'user-list-guid-1234567890',
});

// Call methods on the spUsers Object...
```

#### adapter.create(params, callback)
Create an item in the list targeted by this instance.

```js
spUsers.create({
  name: 'jane',
  age: 25
}, function (err, createdItem) {});
```

#### adapter.read(params, callback)
Read an item in the list targeted by this instance. _id_ must be passed in
the params.

```js
spUsers.read({
  id: 'id-0'
}, function (err, readItem) {});
```

#### adapter.update(params, callback)
Update an item in the list targeted by this instance. _id_ and _data_ must be
passed in the params.

```js
spUsers.update({
  id: 'id-0'
  data: {
    name: 'jane',
    age: 24
  }
}, function (err, updatedItem) {});
```

#### adapter.delete(params, callback)
Delete an item in the list targeted by this instance. _id_ must be passed in
the params.

```js
spUsers.update({
  id: 'id-0'
}, function (err, deletedItem) {});
```

#### adapter.list(params, callback)
Perform a create on the list targeted by this instance.

```js
spUsers.list({
  // Params to use to filter, not yet supported
  query: {}
}, function (err, listItems) {});
```
