import User from '../model/User';

export default {
  target: User,
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: false
    }
  }
};
