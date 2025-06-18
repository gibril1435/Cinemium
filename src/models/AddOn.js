const { DataTypes, Model } = require('sequelize');

class AddOn extends Model {
  static initModel(sequelize) {
    AddOn.init({
      AddOnID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      Name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      Description: { type: DataTypes.STRING(255), allowNull: true },
      Price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
      Stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
      sequelize,
      modelName: 'AddOn',
      tableName: 'AddOns',
      timestamps: false,
    });
    return AddOn;
  }
}

module.exports = AddOn; 