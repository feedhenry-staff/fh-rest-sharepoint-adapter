'use strict';

var assert = require('assert')
  , VError = require('verror')
  , sharepointer = require('sharepointer');

module.exports = function (opts) {
  var adapter = {};
  var sp = null;
  var loggedIn = false;

  assert(
    typeof opts,
    'object',
    'opts must be an object'
  );

  assert(
    typeof opts.sharepoint,
    'object',
    'opts.sharepoint must be an object'
  );

  assert(
    typeof opts.title,
    'string',
    'opts.title must be a sharepoint list Title'
  );

  assert(
    typeof opts.guid,
    'string',
    'opts.guid must be a sharepoint list Id'
  );


  // See https://www.npmjs.com/package/sharepointer for valid options
  sp = sharepointer(opts.sharepoint);


  /**
   * We need to ensure a login has occurred before calling sharepoint(er)
   * endpoints/methods, so this wraps a function to ensure we're logged in
   * before executing it
   * @param  {Function} fn
   * @return {Function}
   */
  function ensureLogin (fn) {

    return function _ensureLogin () {
      var args = Array.prototype.slice.call(arguments);
      var callback = args[args.length - 1];

      function onSharepointLogin (err) {
        if (err) {
          callback(
            new VError(
              err,
              'failed to perform sharepoint login for list %s',
              opts.guid
            ),
            null
          );
        } else {
          // We're logged in, so note that so we can avoid this step for
          // future function calls
          loggedIn = true;

          // TODO: Does login expire? Should we set a timeout here to set
          // 'loggedIn' back to false? Can sharepointer handle this for us
          // instead?
          fn.apply(fn, args);
        }
      }

      if (loggedIn) {
        // Already logged in, let's just go ahead and run the function
        fn.apply(fn, args);
      } else {
        // Perform a login
        sp.login(onSharepointLogin);
      }
    };

  }


  adapter.create = ensureLogin(
    function doCreate (params, callback) {
      function onCreate (err, res) {
        if (err) {
          callback(
            new VError(
              err,
              'sharepoint create error for list %s',
              opts.guid
            )
          );
        } else {

          // Need to match sync format
          var ret = {
            uid: res.itemId,
            data: res
          };

          callback(
            null,
            ret
          );
        }
      }

      sp.listItems.create(opts.guid, params.data, onCreate);
    }
  );


  adapter.read = ensureLogin(
    function doRead (params, callback) {

      function onRead (err, res) {
        if (err) {
          callback(
            new VError(
              err,
              'sharepoint read error for list %s for item id %s',
              opts.guid,
              params.id
            ),
            null
          );
        } else {
          callback(null, res);
        }
      }

      sp.listItems.read(opts.guid, params.id, onRead);
    }
  );


  adapter.update = ensureLogin(
    function doUpdate (params, callback) {

      function onUpdate (err, res) {
        if (err) {
          callback(
            new VError(
              err,
              'sharepoint update error for list %s for item id %s',
              opts.guid,
              params.id
            ),
            null
          );
        } else {
          // TODO: need to verify res is the new data, or some other response
          callback(null, res);
        }
      }

      params.data.itemId = params.id;

      sp.listItems.update(opts.guid, params.data, onUpdate);
    }
  );


  adapter.delete = ensureLogin(
    function doDelete (params, callback) {

      function onReadForDelete (err, data) {
        if (err) {
          callback(
            new VError(
              err,
              'delete failed to perform pre-delete read',
              params.id,
              opts.guid
            ),
            null
          );
        } else {
          sp.listItems.del(opts.guid, params.id, function onDelete (err) {
            if (err) {
              callback(
                new VError(
                  err,
                  'sharepoint delete error for %s on list %s',
                  params.id,
                  opts.guid
                ),
                null
              );
            } else {
              callback(null, data);
            }
          });
        }
      }

      adapter.read({
        id: params.id
      }, onReadForDelete);
    }
  );


  adapter.list = ensureLogin(
    // TODO: support query params.query, right now all items will be returned,
    // seems like there's no way to do this using sharepointer. We can add
    // res.Items.filter() if sharepointer/the api cannot do this...maybe
    function doList (params, callback) {
      sp.lists.read(opts.guid, function onList (err, res) {
        if (err) {
          callback(
            new VError(
              err,
              'sharepoint list error for list %s',
              opts.guid
            ),
            null
          );
        } else {
          var ret = {};

          // mapping to fh.sync data format
          res.Items.forEach(function (item) {
            ret[item.itemId] = item;
          });

          callback(null, ret);
        }
      });
    }
  );

  return adapter;
};
