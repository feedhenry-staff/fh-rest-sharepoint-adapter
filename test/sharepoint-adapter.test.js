'use strict';

var proxyquire = require('proxyquire')
  , expect = require('chai').expect
  , sinon = require('sinon');

describe(__filename, function () {
  var mod, stubs, guid, sp;

  beforeEach(function () {
    guid = '123';

    sp = {
      login: sinon.stub(),
      listItems: {
        create: sinon.stub(),
        read: sinon.stub(),
        update: sinon.stub(),
        del: sinon.stub()
      },
      lists: {
        read: sinon.stub()
      }
    };

    stubs = {
      sharepointer: function () {
        return sp;
      }
    };
    
    mod = proxyquire('../lib/sharepoint-adapter', stubs)({
      guid: guid,
      sharepoint: {}
    });
  });

  describe('#create', function () {
    it('should handle a create error', function (done) {
      sp.login.yields(null);
      sp.listItems.create.yields(new Error('sharepoint create error'));

      mod.create({
        data: {
          name: 'evan'
        }
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;

        expect(err.toString()).to.contain('sharepoint create error for list');
        expect(err.toString()).to.contain('sharepoint create error');

        expect(sp.listItems.create.called).to.be.true;

        done();
      });
    });

    it('should handle a login before create error', function (done) {
      sp.login.yields(new Error('sharepoint login error'));
      mod.create({
        data: {
          name: 'evan'
        }
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;

        expect(err.toString()).to.contain('perform sharepoint login');
        expect(err.toString()).to.contain('sharepoint login error');

        done();
      });
    });

    it('should create an item successfully', function (done) {
      sp.login.yields(null);
      sp.listItems.create.yields(null, {
        name: 'evan',
        itemId: 1230
      });

      mod.create({
        data: {
          name: 'evan'
        }
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.be.an('object');

        expect(res).to.deep.equal({
          data: {
            name: 'evan',
            itemId: 1230
          },
          uid: 1230
        });

        done();
      });
    });

    it('should call login only once', function (done) {
      sp.login.yields(null);
      sp.listItems.create.yields(null, {
        name: 'evan',
        itemId: 1230
      });

      mod.create({
        data: {
          name: 'evan'
        }
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.be.an('object');

        mod.create({
          data: {
            name: 'evan'
          }
        }, function (err, res) {
          expect(err).to.not.exist;
          expect(res).to.be.an('object');
          expect(sp.login.callCount).to.equal(1);

          done();
        });
      });
    });
  });

  describe('#update', function () {
    it('should fail to update an item', function (done) {
      var id = 1230;
      var updateData = {
        name: 'evan',
        itemId: id
      };

      sp.login.yields(null);
      sp.listItems.update.yields(new Error('failed to update'));

      mod.update({
        data: updateData,
        id: id
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(sp.listItems.update.called).to.be.true;
        expect(sp.listItems.update.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.update.getCall(0).args[1]).to.equal(updateData);

        done();
      });
    });

    it('should update an item successfully', function (done) {
      var id = 1230;
      var updateData = {
        name: 'evan',
        itemId: id
      };

      sp.login.yields(null);
      sp.listItems.update.yields(null, updateData);

      mod.update({
        data: updateData,
        id: id
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.be.an('object');
        expect(res).to.deep.equal({
          name: 'evan',
          itemId: 1230
        });
        expect(sp.listItems.update.called).to.be.true;
        expect(sp.listItems.update.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.update.getCall(0).args[1]).to.equal(updateData);

        done();
      });
    });
  });

  describe('#read', function () {
    it('should read an item successfully', function (done) {
      var id = 1230;
      var itemData = {
        name: 'evan',
        itemId: id
      };

      sp.login.yields(null);
      sp.listItems.read.yields(null, itemData);

      mod.read({
        id: id
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.be.an('object');
        expect(res).to.deep.equal(itemData);
        expect(sp.listItems.read.called).to.be.true;
        expect(sp.listItems.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.read.getCall(0).args[1]).to.equal(id);

        done();
      });
    });

    it('should fail to read', function (done) {
      var id = 1230;

      sp.login.yields(null);
      sp.listItems.read.yields(new Error('read error'));

      mod.read({
        id: id
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(err.toString()).to.contain('read error');
        expect(err.toString()).to.contain('sharepoint read error for list');
        expect(sp.listItems.read.called).to.be.true;
        expect(sp.listItems.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.read.getCall(0).args[1]).to.equal(id);

        done();
      });
    });
  });

  describe('#delete', function () {
    it('should delete an item successfully', function (done) {
      var id = 1230;
      var itemData = {
        name: 'evan',
        itemId: id
      };

      sp.login.yields(null);
      sp.listItems.read.yields(null, itemData);
      sp.listItems.del.yields(null);

      mod.delete({
        id: id
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.be.an('object');
        expect(res).to.deep.equal(itemData);
        expect(sp.listItems.read.called).to.be.true;
        expect(sp.listItems.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.read.getCall(0).args[1]).to.equal(id);
        expect(sp.listItems.del.called).to.be.true;
        expect(sp.listItems.del.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.del.getCall(0).args[1]).to.equal(id);
        expect(sp.listItems.del.getCall(0).args[2]).to.be.a('function');

        done();
      });
    });

    it('should fail to delete an item, read failure', function (done) {
      var id = 1230;

      sp.login.yields(null);
      sp.listItems.read.yields(new Error('read err'));

      mod.delete({
        id: id
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(err.toString()).to.contain('read err');
        expect(err.toString()).to.contain(
          'delete failed to perform pre-delete read'
        );
        expect(sp.listItems.read.called).to.be.true;
        expect(sp.listItems.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.read.getCall(0).args[1]).to.equal(id);

        done();
      });
    });

    it('should fail to delete an item, delete failure', function (done) {
      var id = 1230;
      var itemData = {
        name: 'evan',
        itemId: id
      };

      sp.login.yields(null);
      sp.listItems.read.yields(null, itemData);
      sp.listItems.del.yields(new Error('del err'));

      mod.delete({
        id: id
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(err.toString()).to.contain('del err');
        expect(err.toString()).to.contain('sharepoint delete error for');
        expect(sp.listItems.read.called).to.be.true;
        expect(sp.listItems.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.listItems.read.getCall(0).args[1]).to.equal(id);
        expect(sp.listItems.del.called).to.be.true;

        done();
      });
    });
  });

  describe('#list', function () {
    it('should list items', function (done) {
      var list = {
        Items: [{itemId: 10, name: 'a'}, {itemId: 11, name: 'b'}]
      };

      sp.login.yields(null);
      sp.lists.read.yields(null, list);

      mod.list({
        query: {}
      }, function (err, res) {
        expect(err).to.not.exist;
        expect(res).to.be.an('object');
        expect(res).to.deep.equal({
          11: {
            itemId: 11,
            name: 'b'
          },
          10: {
            itemId: 10,
            name: 'a'
          }
        });
        expect(sp.lists.read.called).to.be.true;
        expect(sp.lists.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.lists.read.getCall(0).args[1]).to.be.a('function');

        done();
      });
    });

    it('should fail to list items', function (done) {
      sp.login.yields(null);
      sp.lists.read.yields(new Error('list error!'));

      mod.list({
        query: {}
      }, function (err, res) {
        expect(err).to.exist;
        expect(res).to.not.exist;
        expect(err.toString()).to.contain('sharepoint list error for list');
        expect(err.toString()).to.contain('list error!');
        expect(sp.lists.read.called).to.be.true;
        expect(sp.lists.read.getCall(0).args[0]).to.equal(guid);
        expect(sp.lists.read.getCall(0).args[1]).to.be.a('function');

        done();
      });
    });
  });

});
