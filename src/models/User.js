const { DataTypes, Model } = require('sequelize');

class User extends Model {
  static initModel(sequelize) {
    User.init({
      UserID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      Username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      PasswordHash: { type: DataTypes.STRING(256), allowNull: false },
      IsAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      LastLoginAt: { type: DataTypes.DATE, allowNull: true },
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
      timestamps: false,
    });
    return User;
  }
}

module.exports = User; 