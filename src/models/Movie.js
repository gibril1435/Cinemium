const { DataTypes, Model } = require('sequelize');

class Movie extends Model {
  static initModel(sequelize) {
    Movie.init({
      MovieID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      Title: { type: DataTypes.STRING(100), allowNull: false },
      Synopsis: { type: DataTypes.TEXT, allowNull: false },
      Genre: { type: DataTypes.STRING(50), allowNull: false },
      Director: { type: DataTypes.STRING(100), allowNull: false },
      Actors: { type: DataTypes.TEXT, allowNull: false },
      ProductionHouse: { type: DataTypes.STRING(100), allowNull: false },
      Duration: { type: DataTypes.INTEGER, allowNull: false },
      PosterURL: { type: DataTypes.STRING(255), allowNull: true },
      IsActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      CreatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
      sequelize,
      modelName: 'Movie',
      tableName: 'Movies',
      timestamps: false,
    });
    return Movie;
  }
}

module.exports = Movie; 