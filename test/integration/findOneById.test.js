// import typeorm from 'typeorm';
import {createConnection, randint} from '../helper';
import sinon from 'sinon';
import dataloaderTypeorm from '../../src';
import User from '../model/User';
import expect from 'unexpected';

let connection;

describe('findById', function () {
  beforeEach(async function () {
    this.sandbox = sinon.sandbox.create();
    connection = await createConnection();
  });
  afterEach(function () {
    this.sandbox.restore();
    connection.close();
  });

  describe('id primary key', function () {
    beforeEach(async function () {
      this.userRepository = connection.getRepository(User);
      const newUser = new User();
      newUser.id = randint();

      this.sandbox.spy(this.userRepository, 'find');
      dataloaderTypeorm(this.userRepository);
      this.User = await this.userRepository.persist(newUser);

      this.users = await this.userRepository.persist([
        { id: randint() },
        { id: randint() },
        { id: randint() }
      ]);
    });

    xit('works with null', async function () {
      const result = await this.userRepository.findOneById(null);
      expect(result, 'to be null');
      expect(this.userRepository.find, 'was not called');
    });

    it('batches to a single `find` call', async function () {
      let user1 = this.userRepository.findOneById(this.users[2].id);
      let user2 = this.userRepository.findOneById(this.users[1].id);

      await expect(user1, 'to be fulfilled with', this.users[2]);
      await expect(user2, 'to be fulfilled with', this.users[1]);

      /*
      expect(this.userRepository.getMany, 'was called once');
      expect(this.userRepository.find, 'to have a call satisfying', [{
        where: {
          id: [this.users[2].id, this.users[1].id]
        }
      }]);
      */
    });

    xit('supports rejectOnEmpty', async function () {
      let user1 = this.User.findById(this.users[2].get('id'), { rejectOnEmpty: true })
        , user2 = this.User.findById(42, { rejectOnEmpty: true })
        , user3 = this.User.findById(42);

      await expect(user1, 'to be fulfilled with', this.users[2]);
      await expect(user2, 'to be rejected');
      await expect(user3, 'to be fulfilled with', null);
    });
  });
  /*
  xdescribe('other primary key', function () {
    beforeEach(async function () {
      this.User = connection.define('user', {
        identifier: {
          primaryKey: true,
          type: Sequelize.INTEGER
        }
      });

      this.sandbox.spy(this.User, 'findAll');
      dataloaderSequelize(this.User);

      await this.User.sync({
        force: true
      });

      this.users = await this.User.bulkCreate([
        { identifier: randint() },
        { identifier: randint() },
        { identifier: randint() }
      ], { returning: true });
    });

    it('batches to a single findAll call', async function () {
      let user1 = this.User.findByPrimary(this.users[2].get('identifier'))
        , user2 = this.User.findByPrimary(this.users[1].get('identifier'));

      await expect(user1, 'to be fulfilled with', this.users[2]);
      await expect(user2, 'to be fulfilled with', this.users[1]);

      expect(this.User.findAll, 'was called once');
      expect(this.User.findAll, 'to have a call satisfying', [{
        where: {
          identifier: [this.users[2].get('identifier'), this.users[1].get('identifier')]
        }
      }]);
    });
  });

  describe('primary key with field', function () {
    beforeEach(async function () {
      this.User = connection.define('user', {
        id: {
          primaryKey: true,
          type: Sequelize.INTEGER,
          field: 'identifier'
        }
      });

      this.sandbox.spy(this.User, 'findAll');
      dataloaderSequelize(this.User);

      await this.User.sync({
        force: true
      });

      this.users = await this.User.bulkCreate([
        { id: randint() },
        { id: randint() },
        { id: randint() }
      ], { returning: true });
    });

    it('batches to a single findAll call', async function () {
      let user1 = this.User.findById(this.users[2].get('id'))
        , user2 = this.User.findById(this.users[1].get('id'));

      await expect(user1, 'to be fulfilled with', this.users[2]);
      await expect(user2, 'to be fulfilled with', this.users[1]);

      expect(this.User.findAll, 'was called once');
      expect(this.User.findAll, 'to have a call satisfying', [{
        where: {
          identifier: [this.users[2].get('id'), this.users[1].get('id')]
        }
      }]);
    });
  });

  describe('paranoid', function () {
    beforeEach(async function () {
      this.User = connection.define('user', {}, { paranoid: true });

      this.sandbox.spy(this.User, 'findAll');
      dataloaderSequelize(this.User);

      await this.User.sync({
        force: true
      });

      this.users = await this.User.bulkCreate([
        { id: randint() },
        { id: randint() },
        { id: randint(), deletedAt: new Date() }
      ], { returning: true });
    });

    it('batches to a single findAll call', async function () {
      let user1 = this.User.findById(this.users[2].get('id'))
        , user2 = this.User.findById(this.users[1].get('id'));

      await expect(user1, 'to be fulfilled with', null);
      await expect(user2, 'to be fulfilled with', this.users[1]);

      expect(this.User.findAll, 'was called once');
      expect(this.User.findAll, 'to have a call satisfying', [{
        where: {
          id: [this.users[2].get('id'), this.users[1].get('id')]
        }
      }]);
    });
  });
  */
});
