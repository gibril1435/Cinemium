const { DataTypes, Model } = require('sequelize');

class Showtime extends Model {
  static initModel(sequelize) {
    Showtime.init({
      ShowtimeID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      MovieID: { type: DataTypes.INTEGER, allowNull: false },
      StudioID: { type: DataTypes.INTEGER, allowNull: false },
      ShowDateTime: { type: DataTypes.DATE, allowNull: false },
      Price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
      IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
      sequelize,
      modelName: 'Showtime',
      tableName: 'Showtimes',
      timestamps: false,
    });
    return Showtime;
  }
}

module.exports = Showtime; 