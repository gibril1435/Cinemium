const { DataTypes, Model } = require('sequelize');

class Studio extends Model {
  static initModel(sequelize) {
    Studio.init({
      StudioID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      StudioNumber: { type: DataTypes.INTEGER, allowNull: false, unique: true },
      Capacity: { type: DataTypes.INTEGER, allowNull: false },
      IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
      sequelize,
      modelName: 'Studio',
      tableName: 'Studios',
      timestamps: false,
    });
    return Studio;
  }
}

module.exports = Studio; 